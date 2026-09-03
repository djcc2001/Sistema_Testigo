// usuariosRoutes.js

const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verificarToken, permitirRol } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Listar usuarios (solo admin)
router.get('/', verificarToken, permitirRol(['admin']), usuariosController.listarUsuarios);

// Listar instituciones (solo admin)
router.get('/instituciones', verificarToken, permitirRol(['admin']), usuariosController.listarInstituciones);

// Crear usuario por administrador (con foto opcional)
router.post('/admin', verificarToken, permitirRol(['admin']), upload.single("foto"), usuariosController.crearUsuarioAdm);

// Registro público de usuario
router.post('/register', usuariosController.crearUsuario);

// Login de usuario (abierto)
router.post('/login', usuariosController.loginUsuario);

// Obtener perfil del usuario autenticado
router.get('/perfil', verificarToken, usuariosController.obtenerPerfil);

// Actualizar perfil del usuario autenticado (foto opcional)
router.put('/perfil', verificarToken, upload.single('foto'), usuariosController.actualizarPerfil);

// Obtener autoridades
router.get(
  '/autoridades',
  verificarToken,
  permitirRol(['admin', 'autoridad']), 
  usuariosController.obtenerAutoridades
);

// Obtener usuario por ID (solo admin)
router.get('/:id', verificarToken, permitirRol(['admin']), async (req, res, next) => {
  try {
    const usuario = await usuariosController.obtenerUsuarioPorId(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    next(error);
  }
});

// Actualizar usuario por ID (solo admin)
router.put('/:id', verificarToken, permitirRol(['admin']), upload.single('foto'), async (req, res, next) => {
  try {
    const usuarioActualizado = await usuariosController.actualizarUsuarioPorId(req.params.id, req.body, req.file);
    res.json({ ok: true, usuario: usuarioActualizado });
  } catch (error) {
    next(error);
  }
});

// Eliminar usuario por ID (solo admin)
router.delete(
  '/:id',
  verificarToken,
  permitirRol(['admin']),
  async (req, res, next) => {
    try {
      await usuariosController.eliminarUsuarioPorId(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);


module.exports = router;

