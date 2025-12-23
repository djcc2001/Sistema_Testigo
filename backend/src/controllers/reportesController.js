const cloudinary = require("cloudinary").v2;
const db = require("../config/db");

// === CONFIGURAR CLOUDINARY ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === CREAR REPORTE ===
exports.crearReporte = async (req, res) => {
  try {
    console.log("=== INICIANDO CREACIÓN DE REPORTE ===");
    console.log("Body recibido:", req.body);
    console.log("Archivos recibidos:", req.files ? req.files.length : 0);
    console.log("Usuario del token:", req.user);

    const usuario = req.user;
    const {
      titulo,
      descripcion,
      latitud,
      longitud,
      direccion,
      distrito,
      categoria, // nombre recibido desde el frontend
      estado_id = 1, // por defecto "Nuevo"
    } = req.body;

    // === VALIDACIONES ===
    if (!titulo || !descripcion || !categoria || !latitud || !longitud) {
      return res.status(400).json({
        error: "Faltan campos obligatorios.",
        detalles: { titulo, descripcion, categoria, latitud, longitud },
      });
    }

    if (!usuario || !usuario.id) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    // === SUBIR ARCHIVOS A CLOUDINARY ===
    let evidenciasSubidas = [];
    if (req.files && req.files.length > 0) {
      console.log(`Subiendo ${req.files.length} archivos a Cloudinary...`);

      for (const file of req.files) {
        try {
          const resultado = await cloudinary.uploader.upload(file.path, {
            resource_type: "auto",
            folder: "reportes_transito",
            quality: "auto",
            fetch_format: "auto",
          });

          const tipoArchivo =
            resultado.resource_type === "video" ? "video" : "foto";

          evidenciasSubidas.push({
            url: resultado.secure_url,
            tipo: tipoArchivo,
            public_id: resultado.public_id,
          });

          console.log(
            `Archivo subido correctamente: ${resultado.secure_url} (${tipoArchivo})`
          );
        } catch (err) {
          console.error("Error subiendo archivo a Cloudinary:", err.message);
        }
      }
    }

    // === INSERTAR REPORTE EN BD ===
    console.log("Insertando reporte en la base de datos...");

    const insertReporteQuery = `
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

    const insertValues = [
      titulo,
      descripcion,
      latitud,
      longitud,
      direccion,
      distrito,
      estado_id,
      usuario.id,
      categoria,
    ];

    const { rows } = await db.query(insertReporteQuery, insertValues);
    const idReporte = rows[0].id;
    console.log(`Reporte creado con ID: ${idReporte}`);

    // === INSERTAR EVIDENCIAS (si existen) ===
    if (evidenciasSubidas.length > 0) {
      console.log(`Insertando ${evidenciasSubidas.length} evidencias...`);
      const insertEvidenciaQuery = `
        INSERT INTO evidencias (reporte_id, url_archivo, tipo)
        VALUES ($1, $2, $3)
      `;

      for (const evidencia of evidenciasSubidas) {
        await db.query(insertEvidenciaQuery, [
          idReporte,
          evidencia.url,
          evidencia.tipo,
        ]);
      }

      console.log(`${evidenciasSubidas.length} evidencias insertadas.`);
    }

    // === RESPUESTA EXITOSA ===
    console.log("Reporte procesado completamente.");
    res.status(201).json({
      mensaje: "Reporte enviado correctamente.",
      reporte_id: idReporte,
      evidencias: evidenciasSubidas.length,
      datos: {
        titulo,
        categoria,
        ubicacion: { latitud, longitud },
        archivos_subidos: evidenciasSubidas.length,
      },
    });
  } catch (error) {
    console.error("Error al enviar reporte:", error);
    res.status(500).json({
      error: "Error interno del servidor.",
      detalles: error.message,
    });
  }
};

// === LISTAR TODOS LOS REPORTES (PÚBLICO CON PAGINACIÓN) ===
exports.listarReportes = async (req, res) => {
  try {
    const { pagina = 1, limite = 10 } = req.query;
    const offset = (pagina - 1) * limite;

    console.log(`Listando reportes - Página: ${pagina}, Límite: ${limite}`);

    // Contar total de reportes
    const countQuery = 'SELECT COUNT(*) FROM reportes';
    const { rows: countRows } = await db.query(countQuery);
    const total = parseInt(countRows[0].count);

    // Obtener reportes con JOIN
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

    const { rows } = await db.query(query, [limite, offset]);

    console.log(`Se encontraron ${rows.length} reportes de un total de ${total}`);

    res.json({
      reportes: rows,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    console.error('Error al listar reportes:', error);
    res.status(500).json({ 
      error: 'Error al obtener reportes',
      detalles: error.message 
    });
  }
};

// === OBTENER REPORTES DEL USUARIO AUTENTICADO ===
exports.obtenerReportesDelUsuario = async (req, res) => {
  try {
    const usuario = req.user;
    const { pagina = 1, limite = 10 } = req.query;
    const offset = (pagina - 1) * limite;

    if (!usuario || !usuario.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log(`Obteniendo reportes del usuario ID: ${usuario.id}`);

    // Contar total de reportes del usuario
    const countQuery = 'SELECT COUNT(*) FROM reportes WHERE ciudadano_id = $1';
    const { rows: countRows } = await db.query(countQuery, [usuario.id]);
    const total = parseInt(countRows[0].count);

    // Obtener reportes del usuario con JOIN
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

    const { rows } = await db.query(query, [usuario.id, limite, offset]);

    console.log(`Se encontraron ${rows.length} reportes del usuario de un total de ${total}`);

    res.json({
      reportes: rows,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / limite)
      }
    });
  } catch (error) {
    console.error('Error al obtener reportes del usuario:', error);
    res.status(500).json({ 
      error: 'Error al obtener reportes del usuario',
      detalles: error.message 
    });
  }
};

// === OBTENER DETALLE DE UN REPORTE ESPECÍFICO ===
exports.obtenerReportePorId = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Obteniendo detalle del reporte ID: ${id}`);

    // Consulta principal del reporte
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

    const { rows } = await db.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    // Obtener evidencias del reporte
    const evidenciasQuery = 'SELECT * FROM evidencias WHERE reporte_id = $1 ORDER BY id';
    const { rows: evidencias } = await db.query(evidenciasQuery, [id]);

    console.log(`Reporte encontrado con ${evidencias.length} evidencias`);

    res.json({
      ...rows[0],
      evidencias
    });
  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({ 
      error: 'Error al obtener el reporte',
      detalles: error.message 
    });
  }
};
