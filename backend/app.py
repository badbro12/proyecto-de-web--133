from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from datetime import date, datetime

from config import Config
from models import db, Usuario, Proyecto, Participante, Actividad, Institucion
from auth import auth_bp

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
CORS(app)
jwt = JWTManager(app)

app.register_blueprint(auth_bp)

# ===================== CRUD PROYECTOS =====================

@app.route('/api/proyectos', methods=['GET'])
def listar_proyectos():
    """GET /api/proyectos - Listar todos los proyectos"""
    proyectos = Proyecto.query.all()
    return jsonify([p.to_dict() for p in proyectos]), 200


@app.route('/api/proyectos/<int:id>', methods=['GET'])
def obtener_proyecto(id):
    """GET /api/proyectos/<id> - Obtener un proyecto por ID"""
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    return jsonify(proyecto.to_dict()), 200


@app.route('/api/proyectos', methods=['POST'])
@jwt_required()
def crear_proyecto():
    """POST /api/proyectos - Crear un nuevo proyecto (requiere JWT)"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400

    nombre = data.get('nombre')
    descripcion = data.get('descripcion')
    estado = data.get('estado', 'activo')
    fecha_inicio_str = data.get('fecha_inicio')
    fecha_fin_str = data.get('fecha_fin')
    investigador_responsable = data.get('investigador_responsable')

    if not nombre or not fecha_inicio_str or not investigador_responsable:
        return jsonify({'error': 'nombre, fecha_inicio e investigador_responsable son requeridos'}), 400

    try:
        fecha_inicio = date.fromisoformat(fecha_inicio_str)
        fecha_fin = date.fromisoformat(fecha_fin_str) if fecha_fin_str else None
    except ValueError:
        return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400

    user_id = get_jwt_identity()

    proyecto = Proyecto(
        nombre=nombre,
        descripcion=descripcion,
        estado=estado,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        investigador_responsable=investigador_responsable,
        usuario_id=int(user_id)
    )

    db.session.add(proyecto)
    db.session.commit()

    return jsonify({'mensaje': 'Proyecto creado exitosamente', 'proyecto': proyecto.to_dict()}), 201


@app.route('/api/proyectos/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_proyecto(id):
    """PUT /api/proyectos/<id> - Actualizar un proyecto (requiere JWT)"""
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400

    if 'nombre' in data:
        proyecto.nombre = data['nombre']
    if 'descripcion' in data:
        proyecto.descripcion = data['descripcion']
    if 'estado' in data:
        proyecto.estado = data['estado']
    if 'fecha_inicio' in data:
        try:
            proyecto.fecha_inicio = date.fromisoformat(data['fecha_inicio'])
        except ValueError:
            return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400
    if 'fecha_fin' in data:
        try:
            proyecto.fecha_fin = date.fromisoformat(data['fecha_fin']) if data['fecha_fin'] else None
        except ValueError:
            return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400
    if 'investigador_responsable' in data:
        proyecto.investigador_responsable = data['investigador_responsable']

    db.session.commit()
    return jsonify({'mensaje': 'Proyecto actualizado exitosamente', 'proyecto': proyecto.to_dict()}), 200


@app.route('/api/proyectos/<int:id>', methods=['DELETE'])
@jwt_required()
def eliminar_proyecto(id):
    """DELETE /api/proyectos/<id> - Eliminar un proyecto (requiere JWT)"""
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404

    db.session.delete(proyecto)
    db.session.commit()
    return jsonify({'mensaje': 'Proyecto eliminado exitosamente'}), 200


# ===================== ENDPOINTS ADICIONALES (participantes, actividades, instituciones) =====================

@app.route('/api/proyectos/<int:id>/participantes', methods=['GET'])
def listar_participantes(id):
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    return jsonify([p.to_dict() for p in proyecto.participantes]), 200


@app.route('/api/proyectos/<int:id>/actividades', methods=['GET'])
def listar_actividades(id):
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'error': 'Proyecto no encontrado'}), 404
    return jsonify([a.to_dict() for a in proyecto.actividades]), 200


@app.route('/api/instituciones', methods=['GET'])
def listar_instituciones():
    instituciones = Institucion.query.all()
    return jsonify([i.to_dict() for i in instituciones]), 200


# ===================== INICIALIZACIÓN DE LA BASE DE DATOS =====================

def init_db():
    with app.app_context():
        db.create_all()

        # Solo insertar datos de ejemplo si la tabla usuarios está vacía
        if Usuario.query.count() == 0:
            print("Insertando datos de ejemplo...")

            admin = Usuario(nombre='Admin', email='admin@example.com', rol='admin')
            admin.set_password('admin123')
            db.session.add(admin)

            instituciones = [
                Institucion(nombre='Universidad Nacional', direccion='Calle Principal 123', telefono='555-1234'),
                Institucion(nombre='Instituto Tecnológico', direccion='Av. Tecnología 456', telefono='555-5678'),
            ]
            db.session.add_all(instituciones)

            proyectos = [
                Proyecto(
                    nombre='IA para diagnóstico médico',
                    descripcion='Usar IA para detectar enfermedades',
                    estado='activo',
                    fecha_inicio=date(2024, 1, 15),
                    investigador_responsable='Dr. García',
                    usuario_id=1
                ),
                Proyecto(
                    nombre='Energía renovable',
                    descripcion='Paneles solares eficientes',
                    estado='activo',
                    fecha_inicio=date(2024, 2, 1),
                    investigador_responsable='Dra. Martínez',
                    usuario_id=1
                ),
                Proyecto(
                    nombre='Educación virtual',
                    descripcion='Plataforma de aprendizaje',
                    estado='finalizado',
                    fecha_inicio=date(2023, 9, 10),
                    fecha_fin=date(2024, 6, 30),
                    investigador_responsable='Mg. López',
                    usuario_id=1
                ),
            ]
            db.session.add_all(proyectos)

            db.session.commit()
            print("Datos de ejemplo insertados correctamente.")
        else:
            print("La base de datos ya tiene datos.")


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)