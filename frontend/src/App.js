import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Asignaturas from "./pages/Asignaturas";
import Periodos from './pages/Periodos';
import CalculadoraNotas from "./pages/CalculadoraNotas";
import Contact from "./pages/Contact";
import { authService } from "./services/api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("App iniciando, verificando autenticación...");

    // Verificar autenticación con localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    console.log("Token encontrado:", !!token);
    console.log("Usuario guardado:", !!savedUser);

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log("Usuario cargado desde localStorage:", userData);
        setUser(userData);

        // Verificar que el token sea válido
        const isValid = checkTokenValidity(token);
        if (!isValid) {
          console.log("Token expirado, limpiando sesión...");
          handleLogout();
        }
      } catch (error) {
        console.error("Error al parsear usuario:", error);
        // Si hay error, limpiar localStorage
        handleLogout();
      }
    }

    setLoading(false);
  }, []);

  // Función para verificar validez del token
  const checkTokenValidity = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const now = Date.now() / 1000;

      return payload.exp > now;
    } catch (error) {
      return false;
    }
  };

  const handleLogin = (userData) => {
    console.log("App: Manejando login con datos:", userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    console.log("App: Manejando logout...");

    try {
      await authService.logout();
    } catch (error) {
      console.error("Error en logout:", error);
    }

    setUser(null);
    // Limpiar completamente localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
  };

  // Verificar periódicamente si el token sigue siendo válido
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        const token = localStorage.getItem('token');
        if (token && !checkTokenValidity(token)) {
          console.log("Token expirado detectado, cerrando sesión...");
          handleLogout();
        }
      }, 60000); // Verificar cada minuto

      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  console.log("App renderizando con usuario:", user);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta del home público */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Home />
              )
            }
          />

          {/* Ruta de login */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          {/* Ruta de registro */}
          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />

          {/* AGREGAR RUTA DE CONTACTO */}
          <Route
            path="/contacto"
            element={<Contact />}
          />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              user ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/periodos"
            element={
              user ? (
                <Periodos />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/asignaturas"
            element={
              user ? (
                <Asignaturas />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/asignaturas/:id"
            element={
              user ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h1>Detalle de Asignatura</h1>
                  <p>Esta sección está en desarrollo...</p>
                  <button onClick={() => window.history.back()}>Volver</button>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/calculadora"
            element={
              user ? (
                <CalculadoraNotas />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/estadisticas"
            element={
              user ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h1>Estadísticas</h1>
                  <p>Esta sección está en desarrollo...</p>
                  <button onClick={() => window.history.back()}>Volver</button>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;