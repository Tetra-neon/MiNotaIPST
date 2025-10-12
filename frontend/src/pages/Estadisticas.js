import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Estadisticas.css";

const Estadisticas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("actual");
  
  // Datos simulados para las estadísticas
  const [stats, setStats] = useState({
    promedioGeneral: 5.8,
    creditosTotales: 18,
    creditosAprobados: 12,
    asignaturasTotal: 6,
    asignaturasAprobadas: 4,
    asistenciaPromedio: 87,
    notaMaxima: 6.8,
    notaMinima: 3.2,
    tendencia: "mejorando"
  });

  const [promediosPorMes] = useState([
    { mes: "Marzo", promedio: 5.2 },
    { mes: "Abril", promedio: 5.4 },
    { mes: "Mayo", promedio: 5.6 },
    { mes: "Junio", promedio: 5.8 },
  ]);

  const [asignaturaStats] = useState([
    { nombre: "Programación Avanzada", promedio: 6.2, asistencia: 92 },
    { nombre: "Base de Datos II", promedio: 5.8, asistencia: 88 },
    { nombre: "Redes de Computadores", promedio: 5.4, asistencia: 85 },
    { nombre: "Sistemas Operativos", promedio: 5.9, asistencia: 90 },
  ]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="estadisticas-loading">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="estadisticas-page">
      {/* Header */}
      <header className="estadisticas-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Volver al Dashboard
          </button>
          <h1>Estadísticas Académicas</h1>
          <select 
            className="periodo-select"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option value="actual">Semestre Actual</option>
            <option value="anterior">Semestre Anterior</option>
            <option value="año">Año Completo</option>
          </select>
        </div>
      </header>

      <div className="estadisticas-container">
        {/* Resumen Principal */}
        <div className="stats-summary">
          <div className="stat-card promedio-general">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Promedio General</h3>
              <p className="stat-value">{stats.promedioGeneral.toFixed(1)}</p>
              <span className={`tendencia ${stats.tendencia}`}>
                {stats.tendencia === "mejorando" ? "↑" : "↓"} 
                {stats.tendencia === "mejorando" ? " Mejorando" : " Bajando"}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>Asignaturas</h3>
              <p className="stat-value">{stats.asignaturasAprobadas}/{stats.asignaturasTotal}</p>
              <span className="stat-label">Aprobadas</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <h3>Créditos</h3>
              <p className="stat-value">{stats.creditosAprobados}/{stats.creditosTotales}</p>
              <span className="stat-label">Completados</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>Asistencia</h3>
              <p className="stat-value">{stats.asistenciaPromedio}%</p>
              <span className="stat-label">Promedio</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Evolución */}
        <div className="chart-section">
          <h2>Evolución del Promedio</h2>
          <div className="chart-container">
            <div className="chart">
              {promediosPorMes.map((data, index) => (
                <div key={index} className="chart-bar-container">
                  <div 
                    className="chart-bar"
                    style={{
                      height: `${(data.promedio / 7) * 100}%`,
                      background: data.promedio >= 5.5 ? '#16a34a' : 
                                 data.promedio >= 4.0 ? '#d97706' : '#dc2626'
                    }}
                  >
                    <span className="bar-value">{data.promedio}</span>
                  </div>
                  <span className="bar-label">{data.mes}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rendimiento por Asignatura */}
        <div className="subjects-performance">
          <h2>Rendimiento por Asignatura</h2>
          <div className="performance-list">
            {asignaturaStats.map((asignatura, index) => (
              <div key={index} className="performance-item">
                <div className="subject-info">
                  <h4>{asignatura.nombre}</h4>
                  <div className="subject-stats">
                    <span className="stat-badge promedio">
                      Promedio: {asignatura.promedio}
                    </span>
                    <span className="stat-badge asistencia">
                      Asistencia: {asignatura.asistencia}%
                    </span>
                  </div>
                </div>
                <div className="progress-bars">
                  <div className="progress-item">
                    <label>Promedio</label>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill promedio"
                        style={{ width: `${(asignatura.promedio / 7) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="progress-item">
                    <label>Asistencia</label>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill asistencia"
                        style={{ width: `${asignatura.asistencia}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="insights-section">
          <h2>Insights y Recomendaciones</h2>
          <div className="insights-grid">
            <div className="insight-card success">
              <div className="insight-icon">✅</div>
              <h3>Fortalezas</h3>
              <ul>
                <li>Tu promedio ha mejorado en los últimos 3 meses</li>
                <li>Excelente asistencia en Programación Avanzada (92%)</li>
                <li>4 de 6 asignaturas ya están aprobadas</li>
              </ul>
            </div>
            
            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <h3>Áreas de Mejora</h3>
              <ul>
                <li>La asistencia en Redes está cerca del límite (85%)</li>
                <li>2 asignaturas necesitan subir el promedio</li>
                <li>Faltan 6 créditos por completar</li>
              </ul>
            </div>
            
            <div className="insight-card info">
              <div className="insight-icon">💡</div>
              <h3>Recomendaciones</h3>
              <ul>
                <li>Enfócate en subir el promedio de las 2 asignaturas pendientes</li>
                <li>No faltes más a Redes de Computadores</li>
                <li>Mantén el ritmo actual para terminar bien el semestre</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;