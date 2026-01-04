const pool = require("../config/db");
const { enviarCorreo } = require("../config/mailer");

async function notificarCambioEstado({ reporteId }) {
  try {
    const query = `
      SELECT 
        r.titulo,
        u.id AS usuario_id,
        u.correo,
        e.estado,
        COALESCE(a.nombres || ' ' || a.apellido_paterno, 'No asignada') AS autoridad
      FROM reportes r
      JOIN usuarios u ON r.ciudadano_id = u.id
      JOIN estado_reporte e ON e.id = r.estado_id
      LEFT JOIN usuarios a ON a.id = r.autoridad_id
      WHERE r.id = $1
    `;

    const { rows } = await pool.query(query, [reporteId]);
    if (rows.length === 0) return;

    const { titulo, usuario_id, correo, estado, autoridad } = rows[0];

    const mensaje = `
Cambio de estado de su reporte

Título: ${titulo}
Nuevo estado: ${estado}
Autoridad asignada: ${autoridad}
Fecha: ${new Date().toLocaleString("es-PE")}
    `;

    await enviarCorreo({
      to: correo,
      subject: "Actualización de su reporte",
      text: mensaje
    });

    await pool.query(
      `INSERT INTO notificaciones (reporte_id, usuario_id, tipo)
       VALUES ($1, $2, 'cambio_estado')`,
      [reporteId, usuario_id]
    );

  } catch (error) {
    console.error("Error notificando cambio de estado:", error);
  }
}

module.exports = { notificarCambioEstado };
