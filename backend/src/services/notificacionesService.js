const pool = require("../config/db");
const { enviarSMS } = require("../services/twiloService");

async function notificarCambioEstado({ reporteId }) {
  try {
    const query = `
      SELECT 
        r.titulo,
        u.id AS usuario_id,
        u.nro_celular AS celular,
        e.estado,
        COALESCE(a.nombres || ' ' || a.apellido_paterno, 'No asignada') AS autoridad
      FROM reportes r
      JOIN usuarios u ON r.ciudadano_id = u.id
      JOIN estado_reporte e ON e.id = r.estado_id
      LEFT JOIN usuarios a ON a.id = r.autoridad_id
      WHERE r.id = $1
    `;


    const { rows } = await pool.query(query, [reporteId]);
    if (!rows.length) return;

    const { titulo, usuario_id, celular, estado, autoridad } = rows[0];

    const mensaje = `Sistema Testigo:
Su denuncia "${titulo}" cambió a estado: ${estado}.
Autoridad: ${autoridad}.`;

    if (!celular) {
      console.error(`❌ Usuario ${usuario_id} no tiene celular registrado`);
      return;
    }

    await enviarSMS({
      to: `+51${celular}`,
      message: mensaje
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
