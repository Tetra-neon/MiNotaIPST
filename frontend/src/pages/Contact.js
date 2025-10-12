import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Contact.css';
import axios from 'axios';
import { createPortal } from 'react-dom';

const Contact = () => {
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        asunto: '',
        tipo_consulta: 'general',
        mensaje: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isClosingModal, setIsClosingModal] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(false);

    // Limpiar timeout al desmontar el componente
    useEffect(() => {
        // Capturo la id del timeout en una variable local
        const id = timeoutRef.current;

        return () => {
            if (id) {
                clearTimeout(id);
            }
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setOverlayVisible(true);
        setError('');

        try {
            const response = await axios.post(
                'http://localhost:8000/api/contact/',
                formData,
                { timeout: 50000 }
            );

            if (response.data.success) {
                // Mostrar modal de éxito
                setShowSuccessModal(true);

                // Limpiar formulario
                setFormData({
                    nombre: '',
                    email: '',
                    asunto: '',
                    tipo_consulta: 'general',
                    mensaje: ''
                });

                // Redirigir después de 3 segundos
                //timeoutRef.current = setTimeout(() => {
                //  navigate('/');
                //}, 3000);
                timeoutRef.current = setTimeout(() => setIsClosingModal(true), 2500);
            }
        } catch (err) {
            console.error('Error al enviar mensaje:', err);
            setError(
                err.response?.data?.error ||
                'Error al enviar el mensaje. Por favor, intenta nuevamente.'
            );
        } finally {
            setLoading(false);
            setOverlayVisible(false);
        }
    };

    const handleImmediateRedirect = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            setIsClosingModal(true);
        }
        //navigate('/');
    };

    return (
        <div className="contact-page">
            {overlayVisible && (
                <div className="loading-overlay">
                    <span className="spinner-lg"></span>
                </div>
            )}

            {/* Modal de Éxito */}
            {showSuccessModal &&
                createPortal(
                    <div
                        className={
                            "success-modal-overlay" + (isClosingModal ? " fade-out" : " ")
                        }
                        onAnimationEnd={(e) => {
                            // Solo cuando la animación de salida ('fadeOut') termina
                            if (isClosingModal && e.animationName === 'fadeOut') {
                                setShowSuccessModal(false);  // desmonta modal sin error
                                setIsClosingModal(false);    // resetea estado
                                navigate('/');               // 🔸 AHORA sí redirigimos
                            }
                        }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={'success-modal' + (isClosingModal ? ' fade-out' : '')}>
                            <div className="success-modal-icon">✅</div>
                            <h2>¡Mensaje Enviado!</h2>
                            <p>Gracias por contactarnos.</p>
                            <p>Te responderemos a la brevedad posible.</p>
                            <p className="redirect-text">
                                Serás redirigido al inicio en unos segundos...
                            </p>
                            <button onClick={handleImmediateRedirect} className="modal-btn">
                                Ir al Inicio Ahora
                            </button>
                        </div>
                    </div>
                    , document.getElementById('modal-root')
                )}

            {/* Header */}
            <header className="contact-header">
                <div className="header-container">
                    <div className="logo" onClick={() => navigate('/')}>
                        <h1>🎓MiNotaIPST</h1>
                    </div>
                    <nav className="nav-menu">
                        <button onClick={() => navigate('/')} className="nav-link">
                            Inicio
                        </button>
                        <button onClick={() => navigate('/login')} className="nav-link">
                            Login
                        </button>
                        <button onClick={() => navigate('/register')} className="nav-link">
                            Registro
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="contact-hero">
                <div className="hero-content">
                    <h1>Contáctanos</h1>
                    <p>¿Tienes alguna pregunta o sugerencia? Estamos aquí para ayudarte</p>
                </div>
            </section>

            {/* Contact Content */}
            <section className="contact-content">
                <div className="contact-container">
                    <div className="contact-grid">
                        {/* Información de Contacto */}
                        <div className="contact-info">
                            <h2>Información de Contacto</h2>
                            <p className="info-description">
                                Estamos comprometidos con brindarte el mejor soporte para tu experiencia académica.
                            </p>

                            <div className="info-cards">
                                <div className="info-card">
                                    <div className="info-icon">📧</div>
                                    <div className="info-content">
                                        <h3>Email</h3>
                                        <p>notificaciones.ipst@gmail.com</p>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-icon">⏰</div>
                                    <div className="info-content">
                                        <h3>Horario de Atención</h3>
                                        <p>Lunes a Viernes: 9:00 - 18:00</p>
                                        <p>Sábados: 9:00 - 13:00</p>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-icon">💬</div>
                                    <div className="info-content">
                                        <h3>Respuesta</h3>
                                        <p>Respondemos en menos de 24 horas</p>
                                    </div>
                                </div>
                            </div>

                            <div className="faq-section">
                                <h3>Preguntas Frecuentes</h3>
                                <div className="faq-item">
                                    <h4>¿Cómo puedo recuperar mi contraseña?</h4>
                                    <p>En la página de login, haz clic en "¿Olvidaste tu contraseña?" y sigue las instrucciones.</p>
                                </div>
                                <div className="faq-item">
                                    <h4>¿Puedo cambiar mi correo electrónico?</h4>
                                    <p>Sí, desde tu perfil puedes actualizar tu información personal.</p>
                                </div>
                                <div className="faq-item">
                                    <h4>¿Cómo calculo mi promedio semestral?</h4>
                                    <p>Ve a la sección "Calculadora" y sigue el asistente paso a paso.</p>
                                </div>
                            </div>
                        </div>

                        {/* Formulario de Contacto */}
                        <div className="contact-form-section">
                            <div className="form-card">
                                <h2>Envíanos un Mensaje</h2>

                                {error && (
                                    <div className="error-message">
                                        <span className="error-icon">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="contact-form">
                                    <div className="form-group">
                                        <label htmlFor="nombre">Nombre Completo *</label>
                                        <input
                                            id="nombre"
                                            name="nombre"
                                            type="text"
                                            placeholder="Tu nombre completo"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Correo Electrónico *</label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="tu.email@ejemplo.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="tipo_consulta">Tipo de Consulta *</label>
                                        <select
                                            id="tipo_consulta"
                                            name="tipo_consulta"
                                            value={formData.tipo_consulta}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="general">Consulta General</option>
                                            <option value="soporte">Soporte Técnico</option>
                                            <option value="sugerencia">Sugerencia</option>
                                            <option value="error">Reportar Error</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="asunto">Asunto *</label>
                                        <input
                                            id="asunto"
                                            name="asunto"
                                            type="text"
                                            placeholder="Breve descripción del tema"
                                            value={formData.asunto}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="mensaje">Mensaje *</label>
                                        <textarea
                                            id="mensaje"
                                            name="mensaje"
                                            placeholder="Escribe tu mensaje aquí..."
                                            rows="6"
                                            value={formData.mensaje}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="char-count">
                                            {formData.mensaje.length} / 1000 caracteres
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={loading || formData.mensaje.length > 1000}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="loading-spinner"></span>
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <span>Enviar Mensaje</span>
                                                <span className="btn-icon">→</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="contact-footer">
                <div className="footer-container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>🎓MiNotaIPST</h3>
                            <p>Tu compañero académico digital</p>
                        </div>
                        <div className="footer-section">
                            <h4>Enlaces Rápidos</h4>
                            <ul>
                                <li>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="footer-link"
                                    >
                                        Inicio
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="footer-link"
                                    >
                                        Acceso
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="footer-link"
                                    >
                                        Registro
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Legal</h4>
                            <ul>
                                <li><a href="#terminos">Términos de Uso</a></li>
                                <li><a href="#privacidad">Privacidad</a></li>
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

export default Contact;