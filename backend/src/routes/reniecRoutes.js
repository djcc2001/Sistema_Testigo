/* reniecRoutes.js */
const express = require('express');
const router = express.Router();
const reniecController = require('../controllers/reniecController');

// Ruta para consultar DNI en RENIEC
router.get('/dni/:dni', reniecController.consultarDNI);

module.exports = router;
