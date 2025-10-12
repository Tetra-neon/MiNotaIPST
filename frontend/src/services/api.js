import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token a las peticiones
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("🔍 Interceptor - Token encontrado:", !!token);
    console.log("🔍 Interceptor - URL:", config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Header Authorization agregado");
    }
    return config;
  },
  (error) => {
    console.error("❌ Error en interceptor request:", error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
API.interceptors.response.use(
  (response) => {
    console.log("✅ Respuesta exitosa:", response.status);
    return response;
  },
  async (error) => {
    console.error("❌ Error en respuesta:", error.response?.status, error.response?.data);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("🔄 Token expirado, intentando refrescar...");
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh");
        if (refreshToken) {
          const response = await axios.post(
            "http://localhost:8000/api/token/refresh/",
            { refresh: refreshToken }
          );

          if (response.data.access) {
            localStorage.setItem("token", response.data.access);
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            console.log("✅ Token refrescado exitosamente");
            return API(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("❌ Error al refrescar token:", refreshError);
        // Limpiar todo y redirigir al login
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    try {
      console.log("🔐 Intentando login...");
      
      // MÉTODO 1: Intentar con endpoint JWT estándar
      try {
        const jwtResponse = await axios.post("http://localhost:8000/api/token/", {
          username,
          password
        });
        
        if (jwtResponse.data.access && jwtResponse.data.refresh) {
          localStorage.setItem("token", jwtResponse.data.access);
          localStorage.setItem("refresh", jwtResponse.data.refresh);
          
          console.log("✅ Login JWT exitoso");
          
          // Crear usuario básico
          const basicUser = { 
            username: username,
            id: 1 
          };
          localStorage.setItem("user", JSON.stringify(basicUser));
          
          return {
            tokens: {
              access: jwtResponse.data.access,
              refresh: jwtResponse.data.refresh
            },
            user: basicUser
          };
        }
      } catch (jwtError) {
        console.log("⚠️ JWT estándar falló, intentando endpoint personalizado...");
        
        // MÉTODO 2: Usar endpoint personalizado de login
        const customResponse = await API.post("/auth/login/", { username, password });
        
        if (customResponse.data.tokens) {
          localStorage.setItem("token", customResponse.data.tokens.access);
          localStorage.setItem("refresh", customResponse.data.tokens.refresh);
          
          if (customResponse.data.user) {
            localStorage.setItem("user", JSON.stringify(customResponse.data.user));
          }
          
          console.log("✅ Login personalizado exitoso");
          return customResponse.data;
        }
      }
      
    } catch (error) {
      console.error("❌ Error en login:", error.response?.data || error.message);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      console.log("📝 Enviando datos de registro:", userData);
      const response = await API.post("/auth/register/", userData);
      
      if (response.data.tokens) {
        localStorage.setItem("token", response.data.tokens.access);
        localStorage.setItem("refresh", response.data.tokens.refresh);
      }
      
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      
      console.log("✅ Registro exitoso:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error en registro:", error.response?.data || error.message);
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refresh");
    if (refreshToken) {
      try {
        await API.post("/auth/logout/", { refresh_token: refreshToken });
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    }
    
    // Limpiar todo el localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  getAccessToken: () => {
    return localStorage.getItem("token");
  },

  getCurrentUser: async () => {
    try {
      const response = await API.get("/profile/");
      return response.data;
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      throw error;
    }
  }
};

export const subjectService = {
  getAll: async () => {
    const response = await API.get("/subjects/");
    return response.data;
  },

  create: async (subjectData) => {
    const response = await API.post("/subjects/", subjectData);
    return response.data;
  },

  update: async (id, subjectData) => {
    const response = await API.patch(`/subjects/${id}/`, subjectData);
    return response.data;
  },

  delete: async (id) => {
    const response = await API.delete(`/subjects/${id}/`);
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/subjects/${id}/`);
    return response.data;
  },

  updateAttendance: async (id, attendanceData) => {
    const response = await API.patch(`/subjects/${id}/attendance/`, attendanceData);
    return response.data;
  },

  estimateGrades: async (id, targetGrade) => {
    const data = targetGrade ? { target_grade: targetGrade } : {};
    const response = await API.post(`/subjects/${id}/estimate_grades/`, data);
    return response.data;
  },

  getCalculationHistory: async (id) => {
    const response = await API.get(`/subjects/${id}/calculation_history/`);
    return response.data;
  }
};

export const dashboardService = {
  getSummary: async () => {
    const response = await API.get("/dashboard/");
    return response.data;
  },
  
  getGradesSummary: async () => {
    const response = await API.get("/grades/dashboard/");
    return response.data;
  }
};

export const estadisticasService = {
  getGenerales: async (periodo = 'actual') => {
    const response = await API.get(`/estadisticas/?periodo=${periodo}`);
    return response.data;
  },

  getPorAsignatura: async (asignaturaId) => {
    const response = await API.get(`/estadisticas/asignatura/${asignaturaId}/`);
    return response.data;
  }
};

export default API;