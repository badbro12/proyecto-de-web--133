from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, Usuario
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400

    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')
    rol = data.get('rol', 'investigador')

    if not nombre or not email or not password:
        return jsonify({'error': 'nombre, email y password son requeridos'}), 400

    if Usuario.query.filter_by(email=email).first():
        return jsonify({'error': 'El email ya está registrado'}), 409

    usuario = Usuario(nombre=nombre, email=email, rol=rol)
    usuario.set_password(password)
    db.session.add(usuario)
    db.session.commit()

    return jsonify({'mensaje': 'Usuario registrado exitosamente', 'usuario': usuario.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Datos requeridos'}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'email y password son requeridos'}), 400

    usuario = Usuario.query.filter_by(email=email).first()
    if not usuario or not usuario.check_password(password):
        return jsonify({'error': 'Credenciales inválidas'}), 401

    token = create_access_token(identity=str(usuario.id))
    return jsonify({
        'mensaje': 'Login exitoso',
        'token': token,
        'usuario': usuario.to_dict()
    }), 200


# Decorador para requerir autenticación (protege POST, PUT, DELETE)
# Se usa @jwt_required() directamente de flask_jwt_extended,
# pero creamos un helper para obtener el usuario actual
def get_current_user():
    user_id = get_jwt_identity()
    if user_id:
        return Usuario.query.get(int(user_id))
    return None