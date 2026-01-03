// reportesController.js
const cloudinary = require("cloudinary").v2;
const ReportesModel = require("../models/reportesModel");

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Crear reporte
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
      categoria_id,
      estado_id = 1,
    } = req.body;

    // Validaciones
    if (!titulo || !descripcion || !categoria_id || !latitud || !longitud) {
      return res.status(400).json({
        error: "Faltan campos obligatorios.",
        detalles: { titulo, descripcion, categoria_id, latitud, longitud },
      });
    }

    if (!usuario || !usuario.id) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    // Subir archivos a Cloudinary
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

          const tipoArchivo = resultado.resource_type === "video" ? "video" : "foto";

          evidenciasSubidas.push({
            url: resultado.secure_url,
            tipo: tipoArchivo,
            public_id: resultado.public_id,
          });

          console.log(`Archivo subido: ${resultado.secure_url} (${tipoArchivo})`);
        } catch (err) {
          console.error("Error subiendo archivo:", err.message);
        }
      }
    }

    // Crear reporte en la base de datos
    const idReporte = await ReportesModel.crearReporte({
      titulo,
      descripcion,
      latitud,
      longitud,
      direccion,
      distrito,
      estado_id,
      ciudadano_id: usuario.id,
      categoria_id
    });

    console.log(`Reporte creado con ID: ${idReporte}`);

    // Insertar evidencias si existen
    if (evidenciasSubidas.length > 0) {
      console.log(`Insertando ${evidenciasSubidas.length} evidencias...`);

      for (const evidencia of evidenciasSubidas) {
        await ReportesModel.insertarEvidencia(
          idReporte,
          evidencia.url,
          evidencia.tipo
        );
      }

      console.log(`${evidenciasSubidas.length} evidencias insertadas.`);
    }

    // Respuesta exitosa
    console.log("Reporte procesado completamente.");
    res.status(201).json({
      mensaje: "Reporte enviado correctamente.",
      reporte_id: idReporte,
      evidencias: evidenciasSubidas.length,
      datos: {
        titulo,
        categoria_id,
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

// Listar todos los reportes (público con paginación)
exports.listarReportes = async (req, res) => {
  try {
    const { pagina = 1, limite = 10 } = req.query;
    const offset = (pagina - 1) * limite;

    console.log(`Listando reportes - Página: ${pagina}, Límite: ${limite}`);

    const resultado = await ReportesModel.listarReportes(limite, offset);

    res.json({
      reportes: resultado.reportes,
      paginacion: {
        total: resultado.total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(resultado.total / limite),
      },
    });
  } catch (error) {
    console.error("Error al listar reportes:", error);
    res.status(500).json({
      error: "Error al obtener reportes",
      detalles: error.message,
    });
  }
};

// Obtener reportes del usuario autenticado
exports.obtenerReportesDelUsuario = async (req, res) => {
  try {
    const usuario = req.user;
    const { pagina = 1, limite = 10 } = req.query;
    const offset = (pagina - 1) * limite;

    if (!usuario || !usuario.id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    console.log(`Obteniendo reportes del usuario ID: ${usuario.id}`);

    const resultado = await ReportesModel.obtenerReportesPorUsuario(
      usuario.id,
      limite,
      offset
    );

    res.json({
      reportes: resultado.reportes,
      paginacion: {
        total: resultado.total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(resultado.total / limite),
      },
    });
  } catch (error) {
    console.error("Error al obtener reportes del usuario:", error);
    res.status(500).json({
      error: "Error al obtener reportes del usuario",
      detalles: error.message,
    });
  }
};

// Obtener detalle de un reporte específico
exports.obtenerReportePorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Obteniendo detalle del reporte ID: ${id}`);

    const reporte = await ReportesModel.obtenerReportePorId(id);

    if (!reporte) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    console.log(`Reporte encontrado con ${reporte.evidencias.length} evidencias`);
    res.json(reporte);
  } catch (error) {
    console.error("Error al obtener reporte:", error);
    res.status(500).json({
      error: "Error al obtener el reporte",
      detalles: error.message,
    });
  }
};

// Obtener los 5 reportes más recientes para el carrusel
exports.obtenerReportesRecientes = async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 5;
    console.log(`Obteniendo ${limite} reportes más recientes para carrusel`);

    const reportes = await ReportesModel.obtenerReportesRecientes(limite);

    res.json({
      ok: true,
      reportes: reportes
    });
  } catch (error) {
    console.error("Error al obtener reportes recientes:", error);
    res.status(500).json({
      error: "Error al obtener reportes recientes",
      detalles: error.message,
    });
  }
};

// Obtener estadísticas generales del sistema
exports.obtenerEstadisticasGenerales = async (req, res) => {
  try {
    console.log("Obteniendo estadísticas generales");

    const estadisticas = await ReportesModel.obtenerEstadisticasGenerales();

    res.json({
      ok: true,
      estadisticas: estadisticas
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      error: "Error al obtener estadísticas",
      detalles: error.message,
    });
  }
};

// Obtener estadísticas del ciudadano autenticado
exports.obtenerEstadisticasCiudadano = async (req, res) => {
  try {
    const usuario = req.user;
    
    if (!usuario || !usuario.id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    console.log(`Obteniendo estadísticas del ciudadano ID: ${usuario.id}`);

    const estadisticas = await ReportesModel.obtenerEstadisticasCiudadano(usuario.id);

    res.json({
      ok: true,
      estadisticas: estadisticas
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del ciudadano:", error);
    res.status(500).json({
      error: "Error al obtener estadísticas del ciudadano",
      detalles: error.message,
    });
  }
};

// Obtener resumen de reportes para autoridad
exports.obtenerResumenAutoridad = async (req, res) => {
  try {
    const usuario = req.user;
    
    if (!usuario || !usuario.id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (usuario.rol !== 'autoridad') {
      return res.status(403).json({ error: "Acceso denegado. Solo para autoridades" });
    }

    console.log(`Obteniendo resumen de reportes para autoridad ID: ${usuario.id}`);

    const resumen = await ReportesModel.obtenerResumenAutoridad(usuario.id);

    res.json({
      ok: true,
      resumen: resumen
    });
  } catch (error) {
    console.error("Error al obtener resumen de autoridad:", error);
    res.status(500).json({
      error: "Error al obtener resumen de reportes",
      detalles: error.message,
    });
  }
};

// Listar reportes asignados a autoridad con filtros
exports.listarReportesAutoridad = async (req, res) => {
  try {
    const usuario = req.user;
    
    if (!usuario || !usuario.id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (usuario.rol !== 'autoridad') {
      return res.status(403).json({ error: "Acceso denegado. Solo para autoridades" });
    }

    const { estado_id, busqueda, pagina = 1, limite = 50 } = req.query;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    console.log(`Listando reportes para autoridad ID: ${usuario.id}`, { estado_id, busqueda });

    const resultado = await ReportesModel.listarReportesAutoridad(usuario.id, {
      estado_id: estado_id ? parseInt(estado_id) : null,
      busqueda: busqueda || null,
      limite: parseInt(limite),
      offset
    });

    res.json({
      ok: true,
      reportes: resultado.reportes,
      paginacion: {
        total: resultado.total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(resultado.total / parseInt(limite))
      }
    });
  } catch (error) {
    console.error("Error al listar reportes de autoridad:", error);
    res.status(500).json({
      error: "Error al obtener reportes",
      detalles: error.message,
    });
  }
};

// Actualizar reporte
exports.actualizarReporte = async (req, res) => {
  const { id } = req.params;
  const { asignadoA, nuevoEstado, comentario } = req.body;

  try {
    // Validamos que el estado sea un número válido
    const estado_id = parseInt(nuevoEstado);
    
    if (isNaN(estado_id)) {
      return res.status(400).json({ ok: false, mensaje: "Estado no válido" });
    }

    const reporteActualizado = await ReportesModel.actualizarReporte(id, {
      autoridad_id: asignadoA || null, // Permitir que sea nulo
      estado_id: estado_id,
      comentario: comentario || ""
    });

    res.json({
      ok: true,
      mensaje: 'Reporte actualizado correctamente',
      reporte: reporteActualizado
    });

  } catch (error) {
    console.error('Error en actualizarReporte:', error);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};