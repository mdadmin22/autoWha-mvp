# TODO — autoWha

## Leyenda
- `[x]` implementado y validado manualmente
- `[-]` implementado en código, pendiente de validación manual
- `[ ]` no implementado o bug conocido

## Validación MVP (cerrado)

- [x] Validación de fecha pasada en el backend
- [x] Levantar backend sin errores
- [x] Levantar frontend sin errores
- [x] Ver landing correctamente
- [x] Crear una reserva real desde la web
- [x] Ver la reserva en el admin
- [x] Intentar duplicar turno → falla con 409
- [x] Validar que el buffer se respeta correctamente
- [x] Validar que no permite horarios fuera de rango
- [x] Validar que pide dirección en HOME_SERVICE
- [x] Validar conexión frontend ↔ backend
- [x] Probar flujo completo sin tocar código
- [x] Tests de disponibilidad y reservas (14 passed)

## MVP v0.1 (cerrado)

- [x] Estructura monorepo
- [x] Backend FastAPI con modelos y endpoints
- [x] Lógica de disponibilidad sin superposición
- [x] Regla HOME_SERVICE vs FIXED_LOCATION
- [x] Frontend Next.js con landing, reserva y confirmación
- [x] Panel admin básico (reservas, servicios, config)
- [x] Seed de datos demo (Noelia Nails)
- [x] Docker + docker-compose
- [x] README con pasos de ejecución

## v0.2 — Estabilización (en progreso)

- [x] Validación de fechas pasadas (availability.py + public.py)
- [x] Tests de disponibilidad y reservas (backend/tests/, 14 passed)
- [x] Autenticación básica en /admin (HTTP Basic, auth.py)
- [x] Editar horarios laborales desde el admin (HoursTab)
- [ ] Corrección README para Windows
- [ ] Verificación docker-compose funcional
- [ ] Migración a PostgreSQL (opcional, necesario para deploy real)

## v0.3 — Admin útil

- [ ] Vista de agenda semanal en admin (calendar view)
- [ ] Manejo de feriados (tabla HolidayException)

## v0.3 — Notificaciones

- [ ] Mensaje de WhatsApp automático al confirmar turno (WhatsApp Business API o Twilio)
- [ ] Recordatorio automático 24h antes del turno
- [ ] Notificación a la profesional cuando se hace una reserva

## v0.4 — UX mejorada

- [ ] Selector de fecha con calendario visual (react-day-picker)
- [ ] Vista de agenda del día en admin en tiempo real
- [ ] Página pública personalizable (colores, foto de perfil)
- [ ] SEO básico para la landing

## v0.5 — Señas / pagos

- [ ] Pago parcial (seña) via Mercado Pago al reservar
- [ ] Estado de pago en la reserva
- [ ] Comprobante de pago por WhatsApp

## Futuro (post-MVP)

- [ ] Múltiples profesionales en el mismo negocio
- [ ] Cálculo de ruta entre turnos domiciliarios
- [ ] Login de clientes (historial de turnos)
- [ ] Multi-tenant real (varios negocios por instancia)
- [ ] App móvil (React Native / Expo)
