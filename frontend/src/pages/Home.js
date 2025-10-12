import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleFeatureClick = () => {
    navigate('/login');
  };

  return (
    <div className="home">
      {/* Header */}
      <header className="home-header">
        <div className="header-container">
          <div className="logo">
            <h1>🎓MiNotaIPST</h1>
          </div>
          <nav className="nav-menu">
            <a href="#inicio" className="nav-link active">Inicio</a>
            <button onClick={handleLogin} className="nav-link">Login</button>
            <button onClick={() => navigate('/register')} className="nav-link">Registro</button>
            <button onClick={() => navigate('/contacto')} className="nav-link">Contacto</button>
          </nav>
        </div>
      </header>

      {/* Banner Principal */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Gestiona tus Notas Universitarias de Forma Inteligente
            </h1>
            <p className="hero-subtitle">
              Planifica tu semestre, calcula tus notas y alcanza tus metas académicas con la herramienta más completa para estudiantes de enseñanza superior.
            </p>
            <div className="hero-actions">
              <button onClick={handleGetStarted} className="btn-primary">
                Comenzar Gratis
              </button>
              <button onClick={handleLogin} className="btn-secondary">
                Iniciar Sesión
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <div className="illustration-card">
                <div className="card-icon">📚</div>
                <div className="card-text">Asignaturas</div>
              </div>
              <div className="illustration-card">
                <div className="card-icon">📊</div>
                <div className="card-text">Estadísticas</div>
              </div>
              <div className="illustration-card">
                <div className="card-icon">📝</div>
                <div className="card-text">Evaluaciones</div>
              </div>
              <div className="illustration-card">
                <div className="card-icon">📅</div>
                <div className="card-text">Asistencia</div>
              </div>
              <div className="illustration-card">
                <div className="card-icon">⚠️</div>
                <div className="card-text">Alertas</div>
              </div>
              <div className="illustration-card">
                <div className="card-icon">📈</div>
                <div className="card-text">Calculadora</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Funcionalidades n.n */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2>Funcionalidades que Transformarán tu Experiencia Académica</h2>
            <p>Descubre todas las herramientas que tenemos para ti</p>
          </div>

          <div className="features-grid">
            <div className="feature-card" onClick={handleFeatureClick}>
              <div className="feature-icon">📚</div>
              <h3>Gestión de Asignaturas</h3>
              <p>Organiza todas tus materias del semestre</p>
              <div className="feature-hover">
                <p>Registra tus asignaturas, configura porcentajes de evaluación, horarios y mantén toda tu información académica organizada en un solo lugar.</p>
              </div>
            </div>

            <div className="feature-card" onClick={handleFeatureClick}>
              <div className="feature-icon">📊</div>
              <h3>Estadísticas Inteligentes</h3>
              <p>Visualiza tu rendimiento académico</p>
              <div className="feature-hover">
                <p>Obtén gráficos detallados de tu progreso, analiza tendencias de rendimiento y visualiza tu evolución académica con reportes personalizados.</p>
              </div>
            </div>

            <div className="feature-card" onClick={handleFeatureClick}>
              <div className="feature-icon">📝</div>
              <h3>Control de Evaluaciones</h3>
              <p>Registra y gestiona todas tus notas</p>
              <div className="feature-hover">
                <p>Mantén un registro completo de todas tus evaluaciones, parciales, proyectos y trabajos con historial detallado de tu progreso académico.</p>
              </div>
            </div>

            <div className="feature-card" onClick={handleFeatureClick}>
              <div className="feature-icon">📈</div>
              <h3>Calculadora de Notas</h3>
              <p>Planifica tus metas académicas</p>
              <div className="feature-hover">
                <p>Calcula qué nota necesitas para aprobar, simula diferentes escenarios y planifica estratégicamente tus próximas evaluaciones.</p>
              </div>
            </div>

            <div className="feature-card" onClick={handleFeatureClick}>
              <div className="feature-icon">📅</div>
              <h3>Control de Asistencia</h3>
              <p>Gestiona tus faltas inteligentemente</p>
              <div className="feature-hover">
                <p>Controla automáticamente tu asistencia con límites del 75% (teoría) y 90% (laboratorio). Calcula cuántas faltas puedes tener sin reprobar.</p>
              </div>
            </div>

            <div className="feature-card" onClick={handleFeatureClick}>
              <div className="feature-icon">⚠️</div>
              <h3>Alertas de Riesgo</h3>
              <p>Prevención automática de reprobación</p>
              <div className="feature-hover">
                <p>Sistema inteligente que te alerta cuando estás en riesgo de reprobar por asistencia o notas, con recomendaciones específicas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>¿Listo para Transformar tu Experiencia Universitaria?</h2>
          <p>Únete a miles de estudiantes que ya están optimizando su rendimiento académico</p>
          <div className="cta-actions">
            <button onClick={handleGetStarted} className="btn-primary large">
              Registrarse Ahora
            </button>
            <p className="cta-login">
              ¿Ya tienes cuenta?
               <br />
              <button onClick={handleLogin} className="link-button">
              Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>🎓MiNotaIPST</h3>
              <p>Por estudiantes y para estudiantes. La herramienta definitiva para la gestión académica superior.</p>
            </div>
            <div className="footer-section">
              <h4>Enlaces</h4>
              <ul>
                <li>
                  <button onClick={() => navigate('/')}>Inicio</button>
                </li>
                <li>
                  <button onClick={() => navigate('/login')}>Acceso</button>
                </li>
                <li>
                  <button onClick={() => navigate('/register')}>Registro</button>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Soporte</h4>
              <ul>
                <li>
                  <button onClick={() => navigate('/contacto')}>Contacto</button>
                </li>
                <li><a href="#terminos">Términos de Uso</a></li>
                <li><a href="mailto:notificaciones.ipst@gmail.com">notificaciones.ipst@gmail.com</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 MiNotaIPST. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;