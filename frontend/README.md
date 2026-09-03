# Sistema Testigo

Plataforma de reportes ciudadanos de tráfico e infraestructura. Permite a los usuarios reportar incidencias viales y problemas de infraestructura, mientras que las autoridades pueden gestionar, revisar y dar seguimiento a los reportes.

## Roles de Usuario

- **Ciudadano**: Puede crear reportes con ubicación geográfica, agregar evidencia (fotos), ver el estado de sus reportes y recibir notificaciones.
- **Autoridad**: Puede asignar reportes, cambiar estados, agregar comentarios, ver estadísticas y gestionar usuarios de su institución.

## Arquitectura

- **Frontend**: React 19 con rutas protegidas basadas en roles
- **Backend**: Express.js + Node.js con API REST
- **Base de Datos**: PostgreSQL
- **Despliegue**: Variables de entorno para configuración

## Variables de Entorno Necesarias

### Backend (`backend/.env`)

Copia el archivo `backend/.env.example` y completa con los valores reales:

```
PORT=4000
FRONTEND_URL=http://localhost:3000

DB_USER=tu_usuario_db
DB_HOST=localhost
DB_NAME=sistema_testigo
DB_PASS=tu_contraseña_db
DB_PORT=5432

JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

CLOUDINARY_CLOUD_NAME=tu_nombre_cloudinary
CLOUDINARY_API_KEY=tu_api_key_cloudinary
CLOUDINARY_API_SECRET=tu_api_secret_cloudinary

DECOLECTA_TOKEN=tu_token_de_decolecta
```

### Frontend (`frontend/.env`)

El frontend usa variables `REACT_APP_` prefijadas:

```
REACT_APP_DECOLECTA_TOKEN=tu_token_de_decolecta
REACT_APP_API_BASE_URL=http://localhost:4000
```

## Levantando el Proyecto Localmente

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Sistema_Testigo
```

### 2. Levantar el Backend

```bash
cd backend
npm install
cp .env.example .env  # completar con valores reales
npm start   # o: npm dev (con nodemon)
```

El servidor correrá en `http://localhost:4000`

### 3. Levantar el Frontend

```bash
cd frontend
npm install
cp .env.example .env  # completar con valores reales
npm start
```

La aplicación estará disponible en `http://localhost:3000`

### 4. Base de Datos (PostgreSQL)

Asegúrate de tener PostgreSQL corriendo y la base de datos `sistema_testigo` creada. Las migraciones o el esquema de la base de datos debe estar configurado según `backend/src/config/db.js`.

## Scripts Disponibles

### Backend:

- `npm start` - Iniciar servidor en producción
- `npm dev` - Iniciar con nodemon (modo desarrollo)

### Frontend:

- `npm start` - Ejecutar en modo desarrollo (http://localhost:3000)
- `npm build` - Generar build de producción
- `npm test` - Ejecutar el suite de tests

## Seguridad

- Las credenciales sensibles deben venir siempre de variables de entorno (nunca hardcodeadas)
- El archivo `Revisar` (anterior `.env` versionado) ha sido eliminado del repositorio
- Los secretos rotados manualmente si estuvieron expuestos en historial de git
- CORS está restringido a `FRONTEND_URL` configurado
- Las rutas protegidas validan rol y token JWT