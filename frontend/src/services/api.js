import axios from "axios";

// URL base de tu API Django
const API_URL = "http://localhost:8000/api";

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================================================================
// 1. INTERCEPTORES (Manejo de Tokens)
// ================================================================

// Request: Adjunta el token a cada petición si existe
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: Maneja errores 401 (Token vencido) automáticamente
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos reintentado aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("🔄 Token expirado, intentando refrescar...");
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh");
        if (refreshToken) {
          // Intentamos obtener un nuevo token de acceso
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          if (response.data.access) {
            // Guardamos el nuevo token
            localStorage.setItem("token", response.data.access);
            
            // Actualizamos la cabecera de la petición original y reintentamos
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            console.log("✅ Token refrescado exitosamente");
            return API(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("❌ Sesión caducada. Por favor inicie sesión nuevamente.");
        // Si falla el refresh, limpiamos todo y redirigimos
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ================================================================
// 2. SERVICIOS
// ================================================================

export const authService = {
  login: async (username, password) => {
    try {
      // Intentamos con endpoint JWT estándar (Djoser/SimpleJWT)
      const response = await API.post("/token/", { username, password });
      
      if (response.data.access) {
        localStorage.setItem("token", response.data.access);
        localStorage.setItem("refresh", response.data.refresh);
        
        // Obtenemos datos del usuario inmediatamente para guardarlos
        const userResponse = await API.get("/profile/");
        localStorage.setItem("user", JSON.stringify(userResponse.data));
        
        return {
            tokens: response.data,
            user: userResponse.data
        };
      }
    } catch (error) {
      console.error("❌ Error en login:", error);
      throw error;
    }
  },

  register: async (userData) => {
    // Usamos el endpoint de Djoser si está disponible, o el tuyo personalizado
    // Ajustado a tu ruta actual 'auth/register/'
    const response = await API.post("/auth/register/", userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    // Opcional: Llamar al backend para invalidar refresh token
  },

  resetPassword: async (email) => {
    // Llama a Djoser para enviar el correo de recuperación
    // Ruta estándar de Djoser: /auth/users/reset_password/
    // O tu ruta personalizada si la mantienes: /auth/reset-password/
    return await API.post("/auth/users/reset_password/", { email });
  },

  getCurrentUser: async () => {
    const response = await API.get("/profile/");
    return response.data;
  },
};

// --- CONFIGURACIÓN GLOBAL ---
export const getGlobalConfig = async () => {
    try {
        // Esta ruta debe coincidir con la que creamos en accounts/urls.py
        const response = await API.get("/config/global/");
        return response.data;
    } catch (error) {
        console.warn("No se pudo cargar la config global, usando valores por defecto.");
        return null;
    }
};

// --- PERIODOS ACADÉMICOS ---
export const periodoService = {
  getAll: async () => {
    const response = await API.get("/periodos/");
    return response.data;
  },

  create: async (data) => {
    const response = await API.post("/periodos/", data);
    return response.data;
  },

  getActive: async () => {
    try {
        const response = await API.get("/periodos/active/");
        // Si devuelve 204 o vacío, retornamos null
        return response.data || null;
    } catch (error) {
        return null;
    }
  },

  setActive: async (id) => {
    // Llamamos a la acción extra que definimos o usamos PATCH directo
    // Si usas el PATCH en el modelo:
    const response = await API.patch(`/periodos/${id}/`, { activo: true });
    return response.data;
  }
};

// --- ASIGNATURAS (Soporta filtrado por semestre) ---
export const subjectService = {
  getAll: async (periodoId = null) => {
    const config = {};
    if (periodoId) {
        // Si enviamos 'active', el backend lo interpreta gracias a tu ViewSet
        config.params = { periodo: periodoId };
    }
    const response = await API.get("/subjects/", config);
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

  // Funciones específicas de lógica de negocio
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

// --- DASHBOARD ---
export const dashboardService = {
  getSummary: async () => {
    // Tu vista dashboard_summary está en grades/views.py y mapeada en grades/urls.py
    const response = await API.get("/dashboard/summary/");
    return response.data;
  }
};

export default API;