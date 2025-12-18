const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verificarToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload'); // usa tu CloudinaryStorage
const multer = require('multer');

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Límite: 20MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Demasiados archivos. Límite: 5 archivos' });
    }
  }
  next(error);
};

// RUTA: Listar todos los reportes (público, con paginación)
router.get('/', reportesController.listarReportes);

// RUTA: Obtener detalle de un reporte específico
router.get('/:id', reportesController.obtenerReportePorId);

// RUTA: Crear reporte
router.post(
  '/',
  upload.array('archivos', 5), // primero multer para procesar archivos y campos
  verificarToken,               // luego el token (ya sin interferir con form-data)
  handleMulterError,
  reportesController.crearReporte
);

router.get('/test', verificarToken, (req, res) => {
  res.json({ mensaje: 'Ruta de reportes funcionando correctamente', usuario: req.user });
});

module.exports = router;
