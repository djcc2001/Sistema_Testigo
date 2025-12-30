import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { obtenerReportesTrafico } from "../services/osmService";
import "../style/modalReporte.css";

/* ================= ICONOS ================= */

const iconoTrafico = L.icon({
  iconUrl: "/marcador.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const iconoUsuario = L.icon({
  iconUrl: "/usuario.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

/* ========== CENTRAR MAPA EN USUARIO ========== */

function CentrarEnUsuario({ posicion }) {
  const map = useMap();

  useEffect(() => {
    if (posicion) {
      map.setView(posicion, 15);
    }
  }, [posicion, map]);

  return null;
}

/* ================= COMPONENTE ================= */

export default function MapaInicio() {
  const [reportes, setReportes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [posicionUsuario, setPosicionUsuario] = useState(null);
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  /* ========== CARGA INICIAL ========== */

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const datos = await obtenerReportesTrafico();
        const validos = datos.filter(
          (r) => r.lat && r.lng && !isNaN(r.lat) && !isNaN(r.lng)
        );
        setReportes(validos);
        setErrorCarga(null);
      } catch (error) {
        console.error(error);
        setErrorCarga("No se pudieron cargar los reportes.");
      }
    };

    cargarReportes();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosicionUsuario([pos.coords.latitude, pos.coords.longitude]);
          setCargando(false);
        },
        () => {
          setPosicionUsuario([-13.517088, -71.978535]); // Cusco
          setCargando(false);
        }
      );
    } else {
      setPosicionUsuario([-13.517088, -71.978535]);
      setCargando(false);
    }
  }, []);

  const cerrarModal = () => {
    setReporteSeleccionado(null);
    setDescripcionExpandida(false);
  };

  if (cargando) {
    return (
      <div className="cargando">
        <div className="loader"></div>
        <p>Cargando mapa y reportes...</p>
      </div>
    );
  }

  /* ================= RENDER ================= */

  return (
    <div className="contenedor-mapa">

      <MapContainer
        center={posicionUsuario || [-13.517088, -71.978535]}
        zoom={15}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CentrarEnUsuario posicion={posicionUsuario} />

        {posicionUsuario && (
          <Marker position={posicionUsuario} icon={iconoUsuario}>
            <Popup>Tu ubicación</Popup>
          </Marker>
        )}

        {reportes.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={iconoTrafico}
            eventHandlers={{
              click: () => setReporteSeleccionado(r),
            }}
          >
            <Popup>
              <strong>{r.titulo}</strong>
              <br />
              <small>{r.categoria}</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ================= MODAL ================= */}

      {reporteSeleccionado && (
        <div className="fondo-modal" onClick={cerrarModal}>
          <div className="modal-reporte" onClick={(e) => e.stopPropagation()}>

            {/* HEADER */}
            <div className="modal-header">
              <button className="cerrar-modal" onClick={cerrarModal}>×</button>
              <h2 className="titulo-reporte" style={{ color: '#fff' }}>
                {reporteSeleccionado.titulo}
              </h2>
            </div>

            {/* BODY */}
            <div className="modal-body">

              {/* COLLAGE DE EVIDENCIAS */}
              {reporteSeleccionado.evidencias?.length > 0 ? (() => {
                const cantidad = reporteSeleccionado.evidencias.length;
                const clase =
                  cantidad === 1 ? "una" :
                  cantidad === 2 ? "dos" :
                  "tres-mas";

                return (
                  <div className={`collage-evidencias ${clase}`}>
                    {reporteSeleccionado.evidencias.map((e, i) => (
                      <div key={i} className="evidencia-item">
                        {e.tipo === "video" ? (
                          <video
                            src={e.url}
                            controls
                            className="evidencia-media"
                          />
                        ) : (
                          <img
                            src={e.url}
                            alt={`Evidencia ${i + 1}`}
                            className="evidencia-media"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <div className="sin-imagen">📷 Sin evidencias</div>
              )}

              {/* INFO */}
              <div className="info-grid">
                <div className="info-card">
                  <strong>Categoría</strong>
                  <span className="categoria-badge" style={{ color: '#fff' }}>
                    {reporteSeleccionado.categoria}
                  </span>
                </div>

                <div className="info-card">
                  <strong>Fecha</strong>
                  <span>{reporteSeleccionado.fechaHora || reporteSeleccionado.tiempo}</span>
                </div>

                <div className="info-card">
                  <strong>Ubicación</strong>
                  <span>{reporteSeleccionado.ubicacion?.replace("📍 ", "")}</span>
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="descripcion-card">
                <strong>Descripción</strong>
                <p className="descripcion-reporte">
                  {descripcionExpandida
                    ? reporteSeleccionado.descripcion
                    : reporteSeleccionado.descripcion?.slice(0, 200)}
                  {reporteSeleccionado.descripcion?.length > 200 && (
                    <span
                      className="ver-mas"
                      onClick={() => setDescripcionExpandida(!descripcionExpandida)}
                    >
                      {descripcionExpandida ? " Ver menos" : " Ver más"}
                    </span>
                  )}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
