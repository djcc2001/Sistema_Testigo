# Sistema Testigo

![Badge React](https://img.shields.io/badge/react-%2319.1.1-brightgreen.svg?style=for-the-badge&logo=react)
![Badge Node.js](https://img.shields.io/badge/node.js-%23Express-68A063?style=for-the-badge&logo=node.js)
![Badge PostgreSQL](https://img.shields.io/badge/postgres-%23PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Badge JWT](https://img.shields.io/badge/jwt-%20auth-000000?style=for-the-badge&logo=json-web-tokens)

## Tabla de Contenidos

1. [Descripción Objetivo](#descripción-objetivo)
2. [Características por Rol](#características-principales-por-rol)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Instalación y Puesta en Marcha](#instalación-y-puesta-en-marcha)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Tecnologías Utilizadas](#tecnologías-utilizadas)
7. [Integrantes](#integrantes)

---

## Descripción Objetivo

Plataforma de reportes ciudadanos sobre tráfico e infraestructura urbana. Permite a los reportar incidencias viales y problemas de infraestructura, mientras que las autoridades pueden gestionar, revisar y dar seguimiento a los reportes mediante roles diferenciados (ciudadano, autoridad, administrador). El sistema captura datos geolocalizados, evidencia fotográfica y proporciona estadísticas del sistema.

---

## Características Principales por Rol

### Ciudadano

- Crear reportes de tráfico/infraestructura con título, descripción y ubicación geográfica
- Adjuntar evidencia fotográfica mediante Cloudinary
- Consultar el estado y historial de sus reportes personales
- Ver estadísticas individuales de reportes y resolución
- Acceso protegido por rol con autenticación JWT

### Autoridad

- Recibir y asignar reportes nuevos a instituciones
- Cambiar el estado de los reportes (nuevo → en revisión → finalizado)
- Agregar comentarios y seguimiento a reportes asignados
- Consultar resumen de reportes bajo su jurisdicción
- Ver estadísticas de desempeño institucional
- Acceso protegido por rol con autenticación JWT

### Administrador

- Gestionar usuarios del sistema (crear, editar, eliminar)
- Ver reportes totales del sistema sin filtros de institución
- Configurar instituciones colaboradoras
- Acceso a todas las estadísticas del sistema
- Acceso protegido por rol de administrador

---

## Arquitectura del Sistema

```text
+----------------------+         HTTP/REST         +----------------------+
|                      |  <-------------------->|                      |
|   Frontend (React)   |                       |   Backend (Express)  |
|  (React 19 + Router) |                       |  (Node.js + PG)      |
|                      |                       |                      |
|  • Rutas protegidas  |                       |  • JWT Authentication|
|  • Contexto Auth     |                       |  • CORS configurado   |
|  • Leaflet map       |                       |  • Cloudinary API     |
|  • Recharts stats    |                       |  • RENIEC/Decolecta   |
|  • Formularios       |                       |    API para DNI       |
|                      |                       |                      |
+----------------------+                       +--------+-------------+
                                                   |
                                                   v
                                              +---------------+
                                              | PostgreSQL    |
                                              | (sistema_testigo) |
                                              +---------------+
```

**Integraciones externas:**
- **Cloudinary**: Almacenamiento y gestión de imágenes de evidencia de reportes
- **API Decolecta/RENIEC**: Consulta de datos de DNI para validación de usuario

---

## Instalación y Puesta en Marcha

Levante el proyecto completo siguiendo los pasos de los READMEs específicos:

### Requisitos previos

- PostgreSQL corriendo con base de datos `sistema_testigo`
- Node.js v20+ y npm

### Pasos

1. **Clonar repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd Sistema_Testigo
   ```

2. **Levantar el Backend**

   ```bash
   cd backend
   npm install
   # Copiar .env.example a .env y completar con valores reales
   cp .env.example .env
   npm start     # o: npm dev (con nodemon)
   ```

   El servidor correrá en `http://localhost:4000`.
   *Véase `backend/README.md` para configuración completa de variables de entorno y endpoints.*

3. **Levantar el Frontend**

   ```bash
   cd frontend
   npm install
   # Copiar .env.example a .env si existe
   npm start
   ```

   La aplicación estará disponible en `http://localhost:3000`, consumiendo la API en `http://localhost:4000`.
   *Véase `frontend/README.md` para scripts de desarrollo, build y tests.*

---

## Estructura del Proyecto

```
Sistema_Testigo/
├── .gitignore              # Ignora node_modules, .env, builds temporales
├── REPORTE_CAMBIOS.md      # Registro de cambios y alertas de seguridad
├── README.md               # Este archivo (resumen general + enlaces)
├── BD/                     # Archivos de creación y migración de BD
│   ├── bd_creacion.sql
│   └── comandos.txt
├── backend/
│   ├── package.json        # Dependencias backend (Express, PG, JWT, Cloudinary, etc.)
│   ├── src/app.js          # Entry point del servidor Express
│   ├── src/config/db.js    # Configuración conexión PostgreSQL
│   ├── src/models/         # Modelos de base de datos (reportes, usuarios, categorías)
│   ├── src/controllers/    # Controladores (usuarios, reportes, auth, estadísticas)
│   ├── src/routes/         # Rutas API organizadas por recurso
│   ├── src/middlewares/    # Middleware auth (JWT verification, role validation)
│   ├── .env.example        # Variables de entorno con valores placeholder
│   └── .gitignore          # Ignora .env, node_modules, dist
├── frontend/
│   ├── package.json        # Dependencias frontend (React 19, testing-libs, etc.)
│   ├── public/             # Recursos públicos e index.html
│   ├── src/
│   │   ├── App.js          # Aplicación con rutas protegidas por rol
│   │   ├── context/AutentificacionContext.jsx # Contexto de auth con JWT
│   │   ├── components/RutaPrivada.jsx         # Middleware de protección de rutas
│   │   ├── pages/          # Páginas por rol (ciudadano, autoridad, admin)
│   │   ├── services/api.js # Cliente Axios para API backend
│   │   └── components/     # Componentes UI (mapa, formularios, tablas)
│   └── README.md           # Guía de levantar frontend localmente
```

---

## Tecnologías Utilizadas

**Backend** (versiones reales de `backend/package.json`):

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | ^18 (entorno) | Entorno de ejecución |
| Express | ^5.1.0 | Framework API REST |
| PostgreSQL | ^8.16.3 | Base de datos relacional |
| pg | ^8.16.3 | Cliente PostgreSQL nativo |
| jsonwebtoken | ^9.0.2 | Autenticación JWT |
| bcrypt | ^6.0.0 | Hash de contraseñas |
| cloudinary | ^1.41.3 | Almacenamiento de imágenes |
| multer-storage-cloudinary | ^4.0.0 | Subida de fotos a Cloudinary |
| cors | ^2.8.5 | Control de acceso cruzado |
| dotenv | ^17.2.2 | Carga de variables de entorno |
| bcrypt | ^6.0.0 | Hash de contraseñas |
| twilio | ^5.11.1 | (Integración - verifique si activo) |

**Frontend** (versiones reales de `frontend/package.json`):

| Tecnología | Versión | Propósito |
|---|---|---|
| React | ^19.1.1 | Biblioteca de UI |
| React DOM | ^19.1.1 | Renderizado DOM |
| React Router DOM | ^7.9.1 | Enrutamiento y rutas protegidas |
| Axios | ^1.12.2 | Cliente HTTP para API |
| Leaflet | ^1.9.4 | Mapa interactivo |
| Recharts | ^3.4.1 | Gráficos de estadísticas |
| Swiper | ^12.0.2 | Carrusel/carousel |
| jwt-decode | ^4.0.0 | Decodificación de tokens JWT |
| @testing-library/react | ^16.3.0 | Tests de componentes |
| @testing-library/jest-dom | ^6.8.0 | Matchers de Jest para DOM |

**Integraciones Externas:**
- **Cloudinary** (cloud name, API key/secret configurables vía .env)
- **API Decolecta/RENIEC** (token configurable vía .env para consulta de DNI)

---

## Integrantes

- Oscar David Barrientos Huillca
- Denis Jair Cancinas Cárdenas
- Brayan Rodrigo Quispe Castillo
- Richard Rodríguez Huaylla

---

## Licencia

No existe un archivo LICENSE en el repositorio; por tanto, esta sección no aplica.