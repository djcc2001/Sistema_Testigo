import React, { useState, useEffect } from "react";
import { MapPin, Building2, CalendarDays, Eye } from "lucide-react";
import LayoutPrincipal from "../components/PlantillaCiudadano";
import "../style/MisReportes.css";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const MisReportes = () => {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerMisReportes = async () => {
      try {
        setCargando(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError("No estás autenticado");
          setCargando(false);
          return;
        }

        // Llamada al endpoint que corregimos en el backend
        const response = await api.get('/reportes/usuario/mis-reportes');

        if (response.data && response.data.reportes) {
          setReportes(response.data.reportes);
        } else {
          setReportes([]);
        }
      } catch (err) {
        console.error("Error al obtener mis reportes:", err);
        setError("No se pudieron cargar tus reportes. Por favor, intenta nuevamente.");
      } finally {
        setCargando(false);
      }
    };

    obtenerMisReportes();
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return "Fecha inválida";
    
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEstadoClase = (estado) => {
    if (!estado) return "estado";
    
    const estadoNormalizado = estado.toLowerCase();
    
    if (estadoNormalizado.includes("nuevo") || estadoNormalizado.includes("enviado")) {
      return "estado enviado";
    }
    if (estadoNormalizado.includes("revisión") || estadoNormalizado.includes("revision") || estadoNormalizado.includes("proceso")) {
      return "estado revision";
    }
    if (estadoNormalizado.includes("finalizado") || estadoNormalizado.includes("resuelto")) {
      return "estado resuelto";
    }
    if (estadoNormalizado.includes("rechazado") || estadoNormalizado.includes("cancelado") || estadoNormalizado.includes("archivado")) {
      return "estado rechazado";
    }
    
    return "estado";
  };

  return (
    <LayoutPrincipal tituloHeader="Mis Reportes">
      <div className="mis-reportes">
        {cargando ? (
          <div style={{ textAlign: "center", padding: "50px" }}>Cargando tus reportes...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "50px", color: "red" }}>{error}</div>
        ) : reportes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px" }}>No tienes reportes aún.</div>
        ) : (
          reportes.map((r) => {
            // LÓGICA DE IMAGENES: Extraemos la URL de las evidencias enviadas por el backend
            const evidencias = Array.isArray(r.evidencias)
              ? r.evidencias.map(e => e.url || e) 
              : [];

            // La imagen principal será la primera del array de evidencias o el placeholder
            const imagenAMostrar = evidencias.length > 0 ? evidencias[0] : "/baches.jpg";

            return (
              <div key={r.id} className="reporte-card">
                <div className="reporte-img">
                  <img 
                    src={imagenAMostrar} 
                    alt={r.titulo} 
                    onError={(e) => { e.target.src = "/baches.jpg"; }} // Fallback por si la URL falla
                  />
                </div>
                
                <div className="reporte-info">
                  <h3>{r.titulo}</h3>
                  <p className="info-line">
                    <MapPin size={16} /> {r.direccion || r.distrito || "Sin dirección"}
                  </p>
                  <p className="info-line">
                    <Building2 size={16} /> {r.categoria || "Sin categoría"}
                  </p>
                </div>

                <div className="reporte-meta">
                  <p className="info-line fecha">
                    <CalendarDays size={16} /> {formatearFecha(r.fecha)}
                  </p>
                  <span className={getEstadoClase(r.estado_nombre)}>
                    {r.estado_nombre}
                  </span>
                  <button
                    className="btn-detalle"
                    onClick={() => navigate(`/ciudadano/Mis-reportes/${r.id}`)}
                  >
                    <Eye size={16} /> Ver Detalles
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </LayoutPrincipal>
  );
};

export default MisReportes;