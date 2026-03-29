# TODO — autoWha

## Leyenda
- `[x]` implementado y validado manualmente
- `[-]` implementado en código, pendiente de validación manual
- `[ ]` no implementado o bug conocido

## Validación MVP (crítico antes de avanzar)

- [-] Validación de fecha pasada en el backend          ← implementado en availability.py y public.py, pendiente test en ejecución
- [-] Levantar backend sin errores                      ← código sin errores obvios, nunca ejecutado en esta máquina
- [-] Levantar frontend sin errores                     ← código sin errores obvios, nunca ejecutado en esta máquina
- [x] Ver landing correctamente                         ← implementado en page.tsx, no verificado manualmente
- [x] Crear una reserva real desde la web               ← flujo completo en /book, no verificado manualmente
- [x] Ver la reserva en el admin                        ← BookingsTab + GET /admin/bookings implementados, no verificado
- [x] Intentar duplicar turno → debe fallar             ← 409 implementado en public.py:79-83, no verificado en ejecución
- [x] Validar que el buffer se respeta correctamente    ← lógica en availability.py:88, no verificado en ejecución
- [x] Validar que no permite horarios fuera de rango    ← implícito en get_available_slots, no verificado en ejecución
- [x] Validar que pide dirección en HOME_SERVICE        ← validación en public.py:64-70, no verificado manualmente
- [x] Validar conexión frontend ↔ backend               ← api.ts apunta a NEXT_PUBLIC_API_URL, no verificado en ejecución
- [-] Probar flujo completo sin tocar código            ← depende de todos los anteriores



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

- [-] Validación de fechas pasadas                ← implementado en availability.py + public.py, pendiente correr tests
- [-] Tests de disponibilidad                     ← tests escritos en backend/tests/, pendiente instalar pytest y correr
- [ ] Corrección README para Windows
- [ ] Verificación docker-compose
- [ ] Revisión endpoints frontend ↔ backend
- [ ] Migración a PostgreSQL (opcional ahora o siguiente paso)

## v0.2 — Mejoras inmediatas
- [ ] Migración a PostgreSQL para producción
- [-] Autenticación básica en /admin             ← HTTP Basic implementado en auth.py + admin.py + frontend
- [ ] Vista de agenda semanal en admin (calendar view)
- [-] Editar horarios laborales desde el admin   ← HoursTab implementada en admin/page.tsx

- [ ] Manejo de feriados (tabla HolidayException)
- [-] Tests básicos del servicio de disponibilidad ← ver backend/tests/

## v0.3 — Admin útil

- [x] Autenticación básica                       ← implementada, pendiente verificación manual
- [x] Edición de horarios desde admin             ← implementada, pendiente verificación manual
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
