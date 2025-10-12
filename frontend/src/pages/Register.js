import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const timeoutRef = useRef(null);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const contraseñasCoinciden = () => {
    return (
      formData.password &&
      formData.password_confirm &&
      formData.password === formData.password_confirm
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = "El nombre de usuario es requerido";
    } else if (formData.username.length < 3) {
      newErrors.username = "El usuario debe tener al menos 3 caracteres";
    }

    if (!formData.email) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length !== 8) {
      newErrors.password = "La contraseña debe tener 8 caracteres";
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = "Las contraseñas no coinciden";
    }

    if (!formData.first_name) {
      newErrors.first_name = "El nombre es requerido";
    }

    if (!formData.last_name) {
      newErrors.last_name = "El apellido es requerido";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log('Enviando datos:', formData);
      const response = await authService.register(formData);
      console.log('Respuesta exitosa:', response);

      setSuccess(true);

      // Usar setTimeout para la navegación
      timeoutRef.current = setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error response:', err.response);

      if (err.response?.data) {
        // Manejar diferentes tipos de errores del backend
        const errorData = err.response.data;
        console.log('Datos del error:', errorData);

        if (typeof errorData === 'object' && errorData !== null) {
          // Si el error es un objeto con campos específicos
          const formattedErrors = {};

          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              formattedErrors[key] = errorData[key][0];
            } else if (typeof errorData[key] === 'string') {
              formattedErrors[key] = errorData[key];
            }
          });

          // Si hay un error general o no hay errores específicos
          if (Object.keys(formattedErrors).length === 0) {
            formattedErrors.general = "Error al registrar usuario. Intenta nuevamente.";
          }

          setErrors(formattedErrors);
        } else if (typeof errorData === 'string') {
          setErrors({ general: errorData });
        } else {
          setErrors({ general: "Error al registrar usuario. Intenta nuevamente." });
        }
      } else if (err.message) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: "Error de conexión. Verifica tu conexión a internet." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo específico
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (success) {
    return (
      <div className="register-container">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>¡Registro Exitoso!</h2>
          <p>Tu cuenta ha sido creada correctamente.</p>
          <p>Serás redirigido al login en unos segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <button
          className="back-button"
          onClick={() => navigate('/')}
          type="button"
        >
          ← Volver al Inicio
        </button>

        <div className="register-header">
          <div className="register-logo">🎓</div>
          <h1>Crear Cuenta</h1>
          <p>Únete a MiNotaIPST y gestiona tus asignaturas</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Nombre</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={errors.first_name ? 'error' : ''}
                  autoComplete="given-name"
                />
              </div>
              {errors.first_name && <span className="field-error">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Apellido</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={errors.last_name ? 'error' : ''}
                  autoComplete="family-name"
                />
              </div>
              {errors.last_name && <span className="field-error">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Nombre de Usuario</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Elige un nombre de usuario"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'error' : ''}
                autoComplete="username"
              />
            </div>
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Debe contener 8 caracteres"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                autoComplete="new-password"
                minLength={8}
                maxLength={8}
              />
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password_confirm">Confirmar Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                placeholder="Repite tu contraseña"
                value={formData.password_confirm}
                onChange={handleChange}
                className={errors.password_confirm ? 'error' : ''}
                autoComplete="new-password"
                minLength={8}
                maxLength={8}
              />
            </div>
            <div className="password-match-message">
              {formData.password_confirm && (
                <span className={contraseñasCoinciden() ? 'ok' : 'error'}>
                  {contraseñasCoinciden()
                    ? '✅ Las contraseñas coinciden'
                    : '❌ Las contraseñas no coinciden'}
                </span>
              )}
            </div>

            {errors.password_confirm && <span className="field-error">{errors.password_confirm}</span>}
          </div>

          {errors.general && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{errors.general}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="register-btn"
          >
            {loading ? (
              <>
                <span className="loading-spinner-btn"></span>
                <span>Creando cuenta...</span>
              </>
            ) : (
              "Crear Cuenta"
            )}
          </button>

          <div className="terms-text">
            Al registrarte, aceptas nuestros{' '}
            <Link to="/terminos">Términos de Servicio</Link>
            {' '}y{' '}
            <Link to="/privacidad">Política de Privacidad</Link>
          </div>
        </form>

        <div className="register-footer">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="link-btn">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;