// services/osmService.js
// Servicio para obtener y normalizar reportes de tráfico desde el backend

import api from './api';

/**
 * Obtiene los reportes más recientes del backend para mostrarlos en el mapa
 * @param {number} limite - Número máximo de reportes a obtener (default: 50)
 * @returns {Promise<Array>} Array de reportes formateados para el mapa
 */
export async function obtenerReportesTrafico(limite = 50) {
  try {
    const response = await api.get('/reportes', {
      params: {
        pagina: 1,
        limite: limite
      }
    });

    const reportes = response?.data?.reportes || [];

    // Transformar datos del backend al formato esperado por el mapa
    return reportes
      .map((reporte) => {
        const fechaHora = formatearFechaHora(reporte.fecha, reporte.hora);
        const tiempoRelativo = calcularTiempoRelativo(reporte.fecha, reporte.hora);

        const lat = reporte.latitud ? parseFloat(reporte.latitud) : null;
        const lng = reporte.longitud ? parseFloat(reporte.longitud) : null;

        return {
          id: reporte.id,
          titulo: reporte.titulo || 'Sin título',
          subtitulo: reporte.categoria || 'Reporte',
          descripcion: reporte.descripcion || 'Sin descripción',
          categoria: reporte.categoria || 'Otros',
          evidencias: Array.isArray(reporte.evidencias) ? reporte.evidencias : [],
          ubicacion: reporte.direccion
            ? `📍 ${reporte.direccion}${reporte.distrito ? `, ${reporte.distrito}` : ''}`
            : '📍 Ubicación no disponible',
          fechaHora: fechaHora,
          tiempo: tiempoRelativo,
          lat: lat,
          lng: lng,
          asignado: reporte.asignado ?? false
        };
      })
      // Evitar que el mapa falle por coordenadas inválidas
      .filter((reporte) => reporte.lat !== null && reporte.lng !== null);
  } catch (error) {
    console.error('❌ Error al obtener reportes del backend:', error);
    // Retornar arreglo vacío para no romper el mapa
    return [];
  }
}

/**
 * Formatea la fecha y hora en un formato legible para el usuario
 * Ej: "15 de mayo de 2025 a las 14:30"
 */
function formatearFechaHora(fecha, hora) {
  if (!fecha) return 'Fecha no disponible';

  try {
    const fechaObj = new Date(fecha);
    const opciones = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Lima'
    };

    const fechaFormateada = fechaObj.toLocaleDateString('es-PE', opciones);

    if (hora) {
      // Quitar microsegundos si los tiene (formato HH:MM:SS.microsegundos)
      const horaFormateada = hora.includes('.') ? hora.split('.')[0] : hora;
      return `${fechaFormateada} a las ${horaFormateada}`;
    }

    return fechaFormateada;
  } catch {
    return 'Fecha no disponible';
  }
}

/**
 * Calcula el tiempo relativo desde la fecha/hora del reporte hasta ahora
 * Ej: "⏰ Hace 2 horas"
 */
function calcularTiempoRelativo(fecha, hora) {
  if (!fecha) return '⏰ Fecha no disponible';

  try {
    let fechaReporte = new Date(fecha);

    if (hora) {
      // Quitar microsegundos si los tiene
      const horaLimpia = hora.includes('.') ? hora.split('.')[0] : hora;
      const partes = horaLimpia.split(':');
      const horas = parseInt(partes[0], 10) || 0;
      const minutos = parseInt(partes[1], 10) || 0;
      const segundos = parseInt(partes[2], 10) || 0;

      fechaReporte.setHours(horas, minutos, segundos);
    }

    // Hora actual en zona Perú
    const ahora = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Lima' })
    );

    const diferenciaMs = ahora - fechaReporte;

    const minutos = Math.floor(diferenciaMs / 60000);
    const horasDif = Math.floor(diferenciaMs / 3600000);
    const dias = Math.floor(diferenciaMs / 86400000);

    if (minutos < 1) {
      return '⏰ Hace menos de un minuto';
    }
    if (minutos < 60) {
      return `⏰ Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    }
    if (horasDif < 24) {
      return `⏰ Hace ${horasDif} ${horasDif === 1 ? 'hora' : 'horas'}`;
    }
    if (dias < 30) {
      return `⏰ Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    }

    const meses = Math.floor(dias / 30);
    return `⏰ Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  } catch {
    return '⏰ Fecha no disponible';
  }
}
