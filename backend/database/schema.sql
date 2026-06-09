-- Crear la base de datos (MySQL)
CREATE DATABASE IF NOT EXISTS proyecto_investigacion;
USE proyecto_investigacion;

-- Tabla 1: Usuarios (para autenticación JWT)
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'investigador') DEFAULT 'investigador',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 2: Proyectos
CREATE TABLE proyectos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado ENUM('activo', 'en pausa', 'finalizado') DEFAULT 'activo',
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    investigador_responsable VARCHAR(100) NOT NULL,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla 3: Participantes
CREATE TABLE participantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    rol VARCHAR(50), -- 'investigador', 'asistente', 'becario'
    institucion VARCHAR(100),
    proyecto_id INT NOT NULL,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- Tabla 4: Actividades (avances del proyecto)
CREATE TABLE actividades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    descripcion TEXT NOT NULL,
    fecha_actividad DATE NOT NULL,
    porcentaje_avance INT DEFAULT 0, -- 0 a 100
    estado ENUM('pendiente', 'en progreso', 'completado') DEFAULT 'pendiente',
    proyecto_id INT NOT NULL,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

-- Tabla 5: Instituciones (opcional pero útil)
CREATE TABLE instituciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20)
);

-- Insertar datos de ejemplo
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Admin', 'admin@example.com', 'admin123', 'admin');  -- Cambiar luego por hash

INSERT INTO instituciones (nombre, direccion) VALUES 
('Universidad Nacional', 'Calle Principal 123', '555-1234');

INSERT INTO proyectos (nombre, descripcion, estado, fecha_inicio, investigador_responsable) VALUES
('IA para diagnóstico médico', 'Usar IA para detectar enfermedades', 'activo', '2024-01-15', 'Dr. García'),
('Energía renovable', 'Paneles solares eficientes', 'activo', '2024-02-01', 'Dra. Martínez'),
('Educación virtual', 'Plataforma de aprendizaje', 'finalizado', '2023-09-10', 'Mg. López');