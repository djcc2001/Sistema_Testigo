import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LayoutPrincipal from "../components/PlantillaCiudadano";
import "../style/Reportes.css";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";

export default function Reportes() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0
  });

  // Función para obtener reportes desde el backend
  const obtenerReportes = async (pagina = 1) => {
    try {
      setCargando(true);
      setError(null);
      
      const response = await api.get('/reportes', {
        params: {
          pagina,
          limite: 10
        }
      });

      setReportes(response.data.reportes);
      setPaginacion(response.data.paginacion);
    } catch (err) {
      console.error("Error al obtener reportes:", err);
      setError("No se pudieron cargar los reportes. Por favor, intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  // Cargar reportes al montar el componente
  useEffect(() => {
    obtenerReportes(1);
  }, []);

  const verDetalle = (id) => {
    navigate(`/reportes/${id}`);
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= paginacion.totalPaginas) {
      obtenerReportes(nuevaPagina);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <LayoutPrincipal tituloHeader="Reportes" activeMenu="reportes">
      <div className="reportes-page">
        <div className="reportes-header">
          <div className="logo-wrapper">
            <img src="/logo.png" alt="testiGO" className="reportes-logo" />
          </div>
          <h2 className="reportes-title">REPORTES: </h2>
        </div>

        {cargando ? (
          <div className="reportes-loading">Cargando reportes...</div>
        ) : error ? (
          <div className="reportes-error">{error}</div>
        ) : reportes.length === 0 ? (
          <div className="reportes-vacio">No hay reportes disponibles.</div>
        ) : (
          <>
            <div className="reportes-table-wrapper">
              <table className="reportes-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Fecha de reporte</th>
                    <th>Asignado</th>
                    <th>Estado</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? "fila-verde" : "fila-blanca"}>
                      <td>{r.titulo}</td>
                      <td>{formatearFecha(r.fecha)}</td>
                      <td>{r.asignado ? (r.autoridad_nombre || "Asignado") : "No asignado"}</td>
                      <td>
                        <span className={`estado ${r.estado_nombre?.replace(/\s+/g, "-").toLowerCase() || "enviado"}`}>
                          {r.estado_nombre || "Enviado"}
                        </span>
                      </td>
                      <td>
                        <button className="ver-link" onClick={() => verDetalle(r.id)}>
                          <Eye size={14} /> Ver...
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación */}
            <div className="reportes-paginacion">
              <button 
                className="btn-paginacion"
                onClick={() => cambiarPagina(paginacion.pagina - 1)}
                disabled={paginacion.pagina === 1}
              >
                <ChevronLeft size={18} /> Anterior
              </button>
              
              <div className="paginas-numeros">
                {Array.from({ length: paginacion.totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    className={`btn-numero ${num === paginacion.pagina ? "activo" : ""}`}
                    onClick={() => cambiarPagina(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button 
                className="btn-paginacion"
                onClick={() => cambiarPagina(paginacion.pagina + 1)}
                disabled={paginacion.pagina === paginacion.totalPaginas}
              >
                Siguiente <ChevronRight size={18} />
              </button>
            </div>

            <div className="reportes-info">
              Mostrando {((paginacion.pagina - 1) * paginacion.limite) + 1} - {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de {paginacion.total} reportes
            </div>
          </>
        )}
      </div>
    </LayoutPrincipal>
  );
}
