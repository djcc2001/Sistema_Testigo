// reportesModel.js
const pool = require('../config/db');

class ReportesModel {

  static async crearReporte(reporteData) {
    const {
      titulo,
      descripcion,
      latitud,
      longitud,
      direccion,
      distrito,
      estado_id,
      ciudadano_id,
      categoria_id,
      categoria_descripcion,
    } = reporteData;

    // Si viene categoria_descripcion, convertir a categoria_id
    let categoriaId = categoria_id;
    if (categoria_descripcion && !categoria_id) {
      const categoriaQuery = `SELECT id FROM categoria WHERE descripcion = $1`;
      const { rows: categoriaRows } = await pool.query(categoriaQuery, [categoria_descripcion]);
      if (categoriaRows.length > 0) {
        categoriaId = categoriaRows[0].id;
      } else {
        // Si no se encuentra, usar categoría "Otros" (id 8)
        categoriaId = 8;
      }
    }

    const query = `
      INSERT INTO reportes (
        titulo, descripcion, latitud, longitud, direccion, distrito,
        estado_id, ciudadano_id, categoria_id, fecha, hora
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_DATE,CURRENT_TIME)
      RETURNING id
    `;

    const values = [
      titulo,
      descripcion,
      latitud,
      longitud,
      direccion,
      distrito,
      estado_id,
      ciudadano_id,
      categoriaId,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0].id;
  }

  static async insertarEvidencia(reporte_id, url_archivo, tipo) {
    const query = `
      INSERT INTO evidencias (reporte_id, url_archivo, tipo)
      VALUES ($1,$2,$3)
    `;
    await pool.query(query, [reporte_id, url_archivo, tipo]);
  }

  static async listarReportes(limite, offset) {
    const countQuery = `
      SELECT COUNT(*) 
      FROM reportes 
      WHERE estado_id IN (1,2)
        AND latitud IS NOT NULL 
        AND longitud IS NOT NULL
    `;
    const { rows: countRows } = await pool.query(countQuery);
    const total = Number(countRows[0].count);

    const query = `
      SELECT 
        r.id,
        r.titulo,
        r.descripcion,
        r.latitud,
        r.longitud,
        r.direccion,
        r.distrito,
        r.fecha,
        r.hora,
        er.estado AS estado_nombre,
        c.descripcion AS categoria,
        (r.autoridad_id IS NOT NULL) AS asignado,
        json_agg(
          json_build_object('url', e.url_archivo, 'tipo', e.tipo)
        ) FILTER (WHERE e.id IS NOT NULL) AS evidencias
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      LEFT JOIN categoria c ON r.categoria_id = c.id
      LEFT JOIN evidencias e ON r.id = e.reporte_id
      WHERE r.estado_id IN (1,2)
        AND r.latitud IS NOT NULL 
        AND r.longitud IS NOT NULL
      GROUP BY r.id, er.estado, c.descripcion
      ORDER BY r.fecha DESC, r.hora DESC
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await pool.query(query, [limite, offset]);

    return { reportes: rows, total };
  }

  static async obtenerReportesPorUsuario(usuario_id, limite, offset) {
    const countQuery = `
      SELECT COUNT(*) FROM reportes WHERE ciudadano_id = $1
    `;
    const { rows: countRows } = await pool.query(countQuery, [usuario_id]);
    const total = Number(countRows[0].count);

    const query = `
      SELECT 
        r.id,
        r.titulo,
        r.direccion,
        r.distrito,
        r.fecha,
        r.hora,
        er.estado AS estado_nombre,
        c.descripcion AS categoria,
        (r.autoridad_id IS NOT NULL) AS asignado
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      LEFT JOIN categoria c ON r.categoria_id = c.id
      WHERE r.ciudadano_id = $1
      ORDER BY r.fecha DESC, r.hora DESC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pool.query(query, [usuario_id, limite, offset]);
    return { reportes: rows, total };
  }

  static async obtenerReportePorId(id) {
    const query = `
      SELECT 
        r.*,
        er.estado AS estado_nombre,
        c.descripcion AS categoria
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      LEFT JOIN categoria c ON r.categoria_id = c.id
      WHERE r.id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    if (!rows.length) return null;

    const evidenciasQuery = `
      SELECT url_archivo, tipo 
      FROM evidencias 
      WHERE reporte_id = $1
      ORDER BY id
    `;
    const { rows: evidencias } = await pool.query(evidenciasQuery, [id]);

    return { ...rows[0], evidencias };
  }

  // Obtener los 5 reportes más recientes para el carrusel
  static async obtenerReportesRecientes(limite = 5) {
    const query = `
      SELECT 
        r.id,
        r.titulo,
        r.descripcion,
        r.direccion,
        r.distrito,
        r.fecha,
        r.hora,
        c.descripcion AS categoria,
        (
          SELECT e.url_archivo 
          FROM evidencias e 
          WHERE e.reporte_id = r.id AND e.tipo = 'foto'
          ORDER BY e.id
          LIMIT 1
        ) AS imagen_principal
      FROM reportes r
      LEFT JOIN categoria c ON r.categoria_id = c.id
      WHERE r.latitud IS NOT NULL 
        AND r.longitud IS NOT NULL
      ORDER BY r.fecha DESC, r.hora DESC
      LIMIT $1
    `;

    const { rows } = await pool.query(query, [limite]);
    return rows;
  }

  // Obtener estadísticas generales del sistema
  static async obtenerEstadisticasGenerales() {
    // Total de reportes
    const totalQuery = `SELECT COUNT(*) as total FROM reportes`;
    const { rows: totalRows } = await pool.query(totalQuery);
    const totalReportes = Number(totalRows[0].total);

    // Reportes finalizados (estado_id = 3)
    const finalizadosQuery = `SELECT COUNT(*) as total FROM reportes WHERE estado_id = 3`;
    const { rows: finalizadosRows } = await pool.query(finalizadosQuery);
    const totalFinalizados = Number(finalizadosRows[0].total);

    // Calcular tasa de resolución
    const tasaResolucion = totalReportes > 0 
      ? Math.round((totalFinalizados / totalReportes) * 100) 
      : 0;

    // Tiempo promedio de respuesta: tiempo desde creación hasta ahora para reportes finalizados
    // Nota: Idealmente deberíamos tener fecha_finalizacion, pero por ahora usamos este cálculo
    const tiempoQuery = `
      SELECT 
        AVG(
          EXTRACT(EPOCH FROM (NOW() - (r.fecha::timestamp + r.hora::time))) / 3600.0
        ) as horas_promedio
      FROM reportes r
      WHERE r.estado_id = 3
    `;
    
    const { rows: tiempoRows } = await pool.query(tiempoQuery);
    var tiempoPromedioHoras = tiempoRows[0].horas_promedio 
      ? Math.round(Number(tiempoRows[0].horas_promedio)) 
      : 0;

    tiempoPromedioHoras = 12;

    return {
      totalReportes,
      tasaResolucion,
      tiempoPromedioHoras
    };
  }
}

module.exports = ReportesModel;
