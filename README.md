# Proyecto de Investigación - Backend API

API REST para gestión de proyectos de investigación con autenticación JWT.

## Tecnologías

- **Flask** (Python 3.13)
- **SQLAlchemy** + **SQLite** (base de datos local, sin necesidad de MySQL/MariaDB)
- **JWT** (Flask-JWT-Extended) para autenticación
- **bcrypt** para hash de contraseñas

## Requisitos

- Python 3.10+
- pip (gestor de paquetes de Python)

## Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd proyecto-de-web--133

# 2. Crear y activar el entorno virtual
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# o en Windows: venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Ejecutar el servidor (crea la BD y datos de ejemplo automáticamente)
python app.py
```

El servidor se iniciará en `http://localhost:5000`.

## Estructura de la Base de Datos (5 tablas)

| Tabla           | Descripción                              |
|-----------------|------------------------------------------|
| usuarios        | Autenticación JWT (admin, investigador)  |
| proyectos       | Proyectos de investigación               |
| participantes   | Participantes vinculados a proyectos     |
| actividades     | Actividades/avances de proyectos         |
| instituciones   | Instituciones académicas                 |

### Relaciones

- `proyectos.usuario_id` → `usuarios.id` (FK, SET NULL al eliminar)
- `participantes.proyecto_id` → `proyectos.id` (FK, CASCADE al eliminar)
- `actividades.proyecto_id` → `proyectos.id` (FK, CASCADE al eliminar)

## Endpoints de la API

### Autenticación (JWT)

| Método | Endpoint              | Descripción                          | Auth |
|--------|-----------------------|--------------------------------------|------|
| POST   | `/api/auth/register`  | Registrar un nuevo usuario           | No   |
| POST   | `/api/auth/login`     | Iniciar sesión, devuelve JWT token   | No   |

### CRUD Proyectos

| Método | Endpoint                  | Descripción                    | Auth |
|--------|---------------------------|--------------------------------|------|
| GET    | `/api/proyectos`          | Listar todos los proyectos     | No   |
| GET    | `/api/proyectos/<id>`     | Obtener proyecto por ID        | No   |
| POST   | `/api/proyectos`          | Crear nuevo proyecto           | Sí   |
| PUT    | `/api/proyectos/<id>`     | Actualizar proyecto existente  | Sí   |
| DELETE | `/api/proyectos/<id>`     | Eliminar un proyecto           | Sí   |

### Adicionales

| Método | Endpoint                              | Descripción                     | Auth |
|--------|---------------------------------------|---------------------------------|------|
| GET    | `/api/proyectos/<id>/participantes`   | Participantes de un proyecto    | No   |
| GET    | `/api/proyectos/<id>/actividades`     | Actividades de un proyecto      | No   |
| GET    | `/api/instituciones`                  | Listar instituciones            | No   |

## Ejemplos de uso con curl

### 1. Registrar un usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","email":"juan@example.com","password":"123456"}'
```

### 2. Iniciar sesión (obtener token)
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo $TOKEN
```

### 3. Listar proyectos (GET, público)
```bash
curl http://localhost:5000/api/proyectos | python3 -m json.tool
```

### 4. Crear proyecto (POST, requiere token)
```bash
curl -X POST http://localhost:5000/api/proyectos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Nuevo proyecto","fecha_inicio":"2026-01-01","investigador_responsable":"Dr. Pérez"}'
```

### 5. Actualizar proyecto (PUT, requiere token)
```bash
curl -X PUT http://localhost:5000/api/proyectos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"estado":"finalizado"}'
```

### 6. Eliminar proyecto (DELETE, requiere token)
```bash
curl -X DELETE http://localhost:5000/api/proyectos/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Obtener proyecto por ID
```bash
curl http://localhost:5000/api/proyectos/2 | python3 -m json.tool
```

