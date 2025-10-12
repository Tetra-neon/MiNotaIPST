import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subjectService } from "../services/api";
import "./CalculadoraNotas.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const CalculadoraNotas = () => {
  const navigate = useNavigate();
  const [asignaturas, setAsignaturas] = useState([]);
  const [selectedAsignatura, setSelectedAsignatura] = useState(null);
  const [notas, setNotas] = useState({});
  const [targetGrade, setTargetGrade] = useState("");
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAsignaturas();
  }, []);

  const fetchAsignaturas = async () => {
    try {
      setLoading(true);
      const data = await subjectService.getAll();
      setAsignaturas(data.results || data);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar las asignaturas");
    } finally {
      setLoading(false);
    }
  };

  const handleAsignaturaChange = (e) => {
    const asignaturaId = e.target.value;
    const asignatura = asignaturas.find(a => a.id.toString() === asignaturaId);
    setSelectedAsignatura(asignatura);
    setEstimation(null);
    setTargetGrade("");

    // Cargar las notas existentes
    if (asignatura && asignatura.evaluations) {
      const notasExistentes = {};
      asignatura.evaluations.forEach(evaluation => {
        if (evaluation.grade) {
          notasExistentes[evaluation.id] = evaluation.grade.toString();
        }
      });
      setNotas(notasExistentes);
    } else {
      setNotas({});
    }
  };

  const handleNotaChange = (evaluationId, value) => {
    setNotas(prev => ({
      ...prev,
      [evaluationId]: value
    }));
  };

  const handleClearNota = async (evaluationId) => {
    try {
      setSaving(true);

      // Llamar al backend para limpiar la nota
      const response = await fetch(`${API_URL}/evaluations/${evaluationId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ grade: null })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al vaciar');
      }

      // Limpiar del estado local
      setNotas(prev => {
        const newNotas = { ...prev };
        delete newNotas[evaluationId];
        return newNotas;
      });

      // Recargar la asignatura para actualizar los datos
      const updatedData = await subjectService.getById(selectedAsignatura.id);
      setSelectedAsignatura(updatedData);

      // Actualizar la lista de asignaturas
      setAsignaturas(prev => prev.map(a =>
        a.id === selectedAsignatura.id ? updatedData : a
      ));

      alert("Nota vaciada exitosamente");
    } catch (err) {
      console.error("Error:", err);
      alert(`Error al vaciar la nota: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNota = async (evaluationId) => {
    const nota = parseFloat(notas[evaluationId]);
    if (isNaN(nota) || nota < 1 || nota > 7) {
      alert("La nota debe estar entre 1.0 y 7.0");
      return;
    }

    try {
      setSaving(true);
      // CORREGIDO: Bearer en lugar de Token
      const response = await fetch(`${API_URL}/evaluations/${evaluationId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ grade: nota })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar');
      }

      // Recargar la asignatura para actualizar los datos
      const updatedData = await subjectService.getById(selectedAsignatura.id);
      setSelectedAsignatura(updatedData);

      // Actualizar la lista de asignaturas
      setAsignaturas(prev => prev.map(a =>
        a.id === selectedAsignatura.id ? updatedData : a
      ));

      alert("Nota guardada exitosamente");
    } catch (err) {
      console.error("Error:", err);
      alert(`Error al guardar la nota: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // FUNCIÓN CORREGIDA: Cálculo local con validaciones
  const calculateLocalEstimation = (asignatura, targetGrade) => {
    // 🔧 VALIDACIONES AGREGADAS
    if (!asignatura || !asignatura.evaluations) {
      console.error("Asignatura o evaluaciones no válidas");
      return null;
    }

    const evaluations = asignatura.evaluations;
    const target = targetGrade || asignatura.passing_grade;

    // 🔧 VALIDAR TARGET
    if (!target || isNaN(target)) {
      console.error("Target grade no válido:", target);
      return null;
    }

    console.log("=== INICIANDO CÁLCULO ===");
    console.log("Asignatura:", asignatura.name);
    console.log("Nota objetivo:", target);
    console.log("Evaluaciones:", evaluations);

    let puntosActuales = 0;
    let pesoCompletado = 0;
    const evaluacionesCompletadas = [];
    const evaluacionesPendientes = [];

    // Separar evaluaciones completadas y pendientes
    evaluations.forEach(evaluacion => {
      const tieneNota = evaluacion.grade || notas[evaluacion.id];
      if (tieneNota) {
        const nota = parseFloat(evaluacion.grade || notas[evaluacion.id]);
        const percentage = parseFloat(evaluacion.percentage);

        // 🔧 VALIDACIONES AGREGADAS
        if (isNaN(nota) || isNaN(percentage)) {
          console.warn(`Valores inválidos para ${evaluacion.name}:`, { nota, percentage });
          return;
        }

        const peso = percentage / 100;
        const puntosContribuidos = nota * peso;
        puntosActuales += puntosContribuidos;
        pesoCompletado += peso;

        evaluacionesCompletadas.push({
          name: evaluacion.name,
          percentage: percentage,
          grade: nota,
          points_contributed: puntosContribuidos
        });

        console.log(`${evaluacion.name}: ${nota} × ${peso} = ${puntosContribuidos} puntos`);
      } else {
        const percentage = parseFloat(evaluacion.percentage);
        if (!isNaN(percentage)) {
          evaluacionesPendientes.push({
            id: evaluacion.id,
            name: evaluacion.name,
            percentage: percentage,
            suggested_grade: 1.0 // Valor por defecto
          });
        }
      }
    });

    console.log("Puntos actuales:", puntosActuales);
    console.log("Peso completado:", pesoCompletado);
    console.log("Evaluaciones pendientes:", evaluacionesPendientes);

    const puntosNecesarios = target - puntosActuales;
    const pesoPendiente = evaluacionesPendientes.reduce((sum, e) => sum + e.percentage, 0) / 100;

    console.log("Puntos necesarios:", puntosNecesarios);
    console.log("Peso pendiente:", pesoPendiente);

    // Determinar status y calcular notas sugeridas
    let status = '';
    let recommendations = [];

    if (evaluacionesPendientes.length === 0) {
      // No hay evaluaciones pendientes
      const promedioFinal = puntosActuales;
      if (promedioFinal >= (target - 0.01)) {
        status = 'objetivo_alcanzado';
        recommendations.push(`¡Felicidades! Ya alcanzaste el promedio objetivo con ${promedioFinal.toFixed(1)}`);
      } else {
        status = 'objetivo_no_alcanzado';
        recommendations.push(`Promedio actual: ${promedioFinal.toFixed(1)}. No alcanzaste el objetivo de ${target}`);
      }
    } else {
      // Hay evaluaciones pendientes
      if (puntosNecesarios <= 0) {
        status = 'objetivo_alcanzado';
        recommendations.push('¡Ya alcanzaste tu objetivo! Cualquier nota en las evaluaciones restantes mantendrá tu promedio.');
        // Asignar nota mínima a evaluaciones pendientes
        evaluacionesPendientes.forEach(evaluacion => {
          evaluacion.suggested_grade = 1.0;
        });
      } else if (pesoPendiente <= 0) {
        status = 'objetivo_imposible';
        recommendations.push('No hay evaluaciones pendientes para alcanzar el objetivo.');
      } else {
        const promedioNecesario = puntosNecesarios / pesoPendiente;

        if (promedioNecesario > 7.0) {
          status = 'objetivo_imposible';
          recommendations.push(`Es imposible alcanzar el objetivo. Necesitarías un promedio de ${promedioNecesario.toFixed(1)} en las evaluaciones restantes.`);
        } else if (promedioNecesario <= 4.0) {
          status = 'objetivo_facil';
          recommendations.push(`Objetivo fácil de alcanzar. Promedio necesario: ${promedioNecesario.toFixed(1)}`);
        } else if (promedioNecesario <= 5.5) {
          status = 'objetivo_moderado';
          recommendations.push(`Objetivo alcanzable con esfuerzo moderado. Promedio necesario: ${promedioNecesario.toFixed(1)}`);
        } else {
          status = 'objetivo_dificil';
          recommendations.push(`Objetivo difícil pero posible. Promedio necesario: ${promedioNecesario.toFixed(1)}`);
        }

        // Calcular nota específica para cada evaluación pendiente
        evaluacionesPendientes.forEach(evaluacion => {
          const notaMinima = Math.max(1.0, Math.min(7.0, promedioNecesario));
          evaluacion.suggested_grade = notaMinima;
        });
      }
    }

    const resultado = {
      subject_id: asignatura.id,
      subject_name: asignatura.name,
      target_grade: parseFloat(target),
      current_points: Math.round(puntosActuales * 10) / 10,
      points_needed: Math.round(puntosNecesarios * 10) / 10,
      completed_evaluations: evaluacionesCompletadas,
      pending_evaluations: evaluacionesPendientes,
      status: status,
      recommendations: recommendations
    };

    console.log("=== RESULTADO FINAL ===");
    console.log(resultado);

    return resultado;
  };

  const handleCalcular = async () => {
    if (!selectedAsignatura) {
      alert("Selecciona una asignatura primero");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const target = targetGrade ? parseFloat(targetGrade) : null;

      // Usar cálculo local con validaciones
      const estimation = calculateLocalEstimation(selectedAsignatura, target);

      if (estimation) {
        setEstimation(estimation);

        // Intentar guardar en el backend (opcional)
        try {
          await subjectService.estimateGrades(selectedAsignatura.id, target);
        } catch (backendError) {
          console.warn("Error en backend, pero usando cálculo local:", backendError);
        }
      } else {
        setError("Error al calcular las notas. Verifica que la asignatura tenga evaluaciones válidas.");
      }

    } catch (err) {
      console.error("Error:", err);
      setError("Error al calcular las notas necesarias");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'objetivo_alcanzado': '#16a34a',
      'objetivo_facil': '#16a34a',
      'objetivo_moderado': '#f59e0b',
      'objetivo_dificil': '#dc2626',
      'objetivo_imposible': '#dc2626',
      'objetivo_no_alcanzado': '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusEmoji = (status) => {
    const emojis = {
      'objetivo_alcanzado': '🎉',
      'objetivo_facil': '✅',
      'objetivo_moderado': '💪',
      'objetivo_dificil': '⚠️',
      'objetivo_imposible': '❌',
      'objetivo_no_alcanzado': '😔'
    };
    return emojis[status] || '📊';
  };

  const getStatusMessage = (status) => {
    const messages = {
      'objetivo_alcanzado': '¡Felicidades! Ya alcanzaste tu objetivo',
      'objetivo_facil': 'Objetivo fácil de alcanzar',
      'objetivo_moderado': 'Objetivo alcanzable con esfuerzo moderado',
      'objetivo_dificil': 'Objetivo difícil pero posible',
      'objetivo_imposible': 'Objetivo matemáticamente imposible',
      'objetivo_no_alcanzado': 'No alcanzaste el objetivo'
    };
    return messages[status] || 'Calculando...';
  };

  if (loading && asignaturas.length === 0) {
    return (
      <div className="calculadora-loading">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="calculadora-page">
      <header className="calculadora-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Volver al Dashboard
          </button>
          <h1>📈 Calculadora de Notas</h1>
        </div>
      </header>

      <div className="calculadora-container">
        {error && <div className="error-alert">{error}</div>}

        <div className="calculator-card">
          <div className="card-section">
            <h2>1. Selecciona una Asignatura</h2>
            <select
              value={selectedAsignatura?.id || ""}
              onChange={handleAsignaturaChange}
              className="subject-select"
            >
              <option value="">-- Selecciona una asignatura --</option>
              {asignaturas.map(asignatura => (
                <option key={asignatura.id} value={asignatura.id}>
                  {asignatura.name} ({asignatura.subject_type === 'carrera' ? '5.3' : '5.5'})
                </option>
              ))}
            </select>
          </div>

          {selectedAsignatura && (
            <>
              <div className="card-section">
                <h2>2. Ingresa tus Notas Actuales</h2>
                <div className="evaluations-input">
                  {selectedAsignatura.evaluations && selectedAsignatura.evaluations.map(evaluation => (
                    <div key={evaluation.id} className="evaluation-input-row">
                      <div className="eval-info">
                        <span className="eval-name">{evaluation.name}</span>
                        <span className="eval-percentage">{Math.round(parseFloat(evaluation.percentage))}%</span>
                      </div>
                      <div className="eval-input">
                        <input
                          type="number"
                          value={notas[evaluation.id] || evaluation.grade || ""}
                          onChange={(e) => {
                            let value = e.target.value;

                            // Validar longitud máxima (3 caracteres: 7.0)
                            if (value.length > 3) return;

                            // Solo permitir números, punto decimal y máximo un decimal
                            if (!/^\d*\.?\d{0,1}$/.test(value)) return;

                            // Validar rango si hay un número válido
                            if (value !== '') {
                              const num = parseFloat(value);
                              if (!isNaN(num) && (num < 1 || num > 7)) return;
                            }

                            handleNotaChange(evaluation.id, value);
                          }}
                          placeholder="1.0 - 7.0"
                          min="1"
                          max="7"
                          step="0.1"
                          disabled={saving}
                        />
                        <button
                          onClick={() => handleSaveNota(evaluation.id)}
                          disabled={saving || !notas[evaluation.id]}
                          className="save-btn"
                          title="Guardar nota"
                        >
                          {saving ? "..." : "💾"}
                        </button>
                        <button
                          onClick={() => handleClearNota(evaluation.id)}
                          disabled={saving}
                          className="clear-btn"
                          title="Vaciar nota para estimación"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-section">
                <h2>3. Define tu promedio deseado (Opcional)</h2>
                <div className="target-input">
                  <input
                    type="number"
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    placeholder={`Por defecto: ${selectedAsignatura.passing_grade || 'N/A'}`}
                    min="1"
                    max="7"
                    step="0.1"
                  />
                  <button
                    onClick={handleCalcular}
                    disabled={loading}
                    className="calculate-btn"
                  >
                    {loading ? "Calculando..." : "Calcular Notas Necesarias"}
                  </button>
                </div>
              </div>
            </>
          )}

          {estimation && (
            <div className="estimation-results">
              <div
                className="status-banner"
                style={{ backgroundColor: getStatusColor(estimation.status) + '20' }}
              >
                <span className="status-emoji">{getStatusEmoji(estimation.status)}</span>
                <h3>{getStatusMessage(estimation.status)}</h3>
              </div>

              <div className="estimation-details">
                <div className="detail-row">
                  <span>Promedio deseado:</span>
                  <strong>{estimation.target_grade?.toFixed(1) || 'N/A'}</strong>
                </div>
                <div className="detail-row">
                  <span>Promedio actual:</span>
                  <strong>{estimation.current_points?.toFixed(1) || 'N/A'}</strong>
                </div>
                <div className="detail-row">
                  <span>Puntaje necesario:</span>
                  <strong>{estimation.points_needed?.toFixed(1) || 'N/A'}</strong>
                </div>
              </div>

              {estimation.pending_evaluations && estimation.pending_evaluations.length > 0 && (
                <div className="pending-evaluations">
                  <h4>Notas Mínimas Necesarias:</h4>
                  {estimation.pending_evaluations.map((evaluation, index) => (
                    <div key={index} className="suggested-evaluation">
                      <span className="eval-name">{evaluation.name}</span>
                      <span
                        className="suggested-grade"
                        style={{
                          color: (evaluation.suggested_grade || 0) > 6.5 ? '#dc2626' :
                            (evaluation.suggested_grade || 0) > 5.5 ? '#f59e0b' : '#16a34a'
                        }}
                      >
                        {evaluation.suggested_grade?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {estimation.recommendations && estimation.recommendations.map((rec, index) => (
                <div key={index} className="recommendation">
                  <p>{rec}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {asignaturas.length === 0 && (
          <div className="empty-state">
            <p>No tienes asignaturas registradas</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/asignaturas')}
            >
              Ir a Asignaturas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculadoraNotas;