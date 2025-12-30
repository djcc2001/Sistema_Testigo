// ReportesArchivados.jsx
import { useState, useEffect } from "react";
import { MapPin, Building2, CalendarDays, Eye, User } from "lucide-react";
import PlantillaAutoridad from "../components/PlantillaAutoridad";
import ModalDetallesAutoridad from "../components/ModalDetallesAutoridad";
import { obtenerReportesArchivados } from "../services/api";

const ReportesArchivados = () => {
  // ---------------------------
  // ESTADOS
  // ---------------------------
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [reportes, setReportes] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // ---------------------------
  // CARGAR DATOS
  // ---------------------------
  useEffect(() => {
    cargarReportesArchivados();
  }, [busqueda]);

  const cargarReportesArchivados = async () => {
    try {
      setCargando(true);
      const response = await obtenerReportesArchivados(busqueda);
      if (response.data.ok) {
        setReportes(response.data.reportes || []);
      }
    } catch (error) {
      console.error("Error al cargar reportes archivados:", error);
      setReportes([]);
    } finally {
      setCargando(false);
    }
  };

  // ---------------------------
  // FUNCIONES AUXILIARES
  // ---------------------------
  const getEstadoClase = (estado) => {
    const estadoMap = {
      "Nuevo": "estado enviado",
      "En revisión": "estado revision",
      "En proceso": "estado revision",
      "Finalizado": "estado resuelto",
      "Resuelto": "estado resuelto",
      "Archivado": "estado archivado"
    };
    return estadoMap[estado] || "estado";
  };

  const formatearFecha = (fecha, hora) => {
    if (!fecha) return "Fecha no disponible";
    try {
      const fechaObj = new Date(`${fecha}T${hora || '00:00:00'}`);
      const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
      return fechaObj.toLocaleDateString('es-PE', opciones);
    } catch {
      return fecha;
    }
  };

  const handleVerDetalles = (reporte) => {
    setReporteSeleccionado(reporte);
    setModalAbierto(true);
  };

  return (
    <PlantillaAutoridad tituloHeader="Reportes Archivados">
      {/* Barra de búsqueda */}
      <div className="acciones-barra">
        <input
          type="text"
          placeholder="Buscar por título, dirección o nombre del ciudadano..."
          className="buscador"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Lista de reportes */}
      <div className="mis-reportes">
        {cargando ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>Cargando reportes archivados...</p>
        ) : reportes.length > 0 ? (
          reportes.map((r) => {
            // Formatear evidencias
            const evidencias = Array.isArray(r.evidencias) 
              ? r.evidencias.map(e => e.url || e)
              : r.evidencias 
              ? [r.evidencias]
              : [];
            
            const imagenPrincipal = r.imagen_principal || evidencias[0] || "/auto.jpg";
            
            return (
              <div key={r.id} className="reporte-card">
                <div className="reporte-img">
                  <img 
                    src={imagenPrincipal} 
                    alt={r.titulo}
                    onError={(e) => {
                      e.target.src = "/auto.jpg";
                    }}
                  />
                </div>

                <div className="reporte-info">
                  <h3>{r.titulo}</h3>
                  <p className="info-line">
                    <MapPin size={16} /> {r.direccion || "Dirección no disponible"}
                    {r.distrito && `, ${r.distrito}`}
                  </p>
                  {r.nombre_ciudadano && (
                    <p className="info-line">
                      <User size={16} /> {r.nombre_ciudadano}
                    </p>
                  )}
                  {r.categoria && (
                    <p className="info-line">
                      <Building2 size={16} /> {r.categoria}
                    </p>
                  )}
                </div>

                <div className="reporte-meta">
                  <p className="info-line fecha">
                    <CalendarDays size={16} /> {formatearFecha(r.fecha, r.hora)}
                  </p>

                  <span className={getEstadoClase(r.estado_nombre)}>
                    {r.estado_nombre === "Archivado" ? "Archivado" : r.estado_nombre}
                  </span>

                  <button
                    className="btn-detalle"
                    onClick={() => handleVerDetalles({
                      ...r,
                      evidencias: evidencias,
                      nombre_ciudadano: r.nombre_ciudadano,
                      dni_ciudadano: r.dni_ciudadano,
                      correo_ciudadano: r.correo_ciudadano,
                      telefono_ciudadano: r.telefono_ciudadano
                    })}
                  >
                    <Eye size={16} /> Ver Detalles
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="sin-resultados">No se encontraron reportes archivados.</p>
        )}
      </div>

      {/* ---------------------------
          MODAL DE DETALLES
      --------------------------- */}
      <ModalDetallesAutoridad
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        reporte={reporteSeleccionado}
      />
    </PlantillaAutoridad>
  );
};

export default ReportesArchivados;
