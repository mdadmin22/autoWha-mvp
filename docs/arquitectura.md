# Arquitectura — autoWha MVP

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | FastAPI + SQLAlchemy ORM |
| Base de datos | SQLite (dev) — reemplazable por PostgreSQL |
| Migraciones | Alembic |
| Contenedores | Docker + docker-compose |

## Modelos de base de datos

```
BusinessConfig
  id, name, business_type (HOME_SERVICE | FIXED_LOCATION)
  description, whatsapp, instagram, landing_text
  slot_duration_minutes, buffer_minutes

Service
  id, name, duration_minutes, price?, is_active

BusinessHours
  id, day_of_week (0=Lunes..6=Domingo)
  start_time, end_time, is_active

Booking
  id, service_id → Service
  date, start_time, end_time
  client_name, client_phone, client_address?, notes?
  status (confirmed | cancelled), created_at
```

## Flujo de reserva

```
Cliente abre /book
  → elige servicio
  → elige fecha
  → GET /availability?date=&service_id=  → backend calcula slots libres
  → elige horario
  → completa datos personales (+ dirección si HOME_SERVICE)
  → POST /bookings → backend valida y guarda
  → redirige a /booking-confirmed
```

## Lógica de disponibilidad

1. Se obtiene el `BusinessHours` del día de la semana.
2. Se generan todos los posibles starts en intervalos de `slot_duration_minutes`.
3. Se filtran slots donde `[start, start+servicio+buffer)` colisiona con algún booking confirmado.
4. Solo se devuelven los slots libres (el frontend nunca ve los ocupados).

## Regla HOME_SERVICE vs FIXED_LOCATION

La dirección del cliente es obligatoria solo si `business_type = HOME_SERVICE`.
La validación existe en el backend (HTTP 422) y en el frontend (UI).

## Consideraciones para evolución

- **Auth:** agregar JWT en `/admin` (FastAPI OAuth2 + python-jose)
- **DB:** cambiar `DATABASE_URL` a PostgreSQL en producción
- **Notificaciones:** agregar webhook o WhatsApp Business API en `POST /bookings`
- **Multi-profesional:** agregar tabla `Professional` y asociar `Service` y `Booking`
- **Pagos / señas:** agregar `PaymentIntent` y webhook de Mercado Pago
