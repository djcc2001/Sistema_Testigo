import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlantillaAdmin from '../components/PlantillaAdmin';
import { createUserAdmin } from '../services/api';
import '../style/CrearInstitucion.css';

export default function CrearInstitucion() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    direccion: '',
    correo: '',
    telefono: '',
    sitioWeb: '',
    contrasena: ''
  });
  const [imagenPerfil, setImagenPerfil] = useState("/usuario.png");
  const [imagenFile, setImagenFile] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagenPerfil(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      // Preparar datos para enviar al backend
      // Una institución es un usuario con rol "autoridad"
      // Generar un DNI único corto para instituciones (INS + timestamp)
      const dniUnico = 'INS' + Date.now().toString().slice(-9); // INS + 9 dígitos
      
      const userData = {
        dni: dniUnico, // DNI generado automáticamente (máx 15 caracteres)
        nombres: formData.nombre,
        apellidos: formData.tipo || "Institución", // Tipo como apellido
        celular: formData.telefono,
        correo: formData.correo,
        contrasena: formData.contrasena,
        rol: "autoridad", // Las instituciones son autoridades
        foto: imagenFile
      };

      await createUserAdmin(userData);
      alert("Institución creada exitosamente");
      navigate('/admin/instituciones-colaboradoras');
    } catch (err) {
      console.error("Error al crear institución:", err);
      setError(err.response?.data?.error || "Error al crear la institución");
    } finally {
      setCargando(false);
    }
  };

  return (
    <PlantillaAdmin tituloHeader="Crear Institucion">
      <div className="contenedor-crear">
        <div className="contenido-crear">
          
          {/* Mensaje de error */}
          {error && (
            <div style={{
              backgroundColor: '#fadbd8',
              color: '#e74c3c',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div className="contenedor-principal">
            {/* Formulario centrado */}
            <div className="contenedor-formulario">
              <form onSubmit={handleSubmit}>
                <div className="grupo-campo">
                  <label>Nombre de la Institución:</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    placeholder="Municipalidad Distrital del Cusco"
                    required 
                  />
                </div>

                <div className="grupo-campo">
                  <label>Tipo de Institución:</label>
                  <input 
                    type="text" 
                    name="tipo" 
                    value={formData.tipo} 
                    onChange={handleChange} 
                    placeholder="Ministerio"
                    required 
                  />
                </div>

                <div className="grupo-campo">
                  <label>Dirección Física:</label>
                  <input 
                    type="text" 
                    name="direccion" 
                    value={formData.direccion} 
                    onChange={handleChange} 
                    placeholder="Calle Augusto Tamayo 180"
                    required 
                  />
                </div>

                <div className="grupo-campo">
                  <label>Correo:</label>
                  <input 
                    type="email" 
                    name="correo" 
                    value={formData.correo} 
                    onChange={handleChange} 
                    placeholder="tim.jennings@example.com"
                    required 
                  />
                </div>

                <div className="grupo-campo">
                  <label>Teléfono de Contacto:</label>
                  <input 
                    type="tel" 
                    name="telefono" 
                    value={formData.telefono} 
                    onChange={handleChange} 
                    placeholder="999-999-999"
                  />
                </div>

                <div className="grupo-campo">
                  <label>Sitio Web:</label>
                  <input 
                    type="url" 
                    name="sitioWeb" 
                    value={formData.sitioWeb} 
                    onChange={handleChange} 
                    placeholder="Ejemplo.com"
                  />
                </div>

                <div className="grupo-campo">
                  <label>Contraseña:</label>
                  <input 
                    type="password" 
                    name="contrasena" 
                    value={formData.contrasena} 
                    onChange={handleChange} 
                    placeholder="••••••••••"
                    required 
                  />
                </div>
              </form>
            </div>

            {/* Avatar a la derecha */}
            <div className="contenedor-avatar-derecha">
              <div className="seccion-avatar">
                <div className="circulo-avatar">
                  <img src={imagenPerfil} alt="Preview" />
                  <input 
                    type="file" 
                    id="subir-imagen" 
                    accept="image/*" 
                    onChange={handleImagenChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="subir-imagen" className="boton-subir-overlay">
                    Subir Imagen
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botones al final */}
          <div className="acciones-formulario">
            <button 
              type="button" 
              className="boton-cancelar" 
              onClick={() => navigate(-1)}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="boton-guardar" 
              onClick={handleSubmit}
              disabled={cargando}
            >
              {cargando ? 'Creando...' : 'Crear Institución'}
            </button>
          </div>
        </div>
      </div>
    </PlantillaAdmin>
  );
}
