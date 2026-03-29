"""
Punto de entrada de la aplicación FastAPI.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import public, admin

# Importar modelos para que create_all los detecte
import app.models  # noqa: F401

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Crea las tablas al arrancar si no existen (dev con SQLite)."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AutoWha — Sistema de Turnos",
    description="MVP de gestión de turnos para profesionales independientes",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rutas ─────────────────────────────────────
app.include_router(public.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
