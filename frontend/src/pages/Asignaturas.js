import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subjectService } from "../services/api";
import "./Asignaturas.css";

const Asignaturas = () => {
  const navigate = useNavigate();
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject_type: "carrera",
    class_type: "teoria",
    total_evaluations: 3,
    total_theory_classes: 16,
    total_lab_classes: 0,
    has_attendance_reduction: false,
    evaluations_data: []
  });

  // Estado para las evaluaciones dinámicas
  const [evaluations, setEvaluations] = useState([
    { name: "Evaluación 1", percentage: "30" },
    { name: "Evaluación 2", percentage: "35" },
    { name: "Evaluación 3", percentage: "35" }
  ]);

  useEffect(() => {
    fetchAsignaturas();
  }, []);

  const fetchAsignaturas = async () => {
    try {
      setLoading(true);
      const data = await subjectService.getAll();
      setAsignaturas(data.results || data);
      setError(null);
    } catch (err) {
      console.error("Error al obtener asignaturas:", err);
      setError("Error al cargar las asignaturas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (asignatura = null) => {
    if (asignatura) {
      // Modo edición
      setEditingId(asignatura.id);
      setFormData({
        name: asignatura.name,
        subject_type: asignatura.subject_type,
        class_type: asignatura.class_type,
        total_evaluations: asignatura.total_evaluations,
        total_theory_classes: asignatura.total_theory_classes,
        total_lab_classes: asignatura.total_lab_classes,
        has_attendance_reduction: asignatura.has_attendance_reduction,
        evaluations_data: []
      });

      // Cargar las evaluaciones existentes
      if (asignatura.evaluations) {
        setEvaluations(asignatura.evaluations.map(e => ({
          name: e.name,
          percentage: Math.round(parseFloat(e.percentage)).toString()
        })));
      }
    } else {
      // Modo creación
      setEditingId(null);
      setFormData({
        name: "",
        subject_type: "carrera",
        class_type: "teoria",
        total_evaluations: 3,
        total_theory_classes: 16,
        total_lab_classes: 0,
        has_attendance_reduction: false,
        evaluations_data: []
      });
      setEvaluations([
        { name: "Evaluación 1", percentage: "30" },
        { name: "Evaluación 2", percentage: "35" },
        { name: "Evaluación 3", percentage: "35" }
      ]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "total_evaluations") {
      const num = parseInt(value) || 1;
      setFormData(prev => ({ ...prev, [name]: num }));

      // SOLUCIÓN SIMPLE: Crear exactamente el número de evaluaciones solicitado
      generateEvaluations(num);
    } else if (name === "class_type") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Si es solo teoría, poner lab_classes en 0
        total_lab_classes: value === "teoria" ? 0 : prev.total_lab_classes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  // Función simple para generar evaluaciones
  const generateEvaluations = (numberOfEvaluations) => {
    const newEvaluations = [];
    const basePercentage = 100 / numberOfEvaluations;

    for (let i = 0; i < numberOfEvaluations; i++) {
      // Mantener nombre si existe, sino crear uno nuevo
      const existingName = evaluations[i]?.name || `Evaluación ${i + 1}`;

      // Calcular porcentaje (el último toma el resto para evitar decimales)
      let percentage;
      if (i === numberOfEvaluations - 1) {
        // Último: tomar el porcentaje restante
        const usedPercentage = newEvaluations.reduce((sum, e) => sum + parseFloat(e.percentage), 0);
        percentage = (100 - usedPercentage).toString();
      } else {
        percentage = Math.round(basePercentage).toString();
      }

      newEvaluations.push({
        name: existingName,
        percentage: percentage
      });
    }

    setEvaluations(newEvaluations);
  };

  const handleEvaluationChange = (index, field, value) => {
    const newEvaluations = [...evaluations];
    newEvaluations[index][field] = value;
    setEvaluations(newEvaluations);
  };

  const calculateTotalPercentage = () => {
    return evaluations.reduce((sum, e) => sum + parseFloat(e.percentage || 0), 0);
  };

  // Función para redistribuir porcentajes automáticamente
  const redistributePercentages = () => {
    generateEvaluations(evaluations.length);
  };

  // Función para forzar regeneración
  const forceRegenerate = () => {
    generateEvaluations(formData.total_evaluations);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que los porcentajes sumen 100 (solo si hay evaluaciones)
    if (evaluations.length > 0) {
      const total = calculateTotalPercentage();
      if (Math.abs(total - 100) > 0) {
        setError(`Los porcentajes deben sumar 100%. Suma actual: ${Math.round(total)}%`);
        return;
      }
    }

    // Validar que tenga al menos clases de teoría o lab
    if (formData.total_theory_classes === 0 && formData.total_lab_classes === 0) {
      setError("Debe tener al menos clases de teoría o laboratorio");
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        evaluations_data: evaluations.map(e => ({
          name: e.name,
          percentage: parseFloat(e.percentage)
        }))
      };

      if (editingId) {
        // En modo edición, enviar TODOS los campos actualizados incluyendo evaluaciones
        console.log('Enviando datos completos para edición:', dataToSend);
        await subjectService.update(editingId, dataToSend);
      } else {
        // En modo creación
        await subjectService.create(dataToSend);
      }

      handleCloseModal();
      fetchAsignaturas();
    } catch (err) {
      console.error("Error al guardar:", err);
      if (err.response?.data) {
        const errorMsg = typeof err.response.data === 'string'
          ? err.response.data
          : Object.values(err.response.data).flat().join(", ");
        setError(errorMsg);
      } else {
        setError("Error al guardar la asignatura");
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de eliminar "${name}"?\n\n⚠️ ADVERTENCIA: Esto eliminará permanentemente:\n• La asignatura\n• Todas sus evaluaciones\n• Todas las notas registradas\n• El historial de asistencia\n\nEsta acción NO se puede deshacer.`)) {
      try {
        await subjectService.delete(id);
        fetchAsignaturas();
      } catch (err) {
        console.error("Error al eliminar:", err);
        alert("Error al eliminar la asignatura");
      }
    }
  };

  const getPromedioColor = (average) => {
    if (!average) return "sin-notas";
    if (average >= 5.3) return "promedio-ok";
    if (average >= 3.9) return "promedio-warning";
    return "promedio-danger";
  };

  const getAsistenciaColor = (attendance) => {
    if (!attendance) return "sin-datos";
    const { theory_attendance_percentage, lab_attendance_percentage, is_at_risk } = attendance;

    if (is_at_risk) return "asistencia-danger";
    if (theory_attendance_percentage < 80 || lab_attendance_percentage < 95) return "asistencia-warning";
    return "asistencia-ok";
  };

  if (loading) {
    return (
      <div className="asignaturas-loading">
        <div className="loading-spinner"></div>
        <p>Cargando asignaturas...</p>
      </div>
    );
  }

  return (
    <div className="asignaturas-page">
      <header className="asignaturas-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Volver al Dashboard
          </button>
          <h1>📚 Mis Asignaturas</h1>
          <button className="add-btn" onClick={() => handleOpenModal()}>
            + Nueva Asignatura
          </button>
        </div>
      </header>

      <div className="asignaturas-container">
        {error && !showModal && <div className="error-alert">{error}</div>}

        {asignaturas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>No tienes asignaturas registradas</h2>
            <p>Comienza agregando tus asignaturas del semestre</p>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              Agregar Primera Asignatura
            </button>
          </div>
        ) : (
          <>
            <div className="asignaturas-summary">
              <div className="summary-card">
                <h3>📚 Total Asignaturas</h3>
                <p className="summary-value">{asignaturas.length}</p>
              </div>
              <div className="summary-card">
                <h3>⚠️ En Riesgo</h3>
                <p className="summary-value danger">
                  {asignaturas.filter(a => a.attendance?.is_at_risk).length}
                </p>
              </div>
              <div className="summary-card">
                <h3>📊 Promedio General</h3>
                <p className="summary-value">
                  {asignaturas.filter(a => a.current_average).length > 0
                    ? (asignaturas.reduce((sum, a) => sum + (a.current_average || 0), 0) /
                      asignaturas.filter(a => a.current_average).length).toFixed(1)
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="asignaturas-grid">
              {asignaturas.map((asignatura) => (
                <div key={asignatura.id} className="asignatura-card">
                  <div className="card-header">
                    <h3>{asignatura.name}</h3>
                    <span className={`tipo-badge ${asignatura.subject_type}`}>
                      {asignatura.subject_type === 'carrera' ? 'Carrera' : 'Complementaria'}
                    </span>
                  </div>

                  <div className="card-info">
                    <p><strong>Tipo:</strong> {asignatura.class_type === 'teoria' ? 'Teoría' : 'Laboratorio'}</p>
                    <p><strong>Nota mínima:</strong> {asignatura.passing_grade}</p>
                    <p><strong>Evaluaciones:</strong> {asignatura.total_evaluations}</p>
                    <p><strong>Clases:</strong> {asignatura.total_theory_classes} teoría, {asignatura.total_lab_classes} lab</p>
                  </div>

                  <div className="card-stats">
                    <div className="stat">
                      <span>Promedio</span>
                      <span className={`stat-value ${getPromedioColor(asignatura.current_average)}`}>
                        {asignatura.current_average ? asignatura.current_average.toFixed(1) : "—"}
                      </span>
                    </div>
                    <div className="stat">
                      <span>Asistencia</span>
                      <span className={`stat-value ${getAsistenciaColor(asignatura.attendance)}`}>
                        {asignatura.attendance ?
                          `${Math.min(
                            asignatura.attendance.theory_attendance_percentage,
                            asignatura.attendance.lab_attendance_percentage || 100
                          ).toFixed(0)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {asignatura.attendance?.is_at_risk && (
                    <div className="alert-badge">⚠️ Asistencia en riesgo</div>
                  )}

                  <div className="card-actions">
                    <button
                      className="btn-view"
                      onClick={() => navigate(`/calculadora`)}
                      title="Ver en calculadora de notas"
                    >
                      📊 Calcular
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenModal(asignatura)}
                      title="Editar asignatura"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(asignatura.id, asignatura.name)}
                      title="Eliminar asignatura"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal para crear/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "✏️ Editar" : "➕ Nueva"} Asignatura</h2>

            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la Asignatura *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Ej: Patrones de Diseño"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Asignatura *</label>
                  <select
                    name="subject_type"
                    value={formData.subject_type}
                    onChange={handleFormChange}
                  >
                    <option value="carrera">Carrera (5.3)</option>
                    <option value="complementaria">Complementaria (5.5)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo de Clase *</label>
                  <select
                    name="class_type"
                    value={formData.class_type}
                    onChange={handleFormChange}
                  >
                    <option value="teoria">Teoría (75% asistencia)</option>
                    <option value="laboratorio">Laboratorio (90% asistencia)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Número de Evaluaciones *</label>
                <input
                  type="number"
                  name="total_evaluations"
                  value={formData.total_evaluations}
                  onChange={handleFormChange}
                  min="1"
                  max="10"
                  required
                />
                {editingId && (
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    ⚠️ Cambiar el número de evaluaciones puede afectar las notas existentes
                  </small>
                )}
              </div>

              {/* Sección de evaluaciones - FUNCIONA EN CREACIÓN Y EDICIÓN */}
              <div className="evaluations-section">
                <h3>Configurar Evaluaciones</h3>
                <p className="help-text">
                  Los porcentajes deben sumar exactamente 100%.
                  {evaluations.length !== formData.total_evaluations && (
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                      {' '}Mostrando {evaluations.length} de {formData.total_evaluations} evaluaciones.
                    </span>
                  )}
                </p>

                {/* Botón de regeneración si hay discrepancia */}
                {evaluations.length !== formData.total_evaluations && (
                  <div style={{ marginBottom: '15px' }}>
                    <button
                      type="button"
                      onClick={forceRegenerate}
                      style={{
                        padding: '8px 15px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🔄 Corregir: Mostrar {formData.total_evaluations} evaluaciones
                    </button>
                  </div>
                )}

                {evaluations.map((evaluation, index) => (
                  <div key={index} className="evaluation-config">
                    <div className="form-group">
                      <label>Nombre</label>
                      <input
                        type="text"
                        value={evaluation.name}
                        onChange={(e) => handleEvaluationChange(index, 'name', e.target.value)}
                        placeholder={`Evaluación ${index + 1}`}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Porcentaje (%)</label>
                      <input
                        type="number"
                        value={evaluation.percentage}
                        onChange={(e) => handleEvaluationChange(index, 'percentage', e.target.value)}
                        min="1"
                        max="100"
                        step="1"
                        required
                      />
                    </div>
                  </div>
                ))}

                <div className="percentage-total">
                  Total: <span className={Math.abs(calculateTotalPercentage() - 100) === 0 ? "valid" : "invalid"}>
                    {Math.round(calculateTotalPercentage())}%
                  </span>

                  {/* Botón de redistribución si no suma 100% */}
                  {Math.abs(calculateTotalPercentage() - 100) > 0 && (
                    <button
                      type="button"
                      onClick={redistributePercentages}
                      style={{
                        marginLeft: '10px',
                        padding: '5px 10px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ⚖️ Distribuir Equitativamente
                    </button>
                  )}
                </div>

                {editingId && (
                  <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '5px', border: '1px solid #ffeaa7', marginTop: '10px' }}>
                    <small style={{ color: '#856404' }}>
                      ⚠️ <strong>Advertencia:</strong> Modificar evaluaciones existentes puede afectar las notas ya registradas.
                    </small>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Clases Teoría *</label>
                  <input
                    type="number"
                    name="total_theory_classes"
                    value={formData.total_theory_classes}
                    onChange={handleFormChange}
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Clases Lab</label>
                  <input
                    type="number"
                    name="total_lab_classes"
                    value={formData.total_lab_classes}
                    onChange={handleFormChange}
                    min="0"
                    max="100"
                    disabled={formData.class_type === "teoria"}
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="has_attendance_reduction"
                    checked={formData.has_attendance_reduction}
                    onChange={handleFormChange}
                  />
                  <span>Tiene rebaja de asistencia (reduce requisitos en 50%)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingId ? "💾 Guardar Cambios" : "➕ Crear Asignatura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asignaturas;