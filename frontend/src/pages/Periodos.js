import React, { useState, useEffect } from 'react';
import { periodoService } from '../services/api';
import './Periodos.css'; // Crearemos este CSS después

const Periodos = () => {
    const [periodos, setPeriodos] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newPeriodo, setNewPeriodo] = useState({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
        activo: true
    });

    useEffect(() => {
        cargarPeriodos();
    }, []);

    const cargarPeriodos = async () => {
        try {
            const data = await periodoService.getAll();
            setPeriodos(data);
        } catch (error) {
            console.error("Error cargando periodos:", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await periodoService.create(newPeriodo);
            setShowForm(false);
            cargarPeriodos(); // Recargar lista
            alert("¡Nuevo semestre creado!");
        } catch (error) {
            alert("Error al crear el semestre");
        }
    };

    const handleActivar = async (id) => {
        if (window.confirm("¿Activar este semestre? Las asignaturas del dashboard cambiarán.")) {
            try {
                await periodoService.setActive(id);
                cargarPeriodos();
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className="periodos-container">
            <h2>📅 Gestión de Semestres</h2>
            
            <button className="btn-new" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancelar' : '+ Nuevo Semestre'}
            </button>

            {showForm && (
                <form onSubmit={handleCreate} className="periodo-form">
                    <input 
                        type="text" 
                        placeholder="Nombre (Ej: 2024-2)" 
                        required 
                        value={newPeriodo.nombre}
                        onChange={e => setNewPeriodo({...newPeriodo, nombre: e.target.value})}
                    />
                    <div className="fechas-row">
                        <label>Inicio:
                            <input type="date" required onChange={e => setNewPeriodo({...newPeriodo, fecha_inicio: e.target.value})} />
                        </label>
                        <label>Fin:
                            <input type="date" required onChange={e => setNewPeriodo({...newPeriodo, fecha_fin: e.target.value})} />
                        </label>
                    </div>
                    <button type="submit" className="btn-save">Guardar Semestre</button>
                </form>
            )}

            <div className="periodos-list">
                {periodos.map(p => (
                    <div key={p.id} className={`periodo-card ${p.activo ? 'active-card' : ''}`}>
                        <div className="info">
                            <h3>{p.nombre} {p.activo && <span className="badge">ACTIVO</span>}</h3>
                            <small>{p.fecha_inicio} - {p.fecha_fin}</small>
                        </div>
                        {!p.activo && (
                            <button onClick={() => handleActivar(p.id)} className="btn-activate">
                                Activar
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Periodos;