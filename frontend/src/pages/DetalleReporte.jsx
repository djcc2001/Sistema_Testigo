import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAutentificacion } from "../context/AutentificacionContext"; 
import PlantillaCiudadano from "../components/PlantillaCiudadano";
import PlantillaAutoridad from "../components/PlantillaAutoridad";
import "../style/DetalleReporte.css";
import "../style/reportesCarousel.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";

export default function DetalleReporte() {
  const { id } = useParams();
  const location = useLocation();
  const { usuario } = useAutentificacion();
  const [reporte, setReporte] = useState(null);
  const [indexImagen, setIndexImagen] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerDetalleReporte = async () => {
      try {
        setCargando(true);
        setError(null);
        
        const response = await api.get(`/reportes/${id}`);
        const data = response.data;
        
        // Transformar datos del backend al formato que usa el componente
        const reporteFormateado = {
          id: data.id,
          numero: `REP-${new Date(data.fecha).getFullYear()}-${String(data.id).padStart(4, "0")}`,
          estado: data.estado_nombre || "Enviado",
          categoria: data.categoria || "Sin categoría",
          fechaCreacion: data.fecha ? new Date(data.fecha).toLocaleDateString('es-PE') : "N/A",
          titulo: data.titulo,
          descripcion: data.descripcion,
          ubicacionTexto: data.direccion || `${data.distrito || "Sin especificar"}`,
          coordenadas: { 
            lat: parseFloat(data.latitud) || -13.517088, 
            lng: parseFloat(data.longitud) || -71.978535 
          },
          evidenciasCiudadano: data.evidencias?.map(e => e.url) || ["/auto.jpg"],
          institucion: data.autoridad_id ? {
            nombre: data.autoridad_nombre || "Sin nombre",
            contacto: `${data.autoridad_correo || "Sin correo"}${data.autoridad_telefono ? ` / +51 ${data.autoridad_telefono}` : ""}`,
            foto: data.autoridad_foto || "/usuario.png",
            evidenciasResolucion: []
          } : null,
          ciudadanoId: data.ciudadano_id,
          ciudadanoNombre: data.ciudadano_nombre,
          ciudadanoCorreo: data.ciudadano_correo
        };
        
        setReporte(reporteFormateado);
      } catch (err) {
        console.error("Error al obtener reporte:", err);
        setError("No se pudo cargar el reporte. Por favor, intenta nuevamente.");
      } finally {
        setCargando(false);
      }
    };
    
    obtenerDetalleReporte();
  }, [id]);

  // Mostrar loading o error
  if (cargando) {
    return (
      <PlantillaCiudadano tituloHeader="Detalle Reporte">
        <div className="detalle-container">
          <div style={{ textAlign: "center", padding: "50px" }}>Cargando reporte...</div>
        </div>
      </PlantillaCiudadano>
    );
  }

  if (error) {
    return (
      <PlantillaCiudadano tituloHeader="Detalle Reporte">
        <div className="detalle-container">
          <div style={{ textAlign: "center", padding: "50px", color: "red" }}>{error}</div>
        </div>
      </PlantillaCiudadano>
    );
  }

  if (!reporte) return null;

  // Seleccionar layout dinámico según rol
  const Layout =
    usuario?.rol === "autoridad" ? PlantillaAutoridad : PlantillaCiudadano;

  // Mostrar siempre la información de la institución; usar valores por defecto si no hay asignación
  const institucion = reporte.institucion || {
    nombre: "Pendiente de asignación",
    contacto: "Sin información de contacto",
    foto: "/usuario.png",
    evidenciasResolucion: []
  };

  // Cancelar reporte - cambia el estado a Archivado (estado_id = 4)
  const cancelarReporte = async () => {
    const ok = window.confirm("¿Confirma que desea cancelar este reporte?");
    if (!ok) return;
    
    try {
      // Cambiar el estado a 4 (Archivado) - usar nuevoEstado en lugar de estado_id
      await api.put(`/reportes/${id}`, {
        nuevoEstado: 4,
        comentario: "Reporte cancelado por el ciudadano"
      });
      
      // Actualizar el estado local
      setReporte((prev) => ({ ...prev, estado: "Archivado" }));
      alert("Reporte cancelado exitosamente.");
    } catch (err) {
      console.error("Error al cancelar reporte:", err);
      alert("No se pudo cancelar el reporte. Por favor, intenta nuevamente.");
    }
  };

  const prevImagen = () => {
    if (reporte.evidenciasCiudadano && reporte.evidenciasCiudadano.length > 0) {
      setIndexImagen((i) => (i - 1 + reporte.evidenciasCiudadano.length) % reporte.evidenciasCiudadano.length);
    }
  };
  const nextImagen = () => {
    if (reporte.evidenciasCiudadano && reporte.evidenciasCiudadano.length > 0) {
      setIndexImagen((i) => (i + 1) % reporte.evidenciasCiudadano.length);
    }
  };

  return (
    <Layout tituloHeader="Detalle Reporte">
      <div className="detalle-container">
        <h1 className="detalle-titulo">DETALLES DEL REPORTE</h1>

        <div className="datos-generales">
          <div className="campo">
            <label>Número de Reporte:</label>
            <input readOnly value={reporte.numero} />
          </div>
          <div className="campo">
            <label>Estado Actual:</label>
            <input readOnly value={reporte.estado} />
          </div>
          <div className="campo">
            <label>Categoría:</label>
            <input readOnly value={reporte.categoria} />
          </div>
          <div className="campo">
            <label>Fecha de Creación:</label>
            <input readOnly value={reporte.fechaCreacion} />
          </div>
        </div>

        <div className="separador-con-circulo visible" aria-hidden>
          <span className="linea"></span>
          <span className="circulo"></span>
          <span className="linea"></span>
        </div>

        <div className="problema-ubicacion">
          <div className="campo-ancho">
            <label>Título del problema:</label>
            <input readOnly value={reporte.titulo} />
          </div>

          <div className="campo-ancho">
            <label>Descripción:</label>
            <textarea readOnly value={reporte.descripcion} />
          </div>

          <div className="campo-ancho">
            <label>Ubicación:</label>
            <input readOnly value={reporte.ubicacionTexto} />
          </div>

          <div className="mapa-detalle">
            <MapContainer center={[reporte.coordenadas.lat, reporte.coordenadas.lng]} zoom={15} style={{ height: "280px", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              <Marker position={[reporte.coordenadas.lat, reporte.coordenadas.lng]} />
            </MapContainer>
          </div>
        </div>

        <div className="evidencias-galeria">
          <h3>Evidencias:</h3>
          {reporte.evidenciasCiudadano && reporte.evidenciasCiudadano.length > 0 ? (
            <div className="galeria">
              <button className="flecha left" onClick={prevImagen} aria-label="Anterior">‹</button>
              <div className="fila-thumbs">
                {(() => {
                  const imgs = reporte.evidenciasCiudadano;
                  const len = imgs.length;
                  const prev = (indexImagen - 1 + len) % len;
                  const next = (indexImagen + 1) % len;
                  return (
                    <>
                      <img className="thumb left" src={imgs[prev]} alt={`prev ${prev + 1}`} onClick={() => setIndexImagen(prev)} />
                      <img className="thumb center" src={imgs[indexImagen]} alt={`center ${indexImagen + 1}`} />
                      <img className="thumb right" src={imgs[next]} alt={`next ${next + 1}`} onClick={() => setIndexImagen(next)} />
                    </>
                  );
                })()}
              </div>
              <button className="flecha right" onClick={nextImagen} aria-label="Siguiente">›</button>
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#666" }}>No hay evidencias disponibles.</p>
          )}
        </div>

        <div className="separador-con-circulo visible" aria-hidden>
          <span className="linea"></span>
          <span className="circulo"></span>
          <span className="linea"></span>
        </div>

        <div className="institucion-asignada">
          <h3>Información de la Institución Asignada</h3>
          <div className="institucion-card">
            <div className="institucion-imagen">
              <img 
                src={institucion.foto || "/usuario.png"} 
                alt="Foto de perfil de la institución" 
                onError={(e) => {
                  e.target.src = "/usuario.png";
                }}
              />
            </div>
            <div className="institucion-detalles">
              <div className="detalle-linea columna">
                <label className="etiqueta-superior">Nombre: </label>
                <input className="input-institucion" readOnly value={institucion.nombre} />
              </div>
              <div className="detalle-linea columna">
                <label className="etiqueta-superior">Contacto: </label>
                <input className="input-institucion" readOnly value={institucion.contacto} />
              </div>
            </div>
          </div>
        </div>

        {/* Solo mostrar el botón si el rol es ciudadano y está en la sección de sus reportes */}
        {usuario?.rol === "ciudadano" && location.pathname.startsWith("/ciudadano/Mis-reportes/") && (
          <div className="acciones-pie">
            <button className="btn-cancelar" onClick={cancelarReporte}>Cancelar Reporte</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
