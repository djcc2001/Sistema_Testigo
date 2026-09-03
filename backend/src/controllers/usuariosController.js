/* usuariosController.js */
const usuariosModel = require('../models/usuariosModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Listar todos los usuarios
const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await usuariosModel.getUsuarios();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo usuario
const crearUsuario = async (req, res, next) => {
  try {
    const usuario = await usuariosModel.crearUsuario(req.body);
    res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado correctamente",
      usuario
    }); 
  } catch (error) {
    if (error.code === '23505') {
      if (error.detail.includes('(correo)')) {
        return res.status(400).json({ ok: false, error: "El correo ya está registrado" });
      }
      if (error.detail.includes('(dni)')) {
        return res.status(400).json({ ok: false, error: "El DNI ya está registrado" });
      }
      return res.status(400).json({ ok: false, error: "Ya existe un registro con esos datos" });
    }
    next(error);
  }
};

// Crear un nuevo usuario para administrador
const crearUsuarioAdm = async (req, res, next) => {
  try {
    const { dni, nombres, apellido_paterno, apellido_materno, correo, nro_celular, contrasena, rol } = req.body;

    // Guardar URL de Cloudinary si se subió foto
    const fotoUrl = req.file ? req.file.path : null;

    const usuario = await usuariosModel.crearUsuario({
      dni,
      nombres,
      apellido_paterno,
      apellido_materno,
      correo,
      nro_celular,
      contrasena: contrasena,
      rol,
      foto: fotoUrl
    });

    res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado correctamente",
      usuario
    }); 
  } catch (error) {
    if (error.code === '23505') {
      if (error.detail.includes('(correo)')) {
        return res.status(400).json({ ok: false, error: "El correo ya está registrado" });
      }
      if (error.detail.includes('(dni)')) {
        return res.status(400).json({ ok: false, error: "El DNI ya está registrado" });
      }
      return res.status(400).json({ ok: false, error: "Ya existe un registro con esos datos" });
    }
    next(error);
  }
};


// Login de usuario
const loginUsuario = async (req, res, next) => {
  const { correoODni, contrasena } = req.body;

  try {
    const usuario = await usuariosModel.buscarUsuarioPorCorreoODni(correoODni);

    if (!usuario) {
      return res.status(404).json({
        ok: false,
        error: "Usuario no encontrado"
      });
    }

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValida) {
      return res.status(401).json({
        ok: false,
        error: "Contraseña incorrecta"
      });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      ok: true,
      mensaje: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.id,
        dni: usuario.dni,
        nombres: usuario.nombres,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        nro_celular: usuario.nro_celular,
        correo: usuario.correo,
        foto: usuario.foto || null,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error("Error en loginUsuario:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor al iniciar sesión"
    });
  }
};

// Obtener perfil del usuario autenticado
const obtenerPerfil = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const usuario = await usuariosModel.getUsuarioPorId(userId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario });
  } catch (error) {
    next(error);
  }
};

// Actualizar perfil del usuario autenticado
const actualizarPerfil = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const fotoUrl = req.file ? req.file.path : undefined;

    const { dni, correo, nro_celular, contrasena } = req.body;

    const usuarioActualizado = await usuariosModel.actualizarUsuario({
      id: userId,
      dni,
      correo,
      nro_celular,
      contrasena,
      foto: fotoUrl
    });

    res.json({ usuario: usuarioActualizado });
  } catch (error) {
    next(error);
  }
};

// Obtener usuario por ID (modo admin)
const obtenerUsuarioPorId = async (id) => {
  return await usuariosModel.getUsuarioPorId(id);
};

// Actualizar usuario por ID (modo admin)
const actualizarUsuarioPorId = async (id, data, file) => {
  const fotoUrl = file ? file.path : undefined;
  const { dni, correo, nro_celular, contrasena, rol } = data;

  return await usuariosModel.actualizarUsuario({
    id,
    dni,
    correo,
    nro_celular,
    contrasena,
    rol,
    foto: fotoUrl
  });
};

const listarInstituciones = async (req, res) => {
  try {
    const instituciones = await usuariosModel.getInstitucionesConReportes();
    res.json(instituciones);
  } catch (error) {
    console.error("Error al obtener instituciones:", error);
    res.status(500).json({ message: "Error al obtener instituciones" });
  }
};

// Eliminar usuario por ID (modo admin)
const eliminarUsuarioPorId = async (req, res, next) => {
  try {
    // Validación: impedir que el usuario se elimine a sí mismo
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(403).json({ ok: false, mensaje: 'No se puede eliminar su propia cuenta' });
    }

    const usuario = await usuariosModel.eliminarUsuario(req.params.id);

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    return res.json({ ok: true, mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// Obtener autoridades activas (para el modal)
const obtenerAutoridades = async (req, res) => {
  try {
    const autoridades = await usuariosModel.getAutoridades();
    res.json({ ok: true, autoridades });
  } catch (error) {
    console.error("Error al obtener autoridades:", error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener autoridades" });
  }
};


module.exports = {
  listarUsuarios,
  crearUsuario,
  crearUsuarioAdm,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  obtenerUsuarioPorId,
  actualizarUsuarioPorId,
  listarInstituciones,
  eliminarUsuarioPorId,
  obtenerAutoridades
};
