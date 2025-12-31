import React, { useState, useEffect } from 'react';
import LayoutPrincipal from "../components/PlantillaCiudadano";
import '../style/NuevoReporte.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';
import {crearReporte } from '../services/api';
import { getCategorias } from '../services/categoriasService';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// =================== COMPONENTES MAPA ===================
function LocationMarker({ position, obtenerDireccionDesdeMapa }) {
  useMapEvents({
    click(e) {
      obtenerDireccionDesdeMapa(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function MoverMapa({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16);
  }, [position, map]);
  return null;
}

// =================== COMPONENTE PRINCIPAL ===================
const NuevoReporte = () => {
  const [categorias, setCategorias] = useState([])

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    latitud: '',
    longitud: '',
    direccion: '',
    distrito: '',
    estado_id: 1, // Estado "Nuevo"
    categoria: '',
    archivos: [],
  });

  const [position, setPosition] = useState(null);
  const [cargando, setCargando] = useState(false);

  // cargar categorias desde la base de datos
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const data = await getCategorias();
        setCategorias(data);
      } catch (error) {
        console.error("Error cargando categorías", error);
      }
    };

    cargarCategorias();
  }, []);

  // Actualiza latitud/longitud al hacer click en el mapa
  useEffect(() => {
    if (position) {
      setFormData(prev => ({
        ...prev,
        latitud: position.lat,
        longitud: position.lng,
      }));
    }
  }, [position]);

  // Maneja cambios del formulario
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({
        ...prev,
        archivos: [...prev.archivos, ...Array.from(files)],
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Enviar formulario al backend
  const handleEnviar = async () => {
  if (
    !formData.titulo.trim() ||
    !formData.descripcion.trim() ||
    !formData.categoria ||
    !position ||
    formData.archivos.length === 0
  ) {
    alert("Por favor completa todos los campos obligatorios.");
    return;
  }

  setCargando(true);
  try {
    const data = new FormData();
    
    // Agregar campos individualmente
    data.append("titulo", formData.titulo);
    data.append("descripcion", formData.descripcion);
    data.append("latitud", formData.latitud.toString());
    data.append("longitud", formData.longitud.toString());
    data.append("direccion", formData.direccion);
    data.append("distrito", formData.distrito);
    data.append("estado_id", formData.estado_id.toString());
    data.append("categoria_id", formData.categoria);

    // Debug: mostrar valores antes de enviar
    console.log("Valores a enviar:", {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      latitud: formData.latitud,
      longitud: formData.longitud,
      direccion: formData.direccion,
      distrito: formData.distrito,
      estado_id: formData.estado_id,
      categoria: formData.categoria
    });

    formData.archivos.forEach(file => data.append("archivos", file));

    const res = await crearReporte(data);

      alert("Reporte enviado correctamente.");
      console.log("Respuesta:", res.data);

      // Reset form
      setFormData({
        titulo: '',
        descripcion: '',
        latitud: '',
        longitud: '',
        direccion: '',
        distrito: '',
        estado_id: 1,
        categoria: '',
        archivos: [],
      });
      setPosition(null);
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      alert("Error al enviar el reporte. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    window.history.back();
  };

  // Obtener ubicación real del usuario
  const obtenerUbicacionReal = () => {
    if (!navigator.geolocation) {
      alert("Geolocalización no soportada por tu navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        obtenerDireccionDesdeMapa(
          pos.coords.latitude,
          pos.coords.longitude
        );
      },
      (error) => alert("Error al obtener ubicación: " + error.message)
    );
  };

  const obtenerDireccionDesdeMapa = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );

      const data = await response.json();

      const direccion =
        data.address?.road
          ? `${data.address.road} ${data.address.house_number || ''}`.trim()
          : data.display_name || '';

      const distrito =
        data.address?.suburb ||
        data.address?.city_district ||
        data.address?.neighbourhood ||
        data.address?.city ||
        '';

      setPosition({ lat, lng });

      setFormData(prev => ({
        ...prev,
        latitud: lat,
        longitud: lng,
        direccion,
        distrito,
      }));
    } catch (error) {
      console.error("Error en reverse geocoding:", error);
    }
  };


  // Buscar dirección en Perú
  const buscarDireccion = async () => {
    const consulta = `${formData.direccion || ''}, ${formData.distrito || ''}`;
    if (!consulta.trim()) {
      alert("Por favor ingrese una dirección o distrito para buscar.");
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pe&bounded=1&viewbox=-81,-18,-68,-0&q=${encodeURIComponent(consulta)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        alert("No se encontró la ubicación ingresada.");
      }
    } catch (error) {
      alert("Error al buscar dirección: " + error.message);
    }
  };

  return (
    <LayoutPrincipal tituloHeader="Nuevo Reporte">
      <div className="formulario-reporte">
        <h2 className="titulo-formulario">FORMULARIO REPORTE</h2>

        <label>Título del Problema: <span className="obligatorio">*</span></label>
        <input
          type="text"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          placeholder="Ej. Bache en la calle"
        />

        <label>Descripción: <span className="obligatorio">*</span></label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe el problema detalladamente"
        />

        <label>Categoría: <span className="obligatorio">*</span></label>
        <select
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
        >
          <option value="">Seleccione una categoría</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.descripcion}
            </option>
          ))}
        </select>

        <label>Ubicación: <span className="obligatorio">*</span></label>
        <div className="fila-direccion">
          <div>
            <label>Distrito:</label>
            <input
              type="text"
              name="distrito"
              value={formData.distrito}
              onChange={handleChange}
              placeholder="Ej. San Sebastián"
            />
          </div>
          <div className="f-direccion">
            <div>
              <label>Dirección:</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej. Av. La Cultura 123"
              />
            </div>
            <button
              type="button"
              className="btn-ubicar"
              onClick={buscarDireccion}
              title="Buscar en el mapa"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
        <div className="mapa">
          <MapContainer center={position || [-13.517088, -71.978535]} zoom={14}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} obtenerDireccionDesdeMapa={obtenerDireccionDesdeMapa} />
            <MoverMapa position={position} />
          </MapContainer>
        </div>

        <button className="btn-ubicacion" onClick={obtenerUbicacionReal}>
          <MapPin size={20} />
          Ubicación Real
        </button>

        <label>Adjuntar Archivos: <span className="obligatorio">*</span></label>
        <div className="boton_subir">
          <input
            type="file"
            id="input-archivos"
            name="archivos"
            multiple
            accept="image/*,video/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-subir"
            onClick={() => document.getElementById('input-archivos').click()}
          >
            + Elegir Archivos
          </button>
        </div>

        <div className="adjuntar-archivos">
          {formData.archivos.length > 0 ? (
            <div className="preview-contenedor">
              {formData.archivos.map((file, index) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                const previewURL = URL.createObjectURL(file);
                return (
                  <div className="preview-item" key={index}>
                    {isImage && <img src={previewURL} alt={`preview-${index}`} />}
                    {isVideo && <video src={previewURL} controls />}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="texto-placeholder">No se han adjuntado archivos aún.</p>
          )}
        </div>

        <div className="botones-formulario">
          <button className="btn-cancelar" onClick={handleCancelar}>Cancelar</button>
          <button className="btn-enviar" onClick={handleEnviar} disabled={cargando}>
            {cargando ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </LayoutPrincipal>
  );
};

export default NuevoReporte;
