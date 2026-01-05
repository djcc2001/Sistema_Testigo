import { useState, useEffect } from "react";
import { MapPin, User, CalendarDays, Eye, Bell, Clock, CheckCircle, Archive } from "lucide-react";
import PlantillaAdmin from "../components/PlantillaAdmin";
import ModalDetallesAutoridad from "../components/ModalDetallesAutoridad";
import api from "../services/api";
import "../style/ReportesTotales.css";

const ReportesTotales = () => {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  
  // Estado del modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // Estados para datos reales
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar reportes al montar el componente
  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setCargando(true);
      setError(null);
      
      // Obtener todos los reportes sin paginación (límite alto)
      const response = await api.get('/reportes?limite=1000');
      
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

  // Contadores para el resumen
  const recibidos = reportes.filter(r => r.estado_nombre === "Nuevo").length;
  const pendientes = reportes.filter(r => r.estado_nombre === "En revisión").length;
  const resueltos = reportes.filter(r => r.estado_nombre === "Finalizado").length;
  const archivados = reportes.filter(r => r.estado_nombre === "Archivado").length;

  // Filtrado dinámico
  const reportesFiltrados = reportes.filter((r) => {
    const coincideBusqueda = busqueda.trim() === "" || 
      r.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.direccion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.distrito?.toLowerCase().includes(busqueda.toLowerCase());

    let coincideEstado = true;
    if (filtroEstado === "recibido") {
      coincideEstado = r.estado_nombre === "Nuevo";
    } else if (filtroEstado === "pendiente") {
      coincideEstado = r.estado_nombre === "En revisión";
    } else if (filtroEstado === "resuelto") {
      coincideEstado = r.estado_nombre === "Finalizado";
    } else if (filtroEstado === "archivado") {
      coincideEstado = r.estado_nombre === "Archivado";
    }

    return coincideBusqueda && coincideEstado;
  });

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Función para abrir modal con detalles del reporte
  const handleVerDetalles = async (reporte) => {
    try {
      const response = await api.get(`/reportes/${reporte.id}`);
      setReporteSeleccionado(response.data);
      setModalAbierto(true);
    } catch (error) {
      console.error("Error al cargar detalles del reporte:", error);
    }
  };

  // Cerrar modal y recargar
  const handleCerrarModal = () => {
    setModalAbierto(false);
    setReporteSeleccionado(null);
    cargarReportes(); // Recargar por si hubo cambios
  };

  return (
    <PlantillaAdmin tituloHeader="Reportes">
      <div className="reportes-totales-page">
        {/* Resumen superior con tarjetas */}
        <div className="resumen-cards">
          <div className="card-resumen recibidos">
            <div className="icono-resumen">
              <Bell size={32} />
            </div>
            <div className="info-resumen">
              <h3>Recibidos</h3>
              <p className="numero-resumen">{recibidos}</p>
            </div>
          </div>

          <div className="card-resumen pendientes">
            <div className="icono-resumen">
              <Clock size={32} />
            </div>
            <div className="info-resumen">
              <h3>Pendientes</h3>
              <p className="numero-resumen">{pendientes}</p>
            </div>
          </div>

          <div className="card-resumen resueltos">
            <div className="icono-resumen">
              <CheckCircle size={32} />
            </div>
            <div className="info-resumen">
              <h3>Resueltos</h3>
              <p className="numero-resumen">{resueltos}</p>
            </div>
          </div>

          <div className="card-resumen archivados">
            <div className="icono-resumen">
              <Archive size={32} />
            </div>
            <div className="info-resumen">
              <h3>Archivados</h3>
              <p className="numero-resumen">{archivados}</p>
            </div>
          </div>
        </div>

        {/* Sección de búsqueda y filtros */}
        <div className="controles-busqueda">
          <div className="barra-busqueda-wrapper">
            <input
              type="search"
              placeholder="Buscar reportes..."
              className="barra-busqueda-admin"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filtro-estado-wrapper">
            <label>Filtrar por estado:</label>
            <select
              className="filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="recibido">Recibidos</option>
              <option value="pendiente">Pendientes</option>
              <option value="resuelto">Resueltos</option>
              <option value="archivado">Archivados</option>
            </select>
          </div>
        </div>

        {/* Título de la lista */}
        <h2 className="titulo-lista">Lista de reportes</h2>

        {/* Estado de carga */}
        {cargando && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            Cargando reportes...
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
            {error}
          </div>
        )}

        {/* Lista de reportes */}
        {!cargando && !error && (
          <div className="lista-reportes-admin">
            {reportesFiltrados.length === 0 ? (
              <p className="sin-resultados">No se encontraron reportes con los criterios seleccionados.</p>
            ) : (
              reportesFiltrados.map((r) => (
                <div key={r.id} className="tarjeta-reporte-admin">
                  <div className="imagen-reporte">
                    <img 
                      src={r.evidencias?.[0]?.url || "/placeholder.jpg"} 
                      alt={r.titulo}
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                  </div>

                  <div className="contenido-reporte">
                    <h3 className="titulo-reporte-admin">{r.titulo}</h3>
                    
                    <div className="detalles-reporte">
                      <p className="linea-detalle">
                        <MapPin size={16} /> {r.direccion || r.distrito || "Sin ubicación"}
                      </p>
                      <p className="linea-detalle">
                        <CalendarDays size={16} /> {formatearFecha(r.fecha)}
                      </p>
                      <p className="linea-detalle">
                        <User size={16} /> Estado: {r.estado_nombre || "Sin estado"}
                      </p>
                    </div>
                    {/* BOTÓN QUE AHORA ABRE EL MODAL */}
                    <button
                      className="boton-ver-detalles"
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
      </div>

      {/* Modal de detalles */}
      <ModalDetallesAutoridad
        open={modalAbierto}
        onClose={handleCerrarModal}
        reporte={reporteSeleccionado}
      />
    </PlantillaAdmin>
  );
};

export default ReportesTotales;
