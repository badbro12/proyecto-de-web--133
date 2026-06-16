from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), default='investigador')
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

    proyectos = db.relationship('Proyecto', backref='usuario', lazy=True)

    def set_password(self, password_plano):
        self.password = bcrypt.hashpw(password_plano.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password_plano):
        return bcrypt.checkpw(password_plano.encode('utf-8'), self.password.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'rol': self.rol,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
        }


class Proyecto(db.Model):
    __tablename__ = 'proyectos'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    estado = db.Column(db.String(20), default='activo')
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date)
    investigador_responsable = db.Column(db.String(100), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True)

    participantes = db.relationship('Participante', backref='proyecto', lazy=True, cascade='all, delete-orphan')
    actividades = db.relationship('Actividad', backref='proyecto', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'estado': self.estado,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'investigador_responsable': self.investigador_responsable,
            'usuario_id': self.usuario_id
        }


class Participante(db.Model):
    __tablename__ = 'participantes'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    rol = db.Column(db.String(50))
    institucion = db.Column(db.String(100))
    proyecto_id = db.Column(db.Integer, db.ForeignKey('proyectos.id', ondelete='CASCADE'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'rol': self.rol,
            'institucion': self.institucion,
            'proyecto_id': self.proyecto_id
        }


class Actividad(db.Model):
    __tablename__ = 'actividades'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descripcion = db.Column(db.Text, nullable=False)
    fecha_actividad = db.Column(db.Date, nullable=False)
    porcentaje_avance = db.Column(db.Integer, default=0)
    estado = db.Column(db.String(20), default='pendiente')
    proyecto_id = db.Column(db.Integer, db.ForeignKey('proyectos.id', ondelete='CASCADE'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'descripcion': self.descripcion,
            'fecha_actividad': self.fecha_actividad.isoformat() if self.fecha_actividad else None,
            'porcentaje_avance': self.porcentaje_avance,
            'estado': self.estado,
            'proyecto_id': self.proyecto_id
        }


class Institucion(db.Model):
    __tablename__ = 'instituciones'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(150), nullable=False)
    direccion = db.Column(db.Text)
    telefono = db.Column(db.String(20))

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'direccion': self.direccion,
            'telefono': self.telefono
        }