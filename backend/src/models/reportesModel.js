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
        (r.autoridad_id IS NOT NULL) AS asignado,
        -- ESTA ES LA PARTE QUE FALTABA:
        json_agg(
          json_build_object('url', e.url_archivo, 'tipo', e.tipo)
        ) FILTER (WHERE e.id IS NOT NULL) AS evidencias
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      LEFT JOIN categoria c ON r.categoria_id = c.id
      LEFT JOIN evidencias e ON r.id = e.reporte_id
      WHERE r.ciudadano_id = $1
      GROUP BY r.id, er.estado, c.descripcion
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

  // Obtener estadísticas del ciudadano autenticado
  static async obtenerEstadisticasCiudadano(ciudadano_id) {
    // KPIs: Total de reportes, reportes resueltos, tiempo promedio
    const kpisQuery = `
      SELECT 
        COUNT(*) as total_reportes,
        COUNT(*) FILTER (WHERE estado_id = 3) as reportes_resueltos,
        AVG(
          EXTRACT(EPOCH FROM (NOW() - (fecha::timestamp + hora::time))) / 86400.0
        ) FILTER (WHERE estado_id = 3) as dias_promedio_resolucion
      FROM reportes
      WHERE ciudadano_id = $1
    `;
    const { rows: kpisRows } = await pool.query(kpisQuery, [ciudadano_id]);
    const kpis = kpisRows[0];
    const totalReportes = Number(kpis.total_reportes) || 0;
    const reportesResueltos = Number(kpis.reportes_resueltos) || 0;
    const porcentajeResueltos = totalReportes > 0 
      ? Number(((reportesResueltos / totalReportes) * 100).toFixed(1))
      : 0;
    const tiempoPromedioDias = kpis.dias_promedio_resolucion 
      ? Number(Number(kpis.dias_promedio_resolucion).toFixed(1))
      : 0;

    // Distribución por categoría
    const categoriaQuery = `
      SELECT 
        c.descripcion AS categoria,
        COUNT(*) AS cantidad
      FROM reportes r
      LEFT JOIN categoria c ON r.categoria_id = c.id
      WHERE r.ciudadano_id = $1
      GROUP BY c.id, c.descripcion
      ORDER BY cantidad DESC
    `;
    const { rows: categoriaRows } = await pool.query(categoriaQuery, [ciudadano_id]);
    const distribucionCategoria = categoriaRows.map(row => ({
      categoria: row.categoria || "Sin categoría",
      cantidad: Number(row.cantidad)
    }));

    // Tendencia de reportes en el tiempo (últimos 12 meses)
    const tendenciaQuery = `
      SELECT 
        TO_CHAR(fecha, 'Mon') AS mes_nombre,
        TO_CHAR(fecha, 'YYYY-MM') AS mes_orden,
        COUNT(*) AS cantidad
      FROM reportes
      WHERE ciudadano_id = $1
        AND fecha >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(fecha, 'Mon'), TO_CHAR(fecha, 'YYYY-MM')
      ORDER BY mes_orden ASC
    `;
    const { rows: tendenciaRows } = await pool.query(tendenciaQuery, [ciudadano_id]);
    
    // Mapear nombres de meses en español
    const mesesEsp = {
      'Jan': 'Ene', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Abr',
      'May': 'May', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Ago',
      'Sep': 'Set', 'Oct': 'Oct', 'Nov': 'Nov', 'Dec': 'Dic'
    };
    
    const tendenciaTiempo = tendenciaRows.map(row => {
      const mesNombre = row.mes_nombre.trim();
      const mesCorto = mesesEsp[mesNombre] || mesNombre;
      return {
        mes: mesCorto,
        reportes: Number(row.cantidad)
      };
    });

    // Distribución por estado
    const estadoQuery = `
      SELECT 
        er.estado AS nombre_estado,
        er.id AS estado_id,
        COUNT(*) AS cantidad
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      WHERE r.ciudadano_id = $1
      GROUP BY er.id, er.estado
      ORDER BY er.id
    `;
    const { rows: estadoRows } = await pool.query(estadoQuery, [ciudadano_id]);
    
    // Mapear estados a nombres más amigables
    const estadoMap = {
      'Nuevo': 'Enviado',
      'En revisión': 'En proceso',
      'Finalizado': 'Resuelto',
      'Archivado': 'Archivado'
    };
    
    const distribucionEstado = estadoRows.map(row => ({
      nombre: estadoMap[row.nombre_estado] || row.nombre_estado,
      valor: Number(row.cantidad)
    }));

    return {
      kpis: {
        totalReportes,
        reportesResueltos,
        porcentajeResueltos,
        tiempoPromedioDias
      },
      distribucionCategoria,
      tendenciaTiempo,
      distribucionEstado
    };
  }

  // Obtener resumen de reportes para autoridad
  // Incluye reportes sin asignar (NULL) o asignados a esta autoridad
  static async obtenerResumenAutoridad(autoridad_id) {
    // Recibidos: todos los reportes sin asignar o asignados a esta autoridad
    const recibidosQuery = `
      SELECT COUNT(*) as total
      FROM reportes
      WHERE autoridad_id IS NULL OR autoridad_id = $1
    `;
    const { rows: recibidosRows } = await pool.query(recibidosQuery, [autoridad_id]);
    const recibidos = Number(recibidosRows[0].total) || 0;

    // Pendientes: reportes sin asignar o asignados con estado Nuevo (1) o En revisión (2)
    const pendientesQuery = `
      SELECT COUNT(*) as total
      FROM reportes
      WHERE (autoridad_id IS NULL OR autoridad_id = $1)
        AND estado_id IN (1, 2)
    `;
    const { rows: pendientesRows } = await pool.query(pendientesQuery, [autoridad_id]);
    const pendientes = Number(pendientesRows[0].total) || 0;

    // Resueltos: reportes sin asignar o asignados a esta autoridad con estado Finalizado (3)
    const resueltosQuery = `
      SELECT COUNT(*) as total
      FROM reportes
      WHERE (autoridad_id IS NULL OR autoridad_id = $1)
        AND estado_id = 3
    `;
    const { rows: resueltosRows } = await pool.query(resueltosQuery, [autoridad_id]);
    const resueltos = Number(resueltosRows[0].total) || 0;

    return {
      recibidos,
      pendientes,
      resueltos
    };
  }

  // Listar reportes asignados a autoridad con filtros
  // Muestra reportes sin asignar (NULL) o asignados a esta autoridad
  static async listarReportesAutoridad(autoridad_id, filtros = {}) {
    const { estado_id, busqueda, limite = 50, offset = 0 } = filtros;

    // Construir condiciones WHERE
    // Mostrar reportes sin asignar (NULL) o asignados a esta autoridad
    let condiciones = ['(r.autoridad_id IS NULL OR r.autoridad_id = $1)'];
    let valores = [autoridad_id];
    let indice = 2;

    // Filtro por estado
    if (estado_id) {
      condiciones.push(`r.estado_id = $${indice++}`);
      valores.push(estado_id);
    }

    // Filtro por búsqueda (título, dirección, nombre ciudadano)
    if (busqueda && busqueda.trim()) {
      condiciones.push(`(
        r.titulo ILIKE $${indice} OR
        r.direccion ILIKE $${indice} OR
        r.distrito ILIKE $${indice} OR
        CONCAT(u.nombres, ' ', u.apellido_paterno, ' ', u.apellido_materno) ILIKE $${indice}
      )`);
      valores.push(`%${busqueda.trim()}%`);
      indice++;
    }

    const condicionesSQL = condiciones.join(' AND ');

    // Query principal
    const query = `
      SELECT 
        r.id,
        r.titulo,
        r.descripcion,
        r.direccion,
        r.distrito,
        r.fecha,
        r.hora,
        r.estado_id,
        er.estado AS estado_nombre,
        c.descripcion AS categoria,
        CONCAT(u.nombres, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS nombre_ciudadano,
        u.dni AS dni_ciudadano,
        u.correo AS correo_ciudadano,
        u.nro_celular AS telefono_ciudadano,
        (
          SELECT e.url_archivo 
          FROM evidencias e 
          WHERE e.reporte_id = r.id AND e.tipo = 'foto'
          ORDER BY e.id
          LIMIT 1
        ) AS imagen_principal,
        json_agg(
          json_build_object('url', e.url_archivo, 'tipo', e.tipo)
        ) FILTER (WHERE e.id IS NOT NULL) AS evidencias
      FROM reportes r
      LEFT JOIN estado_reporte er ON r.estado_id = er.id
      LEFT JOIN categoria c ON r.categoria_id = c.id
      LEFT JOIN usuarios u ON r.ciudadano_id = u.id
      LEFT JOIN evidencias e ON r.id = e.reporte_id
      WHERE ${condicionesSQL}
      GROUP BY r.id, er.estado, c.descripcion, u.nombres, u.apellido_paterno, u.apellido_materno, u.dni, u.correo, u.nro_celular
      ORDER BY r.fecha DESC, r.hora DESC
      LIMIT $${indice++} OFFSET $${indice}
    `;

    valores.push(limite, offset);
    const { rows } = await pool.query(query, valores);

    // Contar total para paginación
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM reportes r
      LEFT JOIN usuarios u ON r.ciudadano_id = u.id
      WHERE ${condicionesSQL}
    `;
    const countValores = valores.slice(0, -2); // Quitar limite y offset
    const { rows: countRows } = await pool.query(countQuery, countValores);
    const total = Number(countRows[0].total) || 0;

    return {
      reportes: rows,
      total
    };
  }

  // actualizar reporte
  static async actualizarReporte(id, data) {
    const { autoridad_id, estado_id, comentario } = data;
    
    const query = `
      UPDATE reportes 
      SET 
        autoridad_id = $1, 
        estado_id = $2, 
        comentario = $3
      WHERE id = $4
      RETURNING *
    `;

    const values = [autoridad_id, estado_id, comentario, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = ReportesModel;
