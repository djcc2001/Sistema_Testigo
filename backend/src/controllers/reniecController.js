/* reniecController.js */
const axios = require('axios');

// Consultar DNI en la API de Decolecta
const consultarDNI = async (req, res, next) => {
  try {
    const { dni } = req.params;

    // Validación básica del DNI
    if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
      return res.status(400).json({
        ok: false,
        error: 'DNI debe tener 8 dígitos numéricos'
      });
    }

    // Verificar que el token esté configurado
    const token = process.env.DECOLECTA_TOKEN || process.env.REACT_APP_DECOLECTA_TOKEN;
    if (!token) {
      return res.status(503).json({
        ok: false,
        error: 'Servicio de validación RENIEC no configurado. Defina DECOLECTA_TOKEN en .env'
      });
    }

    // Consultar API de Decolecta
    const response = await axios.get(
      `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data;

    // Validar si se encontró el DNI
    if (result.message === "not found" || result.error) {
      return res.status(404).json({
        ok: false,
        error: 'DNI no encontrado en RENIEC'
      });
    }

    // Procesar respuesta exitosa
    if (result.first_name) {
      return res.json({
        ok: true,
        nombres: result.first_name,
        apellidos: `${result.first_last_name} ${result.second_last_name}`.trim(),
        documentNumber: result.document_number,
        fullName: result.full_name
      });
    }

    return res.status(500).json({
      ok: false,
      error: 'Formato de respuesta no reconocido'
    });

  } catch (error) {
    console.error('Error consultando RENIEC:', error.message);

    if (error.response) {
      // Error de la API de Decolecta
      if (error.response.status === 404) {
        return res.status(404).json({
          ok: false,
          error: 'DNI no encontrado en RENIEC'
        });
      }
      if (error.response.status === 401) {
        return res.status(500).json({
          ok: false,
          error: 'Token de API inválido'
        });
      }
    }

    next(error);
  }
};

module.exports = {
  consultarDNI
};
