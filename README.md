# autoWha — Sistema de Turnos MVP

Sistema de reservas online para profesionales independientes.
Caso inicial: servicios de uñas a domicilio. Adaptable a local fijo.

---

## Inicio rápido — Sin Docker (recomendado para desarrollo)

> Probado en Windows 10/11 con Git Bash, CMD y PowerShell.

cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

cd frontend
npm run dev


### Backend

### **Git Bash / Linux / macOS:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed        # carga datos demo (solo la primera vez)
uvicorn app.main:app --reload --port 8000
```
### Nota sobre base de datos

El proyecto usa SQLite en desarrollo.  
El archivo de base de datos se crea automáticamente en:

backend/autoWha.db

Si querés reiniciar desde cero, podés borrar ese archivo y volver a ejecutar el seed.

### **Windows CMD:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

### **Windows PowerShell:**
```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

> Si PowerShell bloquea la activación del venv, ejecutar primero:
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

API disponible en: http://localhost:8000
Docs interactiva: http://localhost:8000/docs

---

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variable de entorno (apunta al backend local)
# Git Bash / macOS / Linux:
cp .env.example .env.local

# Windows CMD:
# copy .env.example .env.local

# Windows PowerShell:
# Copy-Item .env.example .env.local

npm run dev
```

App disponible en: http://localhost:3000

---

## Inicio rápido — Con Docker

> Docker Compose levanta backend + frontend con un solo comando.
> La base de datos SQLite se persiste en un volumen Docker entre reinicios.

```bash
cd infra

# Primera vez: construir imágenes y levantar
docker compose up --build

# Cargar datos demo (solo la primera vez, en otra terminal)
docker compose exec backend python -m app.seed

# Arranques posteriores (sin reconstruir)
docker compose up
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Docs API: http://localhost:8000/docs

### Cambiar la URL del backend en Docker

Si el backend está en otro host (producción, servidor remoto), reconstruir con:

```bash
NEXT_PUBLIC_API_URL=https://api.tudominio.com docker compose up --build
```

O editar directamente `infra/docker-compose.yml` → `services.frontend.build.args.NEXT_PUBLIC_API_URL`.

> **Por qué `args` y no `environment`:** Next.js incrusta las variables `NEXT_PUBLIC_*` en el bundle
> durante `npm run build` (build time). Si solo se pasan como env vars del contenedor, llegan
> demasiado tarde y la variable queda vacía en el código compilado.

---

## El seed — cómo funciona

El seed (`backend/app/seed.py`) es **idempotente**: si ya existen datos en la base de datos,
no hace nada y no modifica nada. Es seguro correrlo varias veces.

- Primera ejecución: inserta "Noelia Nails", 5 servicios y horarios demo.
- Ejecuciones posteriores: muestra un aviso y sale sin tocar nada.
- Las reservas existentes **nunca** son eliminadas por el seed.

Para empezar desde cero (solo en desarrollo), borrar la base de datos y re-correr el seed:

```bash
# Sin Docker
rm backend/autoWha.db     # Git Bash / Linux / macOS
del backend\autoWha.db    # Windows CMD
python -m app.seed

# Con Docker
docker compose down -v    # elimina el volumen con la DB
docker compose up --build
docker compose exec backend python -m app.seed
```

---

## URLs

| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública del negocio |
| `/book` | Formulario de reserva |
| `/booking-confirmed` | Confirmación de turno |
| `/admin` | Panel de administración |

---

## Estructura del proyecto

```
autoWha/
├── backend/
│   ├── app/
│   │   ├── main.py              # Punto de entrada FastAPI
│   │   ├── database.py          # Configuración SQLAlchemy
│   │   ├── seed.py              # Datos demo (idempotente)
│   │   ├── models/              # Modelos ORM
│   │   ├── schemas/             # Esquemas Pydantic
│   │   ├── routers/             # Endpoints (public + admin)
│   │   └── services/            # Lógica de disponibilidad
│   ├── alembic/                 # Migraciones (sin baseline aún)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Páginas (App Router)
│   │   ├── components/          # Componentes reutilizables
│   │   ├── lib/                 # Cliente API
│   │   └── types/               # Tipos TypeScript
│   ├── package.json
│   └── Dockerfile
├── infra/
│   └── docker-compose.yml
├── docs/
│   └── arquitectura.md
└── README.md
```

---

## Endpoints principales

### Públicos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/business-config` | Configuración del negocio |
| GET | `/services` | Servicios activos |
| GET | `/availability?date=&service_id=` | Slots disponibles |
| POST | `/bookings` | Crear reserva |

### Admin
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/bookings?date=` | Listar reservas |
| PATCH | `/admin/bookings/{id}/cancel` | Cancelar reserva |
| GET/POST | `/admin/services` | Listar / crear servicios |
| PUT | `/admin/services/{id}` | Editar servicio |
| GET/PUT | `/admin/business-config` | Ver / editar configuración |
| GET/PUT | `/admin/business-hours` | Ver / editar horarios |

---

## Datos demo incluidos

El seed carga:

- **Negocio:** Noelia Nails (HOME\_SERVICE)
- **Servicios:** Esmaltado, Esculpidas, Kapping, Retoque, Manicura express
- **Horarios:** Lunes–Viernes 9:00–19:00 · Sábado 9:00–14:00 · Domingo cerrado
- **Buffer entre turnos:** 15 minutos

---

## Base de datos

En desarrollo se usa **SQLite** (archivo `backend/autoWha.db`). No requiere instalar nada.
Las tablas se crean automáticamente al arrancar el backend si no existen.

Para migrar a PostgreSQL en producción: cambiar `DATABASE_URL` en `.env` y ejecutar `alembic upgrade head` (requiere generar el baseline primero — ver `docs/arquitectura.md`).

---

## Próximos pasos

Ver `TODO.md` para el detalle completo.
