# Sistema Testigo - Backend

API REST para la plataforma de reportes ciudadanos de tráfico e infraestructura. Construida con Node.js, Express y PostgreSQL.

## Endpoints Principales

### Usuarios

- `GET /usuarios` - Listar todos los usuarios (admin)
- `POST /usuarios/admin` - Crear usuario por administrador
- `GET /usuarios/perfil` - Perfil del usuario autenticado
- `PUT /usuarios/perfil` - Actualizar perfil del usuario autenticado
- `DELETE /usuarios/:id` - Eliminar usuario (admin) - **validación: no se puede autoeliminarse**
- `GET /autoridades` - Listar autoridades activas

### Reportes

- `GET /reportes` - Listar todos los reportes (público)
- `GET /reportes/recientes` - Reportes recientes para carrusel (público)
- `GET /reportes/estadisticas/generales` - Estadísticas generales del sistema (público)
- `GET /reportes/estadisticas/admin` - Estadísticas administrativas (requiere autenticación)
- `GET /reportes/estadisticas/ciudadano` - Estadísticas del ciudadano autenticado
- `GET /reportes/estadisticas/autoridad` - Estadísticas de la autoridad autenticada
- `GET /reportes/autoridad/resumen` - Resumen de reportes por autoridad (requiere autenticación)
- `GET /reportes/autoridad/reportes` - Listar reportes por autoridad (requiere autenticación)
- `POST /reportes` - Crear nuevo reporte (requiere autenticación + Cloudinary)
- `GET /reportes/:id` - Obtener detalle de un reporte específico
- `PUT /reportes/:id` - Actualizar reporte (requiere autenticación)

### RENIEC

- Rutas bajo `/reniec` para consulta de datos de DNI

## Configuración de Variables de Entorno

Copia `backend/.env.example` a `backend/.env` y completa con los valores reales:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 4000) |
| `FRONTEND_URL` | URL del frontend para CORS (default: http://localhost:3000) |
| `DB_USER` | Usuario de PostgreSQL |
| `DB_HOST` | Host de la base de datos |
| `DB_NAME` | Nombre de la base de datos |
| `DB_PASS` | Contraseña de la base de datos |
| `DB_PORT` | Puerto de PostgreSQL (default: 5432) |
| `JWT_SECRET` | Secreto para firma de tokens JWT |
| `CLOUDINARY_CLOUD_NAME` | Nombre del Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `DECOLECTA_TOKEN` | Token servicio RENIEC/Decolecta |

## Levantando el Servidor

```bash
cd backend
npm install
# cp .env.example .env  # completar con valores reales
npm start   # o: npm dev (con nodemon)
```

El servidor escuchará en `http://localhost:4000`.

## Middlewares de Seguridad

- `verificarToken`: Valida el token JWT en el header `Authorization: Bearer <token>`
- `permitirRol([roles])`: Middleware que verifica que el usuario tenga uno de los roles permitidos
- CORS configurado vía variable `FRONTEND_URL`

## Dependencias Clave

- `express` - Servidor web
- `pg` - Cliente PostgreSQL
- `jsonwebtoken` - Gestión de tokens JWT
- `cloudinary` - Almacenamiento de imágenes
- `bcrypt` - Hash de contraseñas
- `cors` - Control de acceso cruzado