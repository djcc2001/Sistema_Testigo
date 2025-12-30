// Login.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutentificacion } from "../context/AutentificacionContext";
import '../style/sesion.css';

const Login = () => {
  const { login } = useAutentificacion();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Manejo de cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name] || errors.submit) {
        setErrors(prev => ({
        ...prev,
        [name]: '', // Limpia el error del campo actual
        submit: ''  // Limpia el error de envío general
        }));
    }
    };

  // Validación de formulario
  const validateForm = () => {
    const newErrors = {};
    const { username, password } = formData;

    if (!username.trim()) {
      newErrors.username = 'Por favor ingresa un correo o DNI';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const dniRegex = /^\d{8}$/;
      const rucRegex = /^\d{11}$/;
      const isEmail = emailRegex.test(username);
      const isDNI = dniRegex.test(username);
      const isRUC = rucRegex.test(username);
      if (!isEmail && !isDNI && !isRUC) {
        newErrors.username = 'Ingresa un correo válido, DNI o RUC';
      }
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
        const usuario = await login(formData);

        const rol = usuario.rol.toLowerCase();
        if (rol === "admin") navigate("/admin/dashboard");
        else if (rol === "autoridad") navigate("/autoridad/home");
        else navigate("/ciudadano/home");

    } catch (error) {
      console.error("Error en login:", error);

      let mensaje = "Error al iniciar sesión. Intenta nuevamente.";

      if (error.response?.data) {
        const data = error.response.data;

        if (data.error?.includes("Usuario no encontrado")) {
          mensaje = "El usuario no existe. Verifica tu correo o DNI.";
        } else if (data.error?.includes("Contraseña incorrecta")) {
          mensaje = "Contraseña incorrecta. Intenta nuevamente.";
        } else if (data.error) {
          mensaje = data.error;
        } else if (data.message) {
          mensaje = data.message;
        }
      } else if (error.request) {
        mensaje = "No se pudo conectar al servidor. Verifica tu conexión.";
      }

      setErrors(prev => ({ ...prev, submit: mensaje }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/');

  return (
    <div className="login-page">
      <div className="login-sidebar">
        <img src="/logo.png" alt="Logo"
          style={{ width: '70%', cursor: 'pointer', transition: 'transform 0.2s ease' }}
          onClick={() => navigate('/')}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        />
      </div>

      <div className="login-container">
        <div className="login-form-container">
          <div className="login-header">
            <h1>Bienvenido</h1>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Correo, DNI o RUC:</label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-control ${errors.username ? 'error' : ''}`}
                placeholder="Ingresa tu correo, DNI o RUC"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.username && <div className="error-message">{errors.username}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Ingresa tu contraseña"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

            <div className="btn-container">
              <button type="submit" className="btn btn-login" disabled={loading}>
                {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </button>
              <button type="button" className="btn btn-cancel" onClick={handleCancel} disabled={loading}>
                Cancelar
              </button>
            </div>
          </form>

          <div className="register-link">
            ¿No tienes una cuenta aún? <Link to="/registro">Regístrate</Link>
          </div>

          <div className="forgot-password-link">
            <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
