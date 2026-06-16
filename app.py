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

# ================================================================
# PERSONA 2 — Consultas personalizadas, CRUD completo y correcciones
# ================================================================

# --- CORRECCIÓN DE RUTAS (las rutas del frontend estaban sin /api/) ---

@app.route('/proyectos', methods=['GET'])
def listar_proyectos_alias():
    """Alias para compatibilidad con el frontend"""
    return listar_proyectos()

@app.route('/proyectos', methods=['POST'])
@jwt_required()
def crear_proyecto_alias():
    """Alias para compatibilidad con el frontend (faltaba: causaba error 405 al crear proyectos)"""
    return crear_proyecto()

@app.route('/proyectos/<int:id>', methods=['GET'])
def obtener_proyecto_alias(id):
    return obtener_proyecto(id)

@app.route('/proyectos/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_proyecto_alias(id):
    return actualizar_proyecto(id)

@app.route('/proyectos/<int:id>', methods=['DELETE'])
@jwt_required()
def eliminar_proyecto_alias(id):
    return eliminar_proyecto(id)

@app.route('/login', methods=['POST'])
def login_alias():
    """El frontend manda a /login, la API real está en /api/auth/login"""
    from flask import request as req
    data = req.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400
    # El frontend manda 'username', la API espera 'email'
    # Buscamos por nombre o email para mayor compatibilidad
    username = data.get('username') or data.get('email')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'username y password son requeridos'}), 400
    usuario = Usuario.query.filter(
        (Usuario.email == username) | (Usuario.nombre == username)
    ).first()
    if not usuario or not usuario.check_password(password):
        return jsonify({'error': 'Credenciales inválidas'}), 401
    from flask_jwt_extended import create_access_token
    token = create_access_token(identity=str(usuario.id))
    return jsonify({
        'mensaje': 'Login exitoso',
        'token': token,
        'usuario': usuario.to_dict()
    }), 200


# --- CRUD COMPLETO DE PARTICIPANTES ---

@app.route('/api/participantes', methods=['GET'])
def listar_participantes_global():
    """GET /api/participantes — Lista todos los participantes"""
    participantes = Participante.query.all()
    return jsonify([p.to_dict() for p in participantes]), 200


@app.route('/api/participantes/<int:id>', methods=['GET'])
def obtener_participante(id):
    """GET /api/participantes/<id>"""
    p = Participante.query.get(id)
    if not p:
        return jsonify({'error': 'Participante no encontrado'}), 404
    return jsonify(p.to_dict()), 200


@app.route('/api/participantes', methods=['POST'])
@jwt_required()
def crear_participante():
    """POST /api/participantes — Crear participante (requiere JWT)"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400

    nombre = data.get('nombre')
    proyecto_id = data.get('proyecto_id')

    if not nombre or not proyecto_id:
        return jsonify({'error': 'nombre y proyecto_id son obligatorios'}), 400

    proyecto = Proyecto.query.get(proyecto_id)
    if not proyecto:
        return jsonify({'error': f'No existe un proyecto con id {proyecto_id}'}), 404

    p = Participante(
        nombre=nombre,
        email=data.get('email', ''),
        rol=data.get('rol', 'investigador'),
        institucion=data.get('institucion', ''),
        proyecto_id=proyecto_id
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({'mensaje': 'Participante creado', 'participante': p.to_dict()}), 201


@app.route('/api/participantes/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_participante(id):
    """PUT /api/participantes/<id> — Editar participante (requiere JWT)"""
    p = Participante.query.get(id)
    if not p:
        return jsonify({'error': 'Participante no encontrado'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400

    if 'nombre' in data:
        p.nombre = data['nombre']
    if 'email' in data:
        p.email = data['email']
    if 'rol' in data:
        p.rol = data['rol']
    if 'institucion' in data:
        p.institucion = data['institucion']

    db.session.commit()
    return jsonify({'mensaje': 'Participante actualizado', 'participante': p.to_dict()}), 200


@app.route('/api/participantes/<int:id>', methods=['DELETE'])
@jwt_required()
def eliminar_participante(id):
    """DELETE /api/participantes/<id> — Eliminar participante (requiere JWT)"""
    p = Participante.query.get(id)
    if not p:
        return jsonify({'error': 'Participante no encontrado'}), 404

    db.session.delete(p)
    db.session.commit()
    return jsonify({'mensaje': 'Participante eliminado'}), 200


# --- CRUD COMPLETO DE ACTIVIDADES ---

@app.route('/api/actividades', methods=['GET'])
def listar_actividades_global():
    """GET /api/actividades — Lista todas las actividades"""
    actividades = Actividad.query.all()
    return jsonify([a.to_dict() for a in actividades]), 200


@app.route('/api/actividades/<int:id>', methods=['GET'])
def obtener_actividad(id):
    """GET /api/actividades/<id>"""
    a = Actividad.query.get(id)
    if not a:
        return jsonify({'error': 'Actividad no encontrada'}), 404
    return jsonify(a.to_dict()), 200


@app.route('/api/actividades', methods=['POST'])
@jwt_required()
def crear_actividad():
    """POST /api/actividades — Crear actividad (requiere JWT)"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400

    descripcion = data.get('descripcion')
    fecha_str = data.get('fecha_actividad')
    proyecto_id = data.get('proyecto_id')

    if not descripcion or not fecha_str or not proyecto_id:
        return jsonify({'error': 'descripcion, fecha_actividad y proyecto_id son obligatorios'}), 400

    proyecto = Proyecto.query.get(proyecto_id)
    if not proyecto:
        return jsonify({'error': f'No existe un proyecto con id {proyecto_id}'}), 404

    porcentaje = data.get('porcentaje_avance', 0)
    if not isinstance(porcentaje, int) or not (0 <= porcentaje <= 100):
        return jsonify({'error': 'porcentaje_avance debe ser un número entre 0 y 100'}), 400

    try:
        fecha = date.fromisoformat(fecha_str)
    except ValueError:
        return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400

    a = Actividad(
        descripcion=descripcion,
        fecha_actividad=fecha,
        porcentaje_avance=porcentaje,
        estado=data.get('estado', 'pendiente'),
        proyecto_id=proyecto_id
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({'mensaje': 'Actividad creada', 'actividad': a.to_dict()}), 201


@app.route('/api/actividades/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_actividad(id):
    """PUT /api/actividades/<id> — Editar actividad (requiere JWT)"""
    a = Actividad.query.get(id)
    if not a:
        return jsonify({'error': 'Actividad no encontrada'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400

    if 'descripcion' in data:
        a.descripcion = data['descripcion']
    if 'estado' in data:
        a.estado = data['estado']
    if 'porcentaje_avance' in data:
        p = data['porcentaje_avance']
        if not isinstance(p, int) or not (0 <= p <= 100):
            return jsonify({'error': 'porcentaje_avance debe ser entre 0 y 100'}), 400
        a.porcentaje_avance = p
    if 'fecha_actividad' in data:
        try:
            a.fecha_actividad = date.fromisoformat(data['fecha_actividad'])
        except ValueError:
            return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400

    db.session.commit()
    return jsonify({'mensaje': 'Actividad actualizada', 'actividad': a.to_dict()}), 200


@app.route('/api/actividades/<int:id>', methods=['DELETE'])
@jwt_required()
def eliminar_actividad(id):
    """DELETE /api/actividades/<id> — Eliminar actividad (requiere JWT)"""
    a = Actividad.query.get(id)
    if not a:
        return jsonify({'error': 'Actividad no encontrada'}), 404

    db.session.delete(a)
    db.session.commit()
    return jsonify({'mensaje': 'Actividad eliminada'}), 200


# --- CONSULTAS PERSONALIZADAS (requisito 6 del proyecto) ---

@app.route('/api/consultas/por-estado', methods=['GET'])
def consulta_por_estado():
    """
    GET /api/consultas/por-estado?estado=activo
    Filtra proyectos por su estado
    """
    estado = request.args.get('estado', '').strip()
    estados_validos = ['activo', 'en pausa', 'finalizado']

    if not estado:
        return jsonify({
            'error': 'Debes enviar el parámetro estado',
            'opciones': estados_validos
        }), 400

    if estado not in estados_validos:
        return jsonify({
            'error': f'Estado "{estado}" no válido',
            'opciones': estados_validos
        }), 400

    proyectos = Proyecto.query.filter_by(estado=estado).all()
    return jsonify({
        'estado_filtrado': estado,
        'total': len(proyectos),
        'proyectos': [p.to_dict() for p in proyectos]
    }), 200


@app.route('/api/consultas/por-investigador', methods=['GET'])
def consulta_por_investigador():
    """
    GET /api/consultas/por-investigador?nombre=Garcia
    Busca proyectos por nombre del investigador responsable
    """
    nombre = request.args.get('nombre', '').strip()

    if not nombre or len(nombre) < 2:
        return jsonify({'error': 'El parámetro nombre debe tener al menos 2 caracteres'}), 400

    proyectos = Proyecto.query.filter(
        Proyecto.investigador_responsable.ilike(f'%{nombre}%')
    ).all()

    return jsonify({
        'investigador_buscado': nombre,
        'total': len(proyectos),
        'proyectos': [p.to_dict() for p in proyectos]
    }), 200


@app.route('/api/consultas/por-fecha', methods=['GET'])
def consulta_por_fecha():
    """
    GET /api/consultas/por-fecha?inicio=2024-01-01&fin=2024-12-31
    Filtra proyectos iniciados en un rango de fechas
    """
    inicio_str = request.args.get('inicio')
    fin_str = request.args.get('fin')

    if not inicio_str or not fin_str:
        return jsonify({
            'error': 'Debes enviar los parámetros inicio y fin en formato YYYY-MM-DD'
        }), 400

    try:
        fecha_inicio = date.fromisoformat(inicio_str)
        fecha_fin = date.fromisoformat(fin_str)
    except ValueError:
        return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400

    if fecha_inicio > fecha_fin:
        return jsonify({'error': 'La fecha de inicio no puede ser mayor a la fecha fin'}), 400

    proyectos = Proyecto.query.filter(
        Proyecto.fecha_inicio >= fecha_inicio,
        Proyecto.fecha_inicio <= fecha_fin
    ).all()

    return jsonify({
        'desde': inicio_str,
        'hasta': fin_str,
        'total': len(proyectos),
        'proyectos': [p.to_dict() for p in proyectos]
    }), 200


@app.route('/api/consultas/buscar', methods=['GET'])
def busqueda_global():
    """
    GET /api/consultas/buscar?q=texto
    Busca en proyectos, participantes e instituciones al mismo tiempo
    """
    termino = request.args.get('q', '').strip()

    if not termino or len(termino) < 2:
        return jsonify({'error': 'El parámetro q debe tener al menos 2 caracteres'}), 400

    proyectos = Proyecto.query.filter(
        (Proyecto.nombre.ilike(f'%{termino}%')) |
        (Proyecto.descripcion.ilike(f'%{termino}%')) |
        (Proyecto.investigador_responsable.ilike(f'%{termino}%'))
    ).all()

    participantes = Participante.query.filter(
        (Participante.nombre.ilike(f'%{termino}%')) |
        (Participante.email.ilike(f'%{termino}%')) |
        (Participante.institucion.ilike(f'%{termino}%'))
    ).all()

    instituciones = Institucion.query.filter(
        Institucion.nombre.ilike(f'%{termino}%')
    ).all()

    return jsonify({
        'termino': termino,
        'proyectos': {'total': len(proyectos), 'items': [p.to_dict() for p in proyectos]},
        'participantes': {'total': len(participantes), 'items': [p.to_dict() for p in participantes]},
        'instituciones': {'total': len(instituciones), 'items': [i.to_dict() for i in instituciones]},
        'total_general': len(proyectos) + len(participantes) + len(instituciones)
    }), 200


# --- DASHBOARD CON DATOS REALES ---

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    """
    GET /api/dashboard
    Devuelve estadísticas reales para las tarjetas del frontend
    """
    total_proyectos = Proyecto.query.count()
    proyectos_activos = Proyecto.query.filter_by(estado='activo').count()
    proyectos_finalizados = Proyecto.query.filter_by(estado='finalizado').count()
    proyectos_en_pausa = Proyecto.query.filter_by(estado='en pausa').count()
    total_participantes = Participante.query.count()
    total_actividades = Actividad.query.count()
    total_instituciones = Institucion.query.count()

    return jsonify({
        'total_proyectos': total_proyectos,
        'proyectos_activos': proyectos_activos,
        'proyectos_finalizados': proyectos_finalizados,
        'proyectos_en_pausa': proyectos_en_pausa,
        'total_participantes': total_participantes,
        'total_actividades': total_actividades,
        'total_instituciones': total_instituciones,
        'proyectos_por_estado': {
            'Activo': proyectos_activos,
            'En Pausa': proyectos_en_pausa,
            'Finalizado': proyectos_finalizados
        }
    }), 200

@app.route('/')
def home():
    return '<h1>¡Servidor funcionando correctamente! </h1><p>El backend está en línea.</p>'


@app.route('/api/health', methods=['GET'])
def health():
    """GET /api/health — chequeo rápido para verificar que la API y la BD responden"""
    try:
        Usuario.query.first()
        return jsonify({'status': 'ok', 'mensaje': 'API y base de datos operativas'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)