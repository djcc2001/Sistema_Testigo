// AutoridadHome.jsx
import { useState, useEffect, useCallback } from "react";
import { MapPin, Building2, CalendarDays, Eye, User } from "lucide-react";
import PlantillaAutoridad from "../components/PlantillaAutoridad";
import ModalDetallesAutoridad from "../components/ModalDetallesAutoridad";
import { obtenerResumenAutoridad, listarReportesAutoridad } from "../services/api";
import "../style/AutoridadHome.css";

const AutoridadHome = () => {
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

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);

      const resumenRes = await obtenerResumenAutoridad();
      if (resumenRes.data.ok) {
        setResumen(resumenRes.data.resumen);
      }

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
  }, [filtroEstado, busqueda]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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

 const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";

    const date = new Date(fecha);

    if (isNaN(date.getTime())) return "Fecha inválida";

    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };


  return (
    <PlantillaAutoridad tituloHeader="Inicio">

      {/* Resumen */}
      <div className="resumen-reportes">
        <div className="resumen-card recibidos">
          <h3>Recibidos</h3>
          <p>{resumen.recibidos}</p>
        </div>

        <div className="resumen-card pendientes">
          <h3>Pendientes</h3>
          <p>{resumen.pendientes}</p>
        </div>

        <div className="resumen-card resueltos">
          <h3>Resueltos</h3>
          <p>{resumen.resueltos}</p>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="acciones-barra">
        <input
          type="text"
          className="buscador"
          placeholder="Buscar por título, dirección o nombre del ciudadano..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          className="filtro"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="1">Nuevo</option>
          <option value="2">En revisión</option>
          <option value="3">Finalizado</option>
          <option value="4">Archivado</option>
        </select>
      </div>

      {/* Lista */}
      <div className="mis-reportes">
        {cargando ? (
          <p className="cargando">Cargando reportes...</p>
        ) : reportes.length > 0 ? (
          reportes.map((r) => {
            const evidencias = Array.isArray(r.evidencias)
              ? r.evidencias.map(e => e.url || e)
              : r.evidencias ? [r.evidencias] : [];

            const imagenPrincipal = r.imagen_principal || evidencias[0] || "/auto.jpg";

            return (
              <div key={r.id} className="reporte-card">
                <div className="reporte-img">
                  <img src={imagenPrincipal} alt={r.titulo} />
                </div>

                <div className="reporte-info">
                  <h3>{r.titulo}</h3>

                  <p className="info-line">
                    <MapPin size={16} /> {r.direccion}
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
                    {r.estado_nombre}
                  </span>

                  <button
                    className="btn-detalle"
                    onClick={() => {
                      setReporteSeleccionado(r);
                      setModalAbierto(true);
                    }}
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

      <ModalDetallesAutoridad
        open={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setReporteSeleccionado(null);
          // Recargar datos después de cerrar el modal (por si hubo cambios)
          cargarDatos();
        }}
        reporte={reporteSeleccionado}
      />
    </PlantillaAutoridad>
  );
};

export default AutoridadHome;
