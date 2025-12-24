import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService, periodoService } from "../services/api";
import "./Dashboard.css";

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [periodoActivo, setPeriodoActivo] = useState(null);

  useEffect(() => {
    // Cargar el nombre del semestre activo al entrar
    const loadPeriodo = async () => {
      const active = await periodoService.getActive();
      setPeriodoActivo(active);
    };
    loadPeriodo();
  }, []);

  const handleLogout = async () => {
    await authService.logout(); // Agregar await
    onLogout();
    navigate('/');
  };

  // Handlers para los botones del dashboard
  const handleViewSubjects = () => {
    navigate('/asignaturas');
  };

  const handleViewStatistics = () => {
    navigate('/estadisticas');
  };

  const handleManageGrades = () => {
    alert('🚧 Funcionalidad "Gestionar Notas" en desarrollo.\n\nPróximamente podrás:\n• Registrar nuevas evaluaciones\n• Editar notas existentes\n• Ver historial completo');
  };

  const handleCalculateGrades = () => {
    navigate('/calculadora');
  };

  const handleAttendanceControl = () => {
    alert('🚧 Funcionalidad "Control de Asistencia" en desarrollo.\n\nPróximamente podrás:\n• Registrar faltas por asignatura\n• Ver límites automáticos (75% teoría, 90% lab)\n• Calcular faltas restantes permitidas\n• Alertas de riesgo de reprobación');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🎓MiNotaIPST</h1>
          <div className="user-info">
            <span>Bienvenido, {user?.username || 'Usuario'}!</span>
            <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Dashboard del Estudiante</h2>
          {periodoActivo ? (
            <div className="active-period-badge">
              📅 Semestre Actual: <strong>{periodoActivo.nombre}</strong>
            </div>
          ) : (
            <div className="warning-period">
              ⚠️ No hay semestre activo. Crea uno para empezar.
            </div>
          )}
          <p>Gestiona tus asignaturas y calcula tus notas</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📚</div>
            <h3>Asignaturas</h3>
            <p>Gestiona tus materias</p>
            <button className="card-btn" onClick={handleViewSubjects}>
              Ver Asignaturas
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Estadísticas</h3>
            <p>Analiza tu rendimiento</p>
            <button className="card-btn" onClick={handleViewStatistics}>
              Ver Estadísticas
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📝</div>
            <h3>Evaluaciones</h3>
            <p>Evaluaciones pendientes</p>
            <button className="card-btn" onClick={handleManageGrades}>
              Gestionar Notas
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📈</div>
            <h3>Calculadora</h3>
            <p>Estima tus notas futuras</p>
            <button className="card-btn" onClick={handleCalculateGrades}>
              Calcular Notas
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📅</div>
            <h3>Asistencia</h3>
            <p>Control inteligente de faltas</p>
            <button className="card-btn" onClick={handleAttendanceControl}>
              Gestionar Asistencia
            </button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚠️</div>
            <h3>Alertas</h3>
            <p>Prevención automótica de riegos</p>
            <button className="card-btn" onClick={handleAttendanceControl}>
              Gestionar Asistencia
            </button>
          </div>

          <div className="dashboard-card periodos-card">
            <div className="card-icon">🗓️</div>
            <h3>Semestres</h3>
            <p>Historial y Nuevos Periodos</p>
            <button className="card-btn" onClick={() => navigate('/periodos')}>
              Gestionar Semestres
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;