// crearUsuario.jsx

import React, { useState } from 'react';
import { createUserAdmin } from '../services/api';
import { useNavigate } from "react-router-dom";
import PlantillaAdmin from '../components/PlantillaAdmin';
import { consultarRENIEC } from '../services/reniecService';
import '../style/CrearUsuario.css';

const CrearUsuario = () => {
  const navigate = useNavigate();
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    rol: 'ciudadano',
    correo: '',
    celular: '',
    contrasena: '',
    confirmarContrasena: '',
  });
  const [errors, setErrors] = useState({});
  const [isDNIValidated, setIsDNIValidated] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  const [imagen, setImagen] = useState(null);
  const [archivo, setArchivo] = useState(null);

  // Maneja cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'dni') {
      setIsDNIValidated(false);
      setFormData(prev => ({ ...prev, nombres: '', apellidos: '' }));
    }
  };
  const handleConsultarDNI = async () => {
    if (!formData.dni || formData.dni.length !== 8 || !/^\d+$/.test(formData.dni)) {
      setErrors(prev => ({ ...prev, dni: 'DNI inválido. Debe tener 8 números.' }));
      return;
    }

    setIsConsulting(true);
    setErrors(prev => ({ ...prev, dni: '' }));

    try {
      const userData = await consultarRENIEC(formData.dni);
      setFormData(prev => ({
        ...prev,
        nombres: userData.nombres,
        apellidos: userData.apellidos
      }));
      setIsDNIValidated(true);
    } catch (error) {
      setErrors(prev => ({ ...prev, dni: error.message }));
      setIsDNIValidated(false);
    } finally {
      setIsConsulting(false);
    }
  };



  // Maneja la subida de imagen de perfil
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setImagen(URL.createObjectURL(file));
    }
  };

  // Enviar el formulario al backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación simple de contraseñas
    if (formData.contrasena !== formData.confirmarContrasena) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      // Enviamos todo junto, incluida la foto
      const response = await createUserAdmin({ ...formData, foto: archivo });
      console.log("Usuario creado:", response.data);
      alert("Usuario creado correctamente");

      // Resetear formulario e imagen
      setFormData({
        dni: '',
        nombres: '',
        apellidos: '',
        rol: 'Usuario',
        correo: '',
        celular: '',
        contrasena: '',
        confirmarContrasena: ''
      });
      setImagen(null);
      setArchivo(null);

    } catch (error) {
      console.error("Error al crear usuario:", error);
      alert("Error al registrar el usuario");
    }
  };

  return (
    <PlantillaAdmin tituloHeader="Crear Usuario">
      <div className="form-container">
        <div className="content">
          <div className="left-form">
            <form className="user-form" onSubmit={handleSubmit}>
              {/* Campos del formulario */}
              <div className="form-group">
                <label>Nº de DNI:</label>
                <div className="dni-container">
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    maxLength="8"
                    disabled={isDNIValidated}
                  />
                  <button
                    type="button"
                    className={`consultar-btn ${isDNIValidated ? 'validated' : ''}`}
                    onClick={handleConsultarDNI}
                    disabled={isConsulting || isDNIValidated}
                  >
                    {isConsulting ? 'Consultando...' : isDNIValidated ? 'Validado' : 'Consultar'}
                  </button>
                </div>

                {errors.dni && <div className="error-message">{errors.dni}</div>}
                {isDNIValidated && !errors.dni && (
                  <div style={{ color: 'green', fontSize: '12px' }}>
                    DNI verificado correctamente
                  </div>
                )}
              </div>


              <div className="form-group">
                <label>Nombres:</label>
                <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} readOnly={isDNIValidated}/>
              </div>

              <div className="form-group">
                <label>Apellidos:</label>
                <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} readOnly={isDNIValidated}/>
              </div>

              <div className="form-group">
                <label>Rol:</label>
                <select name="rol" value={formData.rol} onChange={handleChange}>
                  <option value="ciudadano">Ciudadano</option>
                  <option value="admin">Administrador</option>
                  <option value="autoridad">Autoridad</option>
                </select>
              </div>

              <div className="form-group">
                <label>Correo:</label>
                <input type="email" name="correo" value={formData.correo} onChange={handleChange}/>
              </div>

              <div className="form-group">
                <label>Nro de Celular:</label>
                <input type="text" name="celular" value={formData.celular} onChange={handleChange}/>
              </div>

              <div className="form-group">
                <label>Nueva Contraseña:</label>
                <input type="password" name="contrasena" value={formData.contrasena} onChange={handleChange}/>
              </div>

              <div className="form-group">
                <label>Confirmar Contraseña:</label>
                <input type="password" name="confirmarContrasena" value={formData.confirmarContrasena} onChange={handleChange}/>
              </div>

              {/* Botones del formulario */}
              <div className="form-actions">
                <button type="submit" className="submit-button">Guardar Cambios</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancelar</button>
              </div>
            </form>
          </div>

          {/* Imagen de perfil */}
          <div className="right-profile">
            <div className="profile-upload">
              <img src={imagen || '/usuario-img.jpg'} alt="Perfil"/>
              <label htmlFor="upload-input" className="upload-label">Subir Imagen</label>
              <input type="file" id="upload-input" accept="image/*" style={{ display: 'none' }} onChange={handleImagenChange}/>
            </div>
          </div>
        </div>
      </div>
    </PlantillaAdmin>
  );
};

export default CrearUsuario;
