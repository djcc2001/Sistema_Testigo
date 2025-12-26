// app.js

// Cargar dotenv (safe en producción - no hace nada si no existe .env)
require('dotenv').config();

// Verificar que JWT_SECRET esté definido
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no definido');
}

const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // Inicializa conexión con la base de datos

const app = express();

// Middlewares
app.use(cors());           // Permite solicitudes desde otros dominios
app.use(express.json());   // Parseo de JSON en el body de las solicitudes

// Rutas
const usuariosRoutes = require('./routes/usuariosRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const reniecRoutes = require('./routes/reniecRoutes');
app.use('/usuarios', usuariosRoutes);
app.use('/reportes', reportesRoutes);
app.use('/reniec', reniecRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando');
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error(err); // Logging interno

  res.status(err.status || 500).json({
    ok: false,
    mensaje: err.message || 'Ocurrió un error interno en el servidor'
  });
});


// Puerto desde .env o 4000 por defecto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


