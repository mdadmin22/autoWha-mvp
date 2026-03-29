"""
Fixtures compartidas para todos los tests.

Usa una base de datos SQLite en memoria para aislar cada test.
El override de get_db garantiza que FastAPI use la misma DB que el test.
"""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Configurar env antes de importar módulos de la app
os.environ.setdefault("ADMIN_PASSWORD", "testpass")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

# StaticPool garantiza que todas las sesiones usen la misma conexión física,
# lo que hace que compartan la misma base SQLite en memoria.
# Sin esto, cada Session abre una conexión nueva con una DB vacía.
TEST_DB_URL = "sqlite:///:memory:"
engine_test = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture
def db():
    """Sesión de DB aislada. Crea y destruye el schema por cada test."""
    Base.metadata.create_all(bind=engine_test)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def client(db):
    """
    TestClient con get_db sobreescrito para usar la DB de test.
    Requiere que `db` ya esté activo (el schema debe existir).
    """
    def override_get_db():
        db2 = TestingSessionLocal()
        try:
            yield db2
        finally:
            db2.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
