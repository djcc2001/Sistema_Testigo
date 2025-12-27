// reportesModel.js
const pool = require('../config/db');

class ReportesModel {
  // Crear un nuevo reporte
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
      categoria_descripcion,
    } = reporteData;

    const query = `
      INSERT INTO reportes (
        titulo, descripcion, latitud, longitud, direccion, distrito,
        estado_id, ciudadano_id, categoria_id, fecha, hora
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 
        (SELECT id FROM categoria WHERE descripcion = $9 LIMIT 1),
        CURRENT_DATE, CURRENT_TIME
      )
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
      categoria_descripcion,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0].id;
  }

  // Insertar evidencias (fotos/videos)
  static async insertarEvidencia(reporte_id, url_archivo, tipo) {
    const query = `
      INSERT INTO evidencias (reporte_id, url_archivo, tipo)
      VALUES ($1, $2, $3)
    `;
    await pool.query(query, [reporte_id, url_archivo, tipo]);
  }

  // Obtener reportes con paginación (público)
  static async listarReportes(limite, offset) {
    // Contar total
    const countQuery = 'SELECT COUNT(*) FROM reportes';
    const { rows: countRows } = await pool.query(countQuery);
    const total = parseInt(countRows[0].count);

    // Obtener reportes
    const query = `
      SELECT 
        r.id,
        r.titulo,
        r.fecha,
        r.hora,
        er.estado as estado_nombre,
        c.descripcion as categoria,
        CASE 
          WHEN r.autoridad_id IS NOT NULL THEN true
          ELSE false
        END as asignado,
        CASE 
          WHEN r.autoridad_id IS NOT NULL 
          THEN u.nombres || ' ' || u.apellido_paterno
          ELSE NULL
        END as autoridad_nombre
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      LEFT JOIN categoria c ON r.categoria_id = c.id
      LEFT JOIN usuarios u ON r.autoridad_id = u.id
      ORDER BY r.fecha DESC, r.hora DESC
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await pool.query(query, [limite, offset]);
    return { reportes: rows, total };
  }

  // Obtener reportes de un usuario específico
  static async obtenerReportesPorUsuario(usuario_id, limite, offset) {
    // Contar total
    const countQuery = 'SELECT COUNT(*) FROM reportes WHERE ciudadano_id = $1';
    const { rows: countRows } = await pool.query(countQuery, [usuario_id]);
    const total = parseInt(countRows[0].count);

    // Obtener reportes
    const query = `
      SELECT 
        r.id,
        r.titulo,
        r.direccion,
        r.distrito,
        r.fecha,
        r.hora,
        er.estado as estado_nombre,
        c.descripcion as categoria,
        CASE 
          WHEN r.autoridad_id IS NOT NULL THEN true
          ELSE false
        END as asignado,
        CASE 
          WHEN r.autoridad_id IS NOT NULL 
          THEN u.nombres || ' ' || u.apellido_paterno
          ELSE 'Sin Asignar'
        END as entidad,
        (
          SELECT url_archivo 
          FROM evidencias 
          WHERE reporte_id = r.id 
          ORDER BY id 
          LIMIT 1
        ) as imagen
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      LEFT JOIN categoria c ON r.categoria_id = c.id
      LEFT JOIN usuarios u ON r.autoridad_id = u.id
      WHERE r.ciudadano_id = $1
      ORDER BY r.fecha DESC, r.hora DESC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pool.query(query, [usuario_id, limite, offset]);
    return { reportes: rows, total };
  }

  // Obtener un reporte por ID con detalles completos
  static async obtenerReportePorId(id) {
    // Obtener reporte principal
    const query = `
      SELECT 
        r.*,
        er.estado as estado_nombre,
        c.descripcion as categoria,
        uc.nombres || ' ' || uc.apellido_paterno as ciudadano_nombre,
        uc.correo as ciudadano_correo,
        aut.nombres || ' ' || aut.apellido_paterno as autoridad_nombre,
        aut.correo as autoridad_contacto,
        aut.nro_celular as autoridad_telefono
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      LEFT JOIN categoria c ON r.categoria_id = c.id
      LEFT JOIN usuarios uc ON r.ciudadano_id = uc.id
      LEFT JOIN usuarios aut ON r.autoridad_id = aut.id
      WHERE r.id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    // Obtener evidencias
    const evidenciasQuery = 'SELECT * FROM evidencias WHERE reporte_id = $1 ORDER BY id';
    const { rows: evidencias } = await pool.query(evidenciasQuery, [id]);

    return {
      ...rows[0],
      evidencias
    };
  }
}

module.exports = ReportesModel;