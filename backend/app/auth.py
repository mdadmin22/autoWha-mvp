"""
Autenticación básica para el panel de administración.

Usa HTTP Basic Auth. La contraseña se configura via la variable de entorno
ADMIN_PASSWORD (ver .env.example). Usar secrets.compare_digest evita
ataques de timing.
"""
import os
import secrets

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials

security = HTTPBasic()


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Dependency: valida que la contraseña coincida con ADMIN_PASSWORD."""
    admin_password = os.getenv("ADMIN_PASSWORD", "admin")
    correct = secrets.compare_digest(
        credentials.password.encode("utf-8"),
        admin_password.encode("utf-8"),
    )
    if not correct:
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Basic"},
        )
