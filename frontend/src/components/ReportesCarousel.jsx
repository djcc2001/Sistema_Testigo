import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "../style/reportesCarousel.css";
import { obtenerReportesRecientes } from "../services/api";

export default function CarruselReportes() {
  const [listaReportes, setListaReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        setCargando(true);
        const response = await obtenerReportesRecientes(5);
        const reportes = response.data.reportes || [];
        
        // Formatear los reportes para el carrusel
        const reportesFormateados = reportes.map((reporte) => {
          // Calcular tiempo transcurrido
          let tiempoTexto = "⏰ Reciente";
          
          if (reporte.fecha && reporte.hora) {
            try {
              // Formatear la hora para quitar microsegundos si los tiene
              let horaFormateada = reporte.hora;
              if (horaFormateada.includes('.')) {
                horaFormateada = horaFormateada.split('.')[0];
              }
              
              const fechaHora = new Date(`${reporte.fecha}T${horaFormateada}`);
              
              // Validar que la fecha sea válida
              if (!isNaN(fechaHora.getTime())) {
                const ahora = new Date();
                const diferenciaMs = ahora - fechaHora;
                
                // Solo calcular si la diferencia es positiva (fecha no es futura)
                if (diferenciaMs > 0) {
                  const diferenciaMin = Math.floor(diferenciaMs / 60000);
                  const diferenciaHoras = Math.floor(diferenciaMs / 3600000);
                  const diferenciaDias = Math.floor(diferenciaMs / 86400000);

                  if (diferenciaMin < 60) {
                    tiempoTexto = `⏰ Hace ${diferenciaMin} min`;
                  } else if (diferenciaHoras < 24) {
                    tiempoTexto = `⏰ Hace ${diferenciaHoras} h`;
                  } else {
                    tiempoTexto = `⏰ Hace ${diferenciaDias} día${diferenciaDias > 1 ? 's' : ''}`;
                  }
                }
              }
            } catch (error) {
              console.error("Error al calcular tiempo transcurrido:", error);
              tiempoTexto = "⏰ Reciente";
            }
          }

          // Usar imagen del reporte o imagen por defecto
          const imagen = reporte.imagen_principal || "/auto.jpg";
          
          // Ubicación formateada
          const ubicacion = reporte.distrito 
            ? `📍 ${reporte.distrito}${reporte.direccion ? ', ' + reporte.direccion : ''}`
            : reporte.direccion 
            ? `📍 ${reporte.direccion}`
            : "📍 Ubicación no especificada";

          return {
            id: reporte.id,
            titulo: reporte.titulo,
            subtitulo: reporte.categoria || "Reporte",
            imagen: imagen,
            ubicacion: ubicacion,
            tiempo: tiempoTexto,
            descripcion: reporte.descripcion || "Sin descripción",
          };
        });

        setListaReportes(reportesFormateados);
      } catch (error) {
        console.error("Error al cargar reportes recientes:", error);
        // En caso de error, mantener lista vacía o mostrar mensaje
        setListaReportes([]);
      } finally {
        setCargando(false);
      }
    };

    cargarReportes();
  }, []);

  if (cargando) {
    return (
      <section className="seccion-reportes">
        <h2>Reportes recientes</h2>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Cargando reportes...</p>
        </div>
      </section>
    );
  }

  if (listaReportes.length === 0) {
    return (
      <section className="seccion-reportes">
        <h2>Reportes recientes</h2>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>No hay reportes recientes disponibles</p>
        </div>
      </section>
    );
  }

  return (
    <section className="seccion-reportes">
      <h2>Reportes recientes</h2>

      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true }}
        loop={listaReportes.length > 1}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="contenedor-tarjetas"
      >
        {listaReportes.map((reporte) => (
          <SwiperSlide key={reporte.id}>
            <div className="tarjeta-reporte">
              <img 
                src={reporte.imagen} 
                alt={reporte.titulo}
                onError={(e) => {
                  e.target.src = "/auto.jpg"; // Fallback si la imagen falla
                }}
              />
              <div className="info-tarjeta">
                <h3>{reporte.titulo}</h3>
                <p className="subtitulo">{reporte.subtitulo}</p>
                <div className="fila">
                  <span>{reporte.ubicacion}</span>
                  <span>{reporte.tiempo}</span>
                </div>
                <p>{reporte.descripcion}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
