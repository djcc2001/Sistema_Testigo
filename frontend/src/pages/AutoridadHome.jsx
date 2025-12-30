// AutoridadHome.jsx
import { useState, useEffect } from "react";
import { MapPin, Building2, CalendarDays, Eye, User } from "lucide-react";
import PlantillaAutoridad from "../components/PlantillaAutoridad";
import ModalDetallesAutoridad from "../components/ModalDetallesAutoridad";
import { obtenerResumenAutoridad, listarReportesAutoridad } from "../services/api";

const AutoridadHome = () => {
  // ---------------------------
  // ESTADOS
  // ---------------------------
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState({
    recibidos: 0,
    pendientes: 0,
    resueltos: 0
  });
  const [reportes, setReportes] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // ---------------------------
  // CARGAR DATOS
  // ---------------------------
  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, busqueda]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      // Cargar resumen
      const resumenRes = await obtenerResumenAutoridad();
      if (resumenRes.data.ok) {
        setResumen(resumenRes.data.resumen);
      }

      // Cargar reportes con filtros
      const filtros = {
        estado_id: filtroEstado || null,
        busqueda: busqueda || null,
        limite: 100
      };
      
      const reportesRes = await listarReportesAutoridad(filtros);
      if (reportesRes.data.ok) {
        setReportes(reportesRes.data.reportes || []);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
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
      "Archivado": "estado"
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
    <PlantillaAutoridad tituloHeader="Inicio">
      {/* Resumen de Reportes */}
      <div className="resumen-reportes" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        <div className="resumen-card" style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.9rem" }}>Recibidos</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "#4b7bec" }}>
            {resumen.recibidos}
          </p>
        </div>
        <div className="resumen-card" style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.9rem" }}>Pendientes</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "#FFBB28" }}>
            {resumen.pendientes}
          </p>
        </div>
        <div className="resumen-card" style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.9rem" }}>Resueltos</h3>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "#00C49F" }}>
            {resumen.resueltos}
          </p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="acciones-barra" style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "1.5rem",
        flexWrap: "wrap"
      }}>
        <input
          type="text"
          placeholder="Buscar por título, dirección o nombre del ciudadano..."
          className="buscador"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: "1", minWidth: "250px" }}
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{
            padding: "0.75rem",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontSize: "0.9rem"
          }}
        >
          <option value="">Todos los estados</option>
          <option value="1">Nuevo</option>
          <option value="2">En revisión</option>
          <option value="3">Finalizado</option>
          <option value="4">Archivado</option>
        </select>
      </div>

      {/* Lista de reportes */}
      <div className="mis-reportes">
        {cargando ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>Cargando reportes...</p>
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
                    {r.estado_nombre === "Nuevo" ? "Enviado" : 
                     r.estado_nombre === "Finalizado" ? "Resuelto" : 
                     r.estado_nombre}
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
          <p className="sin-resultados">No se encontraron reportes.</p>
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

export default AutoridadHome;
