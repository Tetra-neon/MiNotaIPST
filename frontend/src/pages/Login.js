import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import "./Login.css";
import { Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(formData.username, formData.password);
      onLogin(response.user);
      navigate('/dashboard'); //línea para redirigir
    } catch (err) {
      setError("Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <button className="back-button" onClick={handleBackToHome}>
          ← Volver al Inicio
        </button>

        <div className="login-header">
          <div className="login-logo">🎓</div>
          <h1>MiNotaIPST</h1>
          <p>Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-options">
            {/* Checkbox para mostrar/ocultar */}
            <label className="show-password">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword((prev) => !prev)}
              />
              <span>Mostrar contraseña</span>
            </label>

            {/* Enlace de recuperación se mantiene igual */}
            <Link to="/recuperar" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>


          {error && <div className="error-message">⚠️ {error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <>
                <span className="loading-spinner-btn"></span>
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>¿No tienes una cuenta? <button onClick={() => navigate('/register')} className="link-btn">Regístrate aquí</button></p>
        </div>
      </div>
    </div>
  );
};

export default Login;