import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'clave-secreta-super-segura-cambiar-en-produccion')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-clave-secreta-cambiar-en-produccion')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hora
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///proyectos.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'