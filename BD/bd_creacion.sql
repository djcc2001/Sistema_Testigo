--CREAR BD
CREATE DATABASE sistema_testigo;

--CREAR TABLAS
-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(15) UNIQUE,
    nombres VARCHAR(100),
    apellido_paterno VARCHAR(100),
    apellido_materno VARCHAR(100),
    nro_celular VARCHAR(20),
    correo VARCHAR(100) UNIQUE,
    contrasena VARCHAR(200),
    fecha_registro TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'activo',
    foto VARCHAR(100),
    rol VARCHAR(20) -- ciudadano, autoridad, admin
);
-- Tabla de categorías
CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(100)
);
-- Tabla de estados de reporte
CREATE TABLE estado_reporte (
    id SERIAL PRIMARY KEY, -- 1: Nuevo, 2: En revision, 3: Finalizado, 4: Rechazado
    estado VARCHAR(50)
);
-- Tabla de reportes
CREATE TABLE reportes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200),
    descripcion TEXT,
    latitud DECIMAL(15,8),
    longitud DECIMAL(15,8),
    direccion VARCHAR(200),
    distrito VARCHAR(100),
    comentario TEXT,
    estado_id INT REFERENCES estado_reporte(id),
    ciudadano_id INT REFERENCES usuarios(id),
    autoridad_id INT REFERENCES usuarios(id),
    categoria_id INT REFERENCES categoria(id),
    fecha DATE,
    hora TIME
);
-- Tabla de evidencias
CREATE TABLE evidencias (
    id SERIAL PRIMARY KEY,
    reporte_id INT REFERENCES reportes(id) ON DELETE CASCADE,
    url_archivo TEXT,
    tipo VARCHAR(20) CHECK (tipo IN ('foto','video'))
);
-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    reporte_id INT REFERENCES reportes(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id),
    tipo VARCHAR(50),
    fecha TIMESTAMP DEFAULT NOW()
);


-- Agregar valores por defecto
INSERT INTO estado_reporte 
VALUES 
(1, 'Nuevo'),
(2, 'En revisión'),
(3, 'Finalizado'),
(4, 'Archivado');

-- Agregar valores por defecto
INSERT INTO  categoria   
VALUES 
(1, 'Congestión y fluidez vehicular'),
(2, 'Seguridad vial y accidentes'),
(3, 'Infraestructura vial'),
(4, 'Movilidad peatonal y no motorizada'),
(5, 'Transporte público'),
(6, 'Regulación y fiscalización'),
(7, 'Impacto ambiental'),
(8, 'Otros');
