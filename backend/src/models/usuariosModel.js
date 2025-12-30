// usuariosModel.js

const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios de la base de datos
const getUsuarios = async () => {
  const result = await pool.query('SELECT * FROM usuarios');
  return result.rows;
};

// Crear un nuevo usuario con contraseña cifrada
const crearUsuario = async (usuario) => {
  const { dni, nombres, apellido_paterno, apellido_materno, nro_celular, correo, contrasena, foto, rol } = usuario;

  const hashedPassword = await bcrypt.hash(contrasena, 10); // Cifrado de contraseña

  const query = `
    INSERT INTO usuarios (dni, nombres, apellido_paterno, apellido_materno, nro_celular, correo, contrasena, foto, rol)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id, dni, nombres, apellido_paterno, apellido_materno, nro_celular, correo, foto, rol
  `;

  const values = [dni, nombres, apellido_paterno, apellido_materno, nro_celular, correo, hashedPassword, foto, rol];
  const result = await pool.query(query, values);
  return result.rows[0]; // Devuelve el usuario creado
};

// Buscar un usuario por correo o DNI
const buscarUsuarioPorCorreoODni = async (correoODni) => {
  const query = `
    SELECT * FROM usuarios 
    WHERE correo = $1 OR dni = $1
  `;
  const result = await pool.query(query, [correoODni]);
  return result.rows[0]; // Devuelve solo un usuario
};

// Obtener usuario por id (campos públicos)
const getUsuarioPorId = async (id) => {
  const query = `
    SELECT id, dni, nombres, apellido_paterno, apellido_materno, nro_celular, correo, foto, rol
    FROM usuarios
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Actualizar usuario dinámicamente; si viene contrasena, la hashea
const actualizarUsuario = async ({ id, dni, correo, nro_celular, contrasena, foto, rol }) => {
  const campos = [];
  const valores = [];
  let idx = 1;

  if (dni !== undefined) { campos.push(`dni = $${idx++}`); valores.push(dni); }
  if (correo !== undefined) { campos.push(`correo = $${idx++}`); valores.push(correo); }
  if (nro_celular !== undefined) { campos.push(`nro_celular = $${idx++}`); valores.push(nro_celular); }
  if (foto !== undefined) { campos.push(`foto = $${idx++}`); valores.push(foto); }
  if (rol !== undefined) { campos.push(`rol = $${idx++}`); valores.push(rol); }

  if (contrasena) {
    const hashed = await bcrypt.hash(contrasena, 10);
    campos.push(`contrasena = $${idx++}`);
    valores.push(hashed);
  }

  if (campos.length === 0) {
    return getUsuarioPorId(id);
  }

  const query = `
    UPDATE usuarios
    SET ${campos.join(', ')}
    WHERE id = $${idx}
    RETURNING id, dni, nombres, apellido_paterno, apellido_materno, nro_celular, correo, foto, rol
  `;
  valores.push(id);

  const result = await pool.query(query, valores);
  return result.rows[0];
};

// Obtener instituciones (rol autoridad) con cantidad de reportes recibidos
const getInstitucionesConReportes = async () => {
  const query = `
    SELECT 
      u.id,
      u.nombres,
      u.correo,
      COALESCE(COUNT(r.id), 0) AS reportes_recibidos
    FROM usuarios u
    LEFT JOIN reportes r ON u.id = r.autoridad_id
    WHERE u.rol = 'autoridad'
    GROUP BY u.id
    ORDER BY u.id;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Eliminar usuario por ID
const eliminarUsuario = async (id) => {
  const query = `
    DELETE FROM usuarios
    WHERE id = $1
    RETURNING id
  `;
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
};



module.exports = {
  getUsuarios,
  crearUsuario,
  buscarUsuarioPorCorreoODni,
  getUsuarioPorId,
  actualizarUsuario,
  getInstitucionesConReportes,
  eliminarUsuario
};
