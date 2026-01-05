// ---------------------------
// IMPORTACIONES
// ---------------------------
import React, { useState, useEffect } from "react";
import "../style/ModalDetallesAutoridad.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { obtenerAutoridades, actualizarReporte } from "../services/api";

export default function ModalDetallesAutoridad({ open, onClose, reporte }) {

  // ---------------------------
  // ESTADO DEL CARRUSEL DE IMÁGENES
  // ---------------------------
  const [indexImagen, setIndexImagen] = useState(0);

  // ---------------------------
  // ESTADOS PARA ASIGNACIÓN Y ACTUALIZACIÓN DEL REPORTE
  // ---------------------------
  const [autoridades, setAutoridades] = useState([]);
  const [asignadoA, setAsignadoA] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("1");
  const [comentario, setComentario] = useState("");

  // ---------------------------
  // CARGAR AUTORIDADES AL ABRIR EL MODAL
  // ---------------------------
  useEffect(() => {
    if (!open) return;

    const fetchAutoridades = async () => {
      try {
        const res = await obtenerAutoridades();
        setAutoridades(res.data.autoridades || []);
      } catch (err) {
        console.error("Error al cargar autoridades:", err);
      }
    };

    fetchAutoridades();
  }, [open]);

  // ---------------------------
  // ACTUALIZAR ESTADOS CUANDO CAMBIA EL REPORTE
  // ---------------------------
  useEffect(() => {
    if (reporte) {
      // Establecer autoridad asignada (puede ser null o un ID)
      setAsignadoA(reporte.autoridad_id || "");
      // Establecer estado actual del reporte
      setNuevoEstado(reporte.estado_id?.toString() || "1");
      // Establecer comentario si existe
      setComentario(reporte.comentario || "");
    }
  }, [reporte]);

  // Si el modal no está abierto o no hay reporte, no se renderiza nada
  if (!open || !reporte) return null;

  // ---------------------------
  // MANEJO DE IMÁGENES (EVIDENCIAS)
  // ---------------------------
  const imgs = Array.isArray(reporte.evidencias)
    ? reporte.evidencias.map(e => (typeof e === 'string' ? e : e.url || e))
    : [];

  const len = imgs.length;

  const nextImagen = () => {
    if (len === 0) return;
    setIndexImagen((prev) => (prev + 1) % len);
  };

  const prevImagen = () => {
    if (len === 0) return;
    setIndexImagen((prev) => (prev - 1 + len) % len);
  };

  // ---------------------------
  // FUNCIÓN PARA ENVIAR ACTUALIZACIONES
  // ---------------------------
  const handleEnviar = async () => {
    try {
      await actualizarReporte(reporte.id, {
        asignadoA: asignadoA || null,
        nuevoEstado,
        comentario
      });

      alert("Reporte actualizado correctamente");
      onClose();
    } catch (err) {
      console.error("Error detallado:", err.response?.data || err.message);
      alert("No se pudo actualizar el reporte: " + (err.response?.data?.mensaje || "Error 400"));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>

        {/* CABECERA */}
        <div className="modal-header">
          <h2>Detalles del reporte</h2>
          <button className="cerrar-btn" onClick={onClose}>✕</button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="modal-content-detalle">

          {/* BLOQUE 1: INFORMACIÓN GENERAL Y EVIDENCIAS */}
          <div className="bloque">
            <p><strong>Título del problema:</strong> {reporte.titulo}</p>
            <p><strong>Nro de expediente:</strong> #{reporte.id}</p>

            <p><strong>Descripción:</strong></p>
            <p className="descripcion-texto">
              {reporte.descripcion || "Sin descripción disponible"}
            </p>

            <div className="evidencias-galeria">
              <h3>Evidencias:</h3>
              {len > 0 ? (
                <div className="galeria">
                  <button className="flecha left" onClick={prevImagen}>‹</button>
                  <div className="fila-thumbs">
                    {(() => {
                      const prev = (indexImagen - 1 + len) % len;
                      const next = (indexImagen + 1) % len;
                      return (
                        <>
                          <img className="thumb left" src={imgs[prev]} alt="Evidencia previa" onClick={() => setIndexImagen(prev)} />
                          <img className="thumb center" src={imgs[indexImagen]} alt="Evidencia actual" />
                          <img className="thumb right" src={imgs[next]} alt="Evidencia siguiente" onClick={() => setIndexImagen(next)} />
                        </>
                      );
                    })()}
                  </div>
                  <button className="flecha right" onClick={nextImagen}>›</button>
                </div>
              ) : <p>No hay imágenes disponibles.</p>}
            </div>
          </div>

          {/* BLOQUE 2: DETALLES, MAPA Y TIEMPO */}
          <div className="bloque">
            <h3>Detalles del reporte</h3>
            {reporte.categoria && <p><strong>Categoría:</strong> {reporte.categoria}</p>}
            <p><strong>Ubicación:</strong> {reporte.direccion || "Ubicación no disponible"}{reporte.distrito && `, ${reporte.distrito}`}</p>

            <div className="mapa-modal">
              <MapContainer center={[-13.517, -71.978]} zoom={14} style={{ height: "280px", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[-13.517, -71.978]} />
              </MapContainer>
            </div>

            <p><strong>Fecha del reporte:</strong> {
              reporte.fecha && reporte.hora 
                ? `${reporte.fecha} ${reporte.hora.includes('.') ? reporte.hora.split('.')[0] : reporte.hora}`
                : reporte.fecha || "Fecha no disponible"
            }</p>
            
            <p><strong>Tiempo transcurrido:</strong> {
              (() => {
                if (!reporte?.fecha || !reporte?.hora) return "No disponible";

                try {
                  // 1. Extraer solo la fecha YYYY-MM-DD del string ISO
                  // "2026-01-03T05:00:00.000Z" -> "2026-01-03"
                  const fechaLimpia = reporte.fecha.split('T')[0];
                  
                  // 2. Limpiar la hora de microsegundos
                  // "13:37:53.184151" -> "13:37:53"
                  const horaLimpia = reporte.hora.split('.')[0];

                  // 3. Crear el objeto Date combinando ambos
                  const fechaHora = new Date(`${fechaLimpia}T${horaLimpia}`);

                  if (isNaN(fechaHora.getTime())) return "Formato inválido";

                  const ahora = new Date();
                  const diferenciaMs = ahora - fechaHora;

                  if (diferenciaMs <= 0) return "Hace un momento";

                  const d = Math.floor(diferenciaMs / 86400000);
                  const hr = Math.floor((diferenciaMs % 86400000) / 3600000);
                  const min = Math.floor((diferenciaMs % 3600000) / 60000);

                  if (d > 0) return `${d} día${d > 1 ? 's' : ''}`;
                  if (hr > 0) return `${hr} hora${hr > 1 ? 's' : ''}`;
                  if (min > 0) return `${min} minuto${min > 1 ? 's' : ''}`;
                  
                  return "Menos de 1 minuto";

                } catch (e) {
                  console.error("Error en tiempo:", e);
                  return "Error de cálculo";
                }
              })()
            }</p>
          </div>

          {/* BLOQUE 3: INFORMACIÓN DEL CIUDADANO Y ESTADO */}
          <div className="bloque">
            <h3>Información del ciudadano</h3>
            {reporte.ciudadano_nombre ? (
              <>
                <p><strong>Nombre completo:</strong> {`${reporte.ciudadano_nombre || ''} ${reporte.ciudadano_apellido_paterno || ''} ${reporte.ciudadano_apellido_materno || ''}`.trim()}</p>
                {reporte.dni_ciudadano && <p><strong>DNI:</strong> {reporte.dni_ciudadano}</p>}
                {reporte.ciudadano_correo && <p><strong>e-mail:</strong> {reporte.ciudadano_correo}</p>}
                {reporte.telefono_ciudadano && <p><strong>Teléfono:</strong> {reporte.telefono_ciudadano}</p>}
              </>
            ) : <p>Información del ciudadano no disponible</p>}
            
            <hr style={{margin: "15px 0", borderColor: "#ddd"}} />
            
            <h3>Estado actual del reporte</h3>
            <p><strong>Estado:</strong> {reporte.estado_nombre || "Sin estado"}</p>
            {reporte.autoridad_id && reporte.autoridad_nombre ? (
              <p><strong>Asignado a:</strong> {reporte.autoridad_nombre}</p>
            ) : (
              <p><strong>Asignado a:</strong> No asignado</p>
            )}
            {reporte.comentario && (
              <>
                <p><strong>Comentario:</strong></p>
                <p style={{marginLeft: "10px", color: "#555"}}>{reporte.comentario}</p>
              </>
            )}
          </div>

          {/* BLOQUE 4: ACCIONES */}
          <div className="bloque">
            <div className="acciones-row">
              <label>Asignar:</label>
              <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)}>
                <option disabled value="">Seleccione</option>
                {autoridades.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>

              <label>Cambiar estado:</label>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                <option value="1">Nuevo</option>
                <option value="2">En revisión</option>
                <option value="3">Finalizado</option>
                <option value="4">Archivado</option>
              </select>
            </div>

            <label>Enviar comentario:</label>
            <textarea
              className="comentario-box"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escriba aquí..."
            />

            <button className="btn-enviar" onClick={handleEnviar}>Enviar</button>
          </div>

        </div>
      </div>
    </div>
  );
}