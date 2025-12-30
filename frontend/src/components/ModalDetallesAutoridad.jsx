import React, { useState } from "react";
import "../style/ModalDetallesAutoridad.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function ModalDetallesAutoridad({ open, onClose, reporte }) {

  // ---------------------------
  // ESTADO PARA EL CARRUSEL
  // ---------------------------
  const [indexImagen, setIndexImagen] = useState(0);

  // Si el modal no está abierto o no hay reporte → no mostrar
  if (!open || !reporte) return null;

  // Formatear evidencias: pueden ser array de URLs o array de objetos {url, tipo}
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h2>Detalles del reporte</h2>
          <button className="cerrar-btn" onClick={onClose}>✕</button>
        </div>

        {/* Contenido principal */}
        <div className="modal-content-detalle">

          {/* Bloque principal */}
          <div className="bloque">
            <p><strong>Título del problema:</strong> {reporte.titulo}</p>
            <p><strong>Nro de expediente:</strong> #{reporte.id}</p>

            <p><strong>Descripción:</strong></p>
            <p className="descripcion-texto">
              {reporte.descripcion || "Sin descripción disponible"}
            </p>

            {/* GALERÍA / CARRUSEL */}
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
                          <img
                            className="thumb left"
                            src={imgs[prev]}
                            alt="Evidencia previa"
                            onClick={() => setIndexImagen(prev)}
                          />

                          <img
                            className="thumb center"
                            src={imgs[indexImagen]}
                            alt="Evidencia actual"
                          />

                          <img
                            className="thumb right"
                            src={imgs[next]}
                            alt="Evidencia siguiente"
                            onClick={() => setIndexImagen(next)}
                          />
                        </>
                      );
                    })()}
                  </div>

                  <button className="flecha right" onClick={nextImagen}>›</button>
                </div>
              ) : (
                <p>No hay imágenes disponibles.</p>
              )}
            </div>

          </div>

          {/* Detalles del reporte */}
          <div className="bloque">
            <h3>Detalles del reporte</h3>
            
            {reporte.categoria && (
              <p><strong>Categoría:</strong> {reporte.categoria}</p>
            )}
            <p><strong>Ubicación:</strong> {reporte.direccion || "Ubicación no disponible"}
              {reporte.distrito && `, ${reporte.distrito}`}
            </p>

            <div className="mapa-modal">
              <MapContainer
                center={[-13.517, -71.978]}
                zoom={14}
                style={{ height: "280px", width: "100%" }}
              >
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
                if (reporte.fecha && reporte.hora) {
                  try {
                    let horaFormateada = reporte.hora;
                    if (horaFormateada.includes('.')) {
                      horaFormateada = horaFormateada.split('.')[0];
                    }
                    const fechaHora = new Date(`${reporte.fecha}T${horaFormateada}`);
                    if (!isNaN(fechaHora.getTime())) {
                      const ahora = new Date();
                      const diferenciaMs = ahora - fechaHora;
                      if (diferenciaMs > 0) {
                        const diferenciaDias = Math.floor(diferenciaMs / 86400000);
                        const diferenciaHoras = Math.floor((diferenciaMs % 86400000) / 3600000);
                        if (diferenciaDias > 0) {
                          return `${diferenciaDias} día${diferenciaDias > 1 ? 's' : ''}`;
                        } else if (diferenciaHoras > 0) {
                          return `${diferenciaHoras} hora${diferenciaHoras > 1 ? 's' : ''}`;
                        } else {
                          return "Menos de 1 hora";
                        }
                      }
                    }
                  } catch (error) {
                    console.error("Error al calcular tiempo:", error);
                  }
                }
                return "No disponible";
              })()
            }</p>
          </div>

          {/* Información del ciudadano */}
          <div className="bloque">
            <h3>Información del ciudadano</h3>

            {reporte.nombre_ciudadano ? (
              <>
                <p><strong>Nombre completo:</strong> {reporte.nombre_ciudadano}</p>
                {reporte.dni_ciudadano && (
                  <p><strong>DNI:</strong> {reporte.dni_ciudadano}</p>
                )}
                {reporte.correo_ciudadano && (
                  <p><strong>e-mail:</strong> {reporte.correo_ciudadano}</p>
                )}
                {reporte.telefono_ciudadano && (
                  <p><strong>Teléfono:</strong> {reporte.telefono_ciudadano}</p>
                )}
              </>
            ) : (
              <p>Información del ciudadano no disponible</p>
            )}

          </div>

          {/* Acciones */}
          <div className="bloque">
            <div className="acciones-row">
              <label>Asignar:</label>
              <select>
                <option disabled selected>Seleccione</option>
                <option>Municipalidad</option>
                <option>Serenazgo</option>
                <option>Aguas del Cusco</option>
              </select>

              <label>Cambiar estado:</label>
              <select>
                <option>Enviado</option>
                <option>En revisión</option>
                <option>Resuelto</option>
              </select>
            </div>

            <label>Enviar comentario:</label>
            <textarea className="comentario-box"></textarea>

            <button className="btn-enviar">Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
