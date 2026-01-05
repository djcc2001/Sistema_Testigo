import { useState, useEffect } from "react";
import { MapPin, Building2, CalendarDays, Eye, Loader2 } from "lucide-react";
import PlantillaAutoridad from "../components/PlantillaAutoridad";
import ModalDetallesAutoridad from "../components/ModalDetallesAutoridad";
import { listarReportesAutoridad } from "../services/api";
import "../style/ReportesRecibidos.css";


const ReportesRecibidos = () => {
  // ---------------------------
  // ESTADO DE BÚSQUEDA
  // ---------------------------
  const [busqueda, setBusqueda] = useState("");

  // ---------------------------
  // ESTADO DEL MODAL
  // ---------------------------
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // ---------------------------
  // ESTADO DE REPORTES Y CARGA
  // ---------------------------
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // ---------------------------
  // CARGAR REPORTES DESDE LA API
  // ---------------------------
  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setCargando(true);
      setError(null);
      
      // Obtener todos los reportes de la autoridad (sin filtrar por estado)
      const response = await listarReportesAutoridad({
        limite: 100,
        pagina: 1
      });

      if (response.data && response.data.reportes) {
        setReportes(response.data.reportes);
      }
    } catch (err) {
      console.error("Error al cargar reportes:", err);
      setError("No se pudieron cargar los reportes");
    } finally {
      setCargando(false);
    }
  };

  // ---------------------------
  // FILTRO DINÁMICO
  // ---------------------------
  const reportesFiltrados = reportes.filter((r) => {
    const texto = busqueda.toLowerCase();
    return (
      r.titulo?.toLowerCase().includes(texto) ||
      r.direccion?.toLowerCase().includes(texto) ||
      r.distrito?.toLowerCase().includes(texto) ||
      r.nombre_ciudadano?.toLowerCase().includes(texto)
    );
  });


  // ---------------------------
  // COLORES POR ESTADO
  // ---------------------------
  const getEstadoClase = (estado) => {
    switch (estado) {
      case "Nuevo":
        return "estado nuevo";
      case "En revisión":
        return "estado revision";
      case "Finalizado":
        return "estado finalizado";
      case "Archivado":
        return "estado archivado";
      default:
        return "estado";
    }
  };

  // ---------------------------
  // FORMATEAR FECHA
  // ---------------------------
  const formatearFecha = (fecha, hora) => {
    if (!fecha) return "Sin fecha";
    
    const meses = {
      "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
      "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
      "09": "Set", "10": "Oct", "11": "Nov", "12": "Dic"
    };
    
    const [anio, mes, dia] = fecha.split("-");
    return `${meses[mes]} ${dia}, ${anio}`;
  };

  // ---------------------------
  // FUNCIÓN ABRIR MODAL
  // ---------------------------
  const handleVerDetalles = (reporte) => {
    setReporteSeleccionado(reporte);
    setModalAbierto(true);
  };

  // ---------------------------
  // MANEJAR CIERRE DE MODAL Y RECARGAR
  // ---------------------------
  const handleCerrarModal = () => {
    setModalAbierto(false);
    setReporteSeleccionado(null);
    // Recargar reportes después de cerrar el modal (por si hubo cambios)
    cargarReportes();
  };

  return (
    <PlantillaAutoridad tituloHeader="Reportes recibidos">
      {/* Barra superior con búsqueda */}
      <div className="acciones-barra">
        <input
          type="text"
          placeholder="Buscar por título, dirección, distrito o ciudadano..."
          className="buscador"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Estado de carga */}
      {cargando && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Loader2 size={48} className="spinning" />
          <p>Cargando reportes...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ 
          textAlign: "center", 
          padding: "2rem", 
          color: "#e74c3c",
          backgroundColor: "#fadbd8",
          borderRadius: "8px",
          margin: "1rem"
        }}>
          <p>{error}</p>
          <button 
            onClick={cargarReportes}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de reportes */}
      {!cargando && !error && (
        <div className="mis-reportes">
          {reportesFiltrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#7f8c8d" }}>
              <p>No se encontraron reportes</p>
            </div>
          ) : (
            reportesFiltrados.map((r) => (
              <div key={r.id} className="reporte-card">
                <div className="reporte-img">
                  <img 
                    src={r.imagen_principal || "/placeholder.jpg"} 
                    alt={r.titulo}
                    onError={(e) => {
                      e.target.src = "/placeholder.jpg";
                    }}
                  />
                </div>

                <div className="reporte-info">
                  <h3>{r.titulo}</h3>
                  <p className="info-line">
                    <MapPin size={16} /> {r.direccion || "Sin dirección"} {r.distrito ? `- ${r.distrito}` : ""}
                  </p>
                  <p className="info-line">
                    <Building2 size={16} /> {r.nombre_ciudadano || "Sin asignar"}
                  </p>
                </div>

                <div className="reporte-meta">
                  <p className="info-line fecha">
                    <CalendarDays size={16} /> {formatearFecha(r.fecha, r.hora)}
                  </p>
                  <span className={getEstadoClase(r.estado_nombre)}>
                    {r.estado_nombre}
                  </span>

                  {/* BOTÓN QUE AHORA ABRE EL MODAL */}
                  <button
                    className="btn-detalle"
                    onClick={() => handleVerDetalles(r)}
                  >
                    <Eye size={16} /> Ver Detalles
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL */}
      <ModalDetallesAutoridad
        open={modalAbierto}
        onClose={handleCerrarModal}
        reporte={reporteSeleccionado}
      />
    </PlantillaAutoridad>
  );
};

export default ReportesRecibidos;