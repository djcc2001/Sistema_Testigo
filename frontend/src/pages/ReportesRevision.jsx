// ReportesRevision.jsx
import { useState, useEffect } from "react";
import { MapPin, Building2, CalendarDays, Eye } from "lucide-react";
import { obtenerReportesEnRevision } from "../services/api";
import PlantillaAutoridad from "../components/PlantillaAutoridad";
import ModalDetallesAutoridad from "../components/ModalDetallesAutoridad";
import "../style/MisReportes.css";

const ReportesRevision = () => {
  const [busqueda, setBusqueda] = useState("");
  const [reportes, setReportes] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // ---------------------------
  // CARGAR REPORTES (estado_id = 2)
  // ---------------------------
  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const res = await obtenerReportesEnRevision(busqueda);
        setReportes(res.data.reportes || []);
      } catch (error) {
        console.error("Error cargando reportes en revisión", error);
      }
    };

    cargarReportes();
  }, [busqueda]);

  // ---------------------------
  // VER DETALLES
  // ---------------------------
  const handleVerDetalles = (reporte) => {
    setReporteSeleccionado(reporte);
    setModalAbierto(true);
  };

  return (
    <PlantillaAutoridad tituloHeader="Reportes en Revisión">
      {/* Barra superior con búsqueda */}
      <div className="acciones-barra">
        <input
          type="text"
          placeholder="Buscar por título, dirección o entidad..."
          className="buscador"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Lista de reportes */}
      <div className="mis-reportes">
        {reportes.length > 0 ? (
          reportes.map((r) => {
            // ---------------------------
            // EVIDENCIAS / IMAGEN PRINCIPAL
            // ---------------------------
            const evidencias = Array.isArray(r.evidencias)
              ? r.evidencias.map((e) => e.url || e)
              : r.evidencias
              ? [r.evidencias]
              : [];

            const imagenPrincipal =
              r.imagen_principal || evidencias[0] || "/auto.jpg";

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
                    <MapPin size={16} />{" "}
                    {r.direccion || "Dirección no disponible"}
                  </p>
                  <p className="info-line">
                    <Building2 size={16} /> {r.entidad || "Sin asignar"}
                  </p>
                </div>

                <div className="reporte-meta">
                  <p className="info-line fecha">
                    <CalendarDays size={16} /> {r.fecha}
                  </p>

                  {/* Estado fijo: En revisión */}
                  <span className="estado revision">En revisión</span>

                  <button
                    className="btn-detalle"
                    onClick={() =>
                      handleVerDetalles({
                        ...r,
                        evidencias
                      })
                    }
                  >
                    <Eye size={16} /> Ver Detalles
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="sin-resultados">
            No se encontraron reportes en revisión.
          </p>
        )}
      </div>

      {/* MODAL */}
      <ModalDetallesAutoridad
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        reporte={reporteSeleccionado}
      />
    </PlantillaAutoridad>
  );
};

export default ReportesRevision;
