# TODO — autoWha

## Validación MVP (crítico antes de avanzar)

- [ ] Validación de fecha pasada en el backend
- [ ] Levantar backend sin errores
- [ ] Levantar frontend sin errores
- [ ] Ver landing correctamente
- [ ] Crear una reserva real desde la web
- [ ] Ver la reserva en el admin
- [ ] Intentar duplicar turno → debe fallar
- [ ] Validar que el buffer se respeta correctamente
- [ ] Validar que no permite horarios fuera de rango
- [ ] Validar que pide dirección en HOME_SERVICE
- [ ] Validar conexión frontend ↔ backend
- [ ] Probar flujo completo sin tocar código



## MVP v0.1 (listo)
- [x] Estructura monorepo
- [x] Backend FastAPI con modelos y endpoints
- [x] Lógica de disponibilidad sin superposición
- [x] Regla HOME_SERVICE vs FIXED_LOCATION
- [x] Frontend Next.js con landing, reserva y confirmación
- [x] Panel admin básico (reservas, servicios, config)
- [x] Seed de datos demo (Noelia Nails)
- [x] Docker + docker-compose
- [x] README con pasos de ejecución

## v0.2 - Estabilización del sistema

- [ ] Validación de fechas pasadas
- [ ] Tests de disponibilidad
- [ ] Corrección README para Windows
- [ ] Verificación docker-compose
- [ ] Revisión endpoints frontend ↔ backend
- [ ] Migración a PostgreSQL (opcional ahora o siguiente paso)

## v0.2 — Mejoras inmediatas
- [ ] Migración a PostgreSQL para producción
- [ ] Autenticación básica en /admin (usuario + contraseña, JWT)
- [ ] Vista de agenda semanal en admin (calendar view)
- [ ] Editar horarios laborales desde el admin

- [ ] Manejo de feriados (tabla HolidayException)
- [ ] Tests básicos del servicio de disponibilidad

## v0.3 — Admin útil

- [ ] Autenticación básica
- [ ] Edición de horarios desde admin
- [ ] Vista de agenda semanal

## v0.3 — Notificaciones
- [ ] Mensaje de WhatsApp automático al confirmar turno
  (via WhatsApp Business API o Twilio)
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
