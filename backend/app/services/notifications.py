"""
Servicio mock de notificaciones post-reserva.

Fase 1: log estructurado a stdout.
Fase 2 (futuro): reemplazar _dispatch_* con transporte real
(WhatsApp Business API, Twilio, 360dialog, etc.)

Dos flujos completamente separados:
  - send_client_confirmation: comprobante para el cliente
  - send_business_alert:      aviso/comprobante para el negocio/prestador
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.business import BusinessConfig

logger = logging.getLogger(__name__)


def send_client_confirmation(booking: "Booking", config: "BusinessConfig | None") -> None:
    """
    Envía el comprobante de reserva al cliente.
    Fase 1: log a stdout. Fase 2: enviar por WhatsApp al booking.client_phone.
    """
    logger.info("[notif:cliente] Disparando — booking=%s dest=%s", booking.booking_code, booking.client_phone)

    business_name = config.name if config else "el negocio"
    business_whatsapp = config.whatsapp if config else None

    if not business_whatsapp:
        logger.warning(
            "[notif:cliente] Teléfono del negocio ausente — el comprobante no incluirá link de contacto "
            "(booking=%s)", booking.booking_code,
        )

    lines = [
        "─" * 52,
        f"[MOCK → CLIENTE]  booking={booking.booking_code}",
        f"  Para:      {booking.client_name} ({booking.client_phone})",
        f"  Código:    {booking.booking_code}",
        f"  Servicio:  {booking.service.name}",
        f"  Fecha:     {booking.date}  {str(booking.start_time)[:5]} – {str(booking.end_time)[:5]}",
    ]
    if booking.client_address:
        lines.append(f"  Dirección: {booking.client_address}")
    if booking.notes:
        lines.append(f"  Notas:     {booking.notes}")
    lines.append(f"  Negocio:   {business_name}")
    if business_whatsapp:
        lines.append(f"  Contacto:  wa.me/{business_whatsapp}")
    lines.append("─" * 52)

    logger.info("\n".join(lines))
    logger.info("[notif:cliente] OK — booking=%s", booking.booking_code)


def send_business_alert(booking: "Booking", config: "BusinessConfig | None") -> None:
    """
    Avisa al negocio/prestador sobre una nueva reserva confirmada.
    Fase 1: log a stdout. Fase 2: enviar por WhatsApp al config.whatsapp.
    """
    business_name = config.name if config else "Negocio"
    owner_whatsapp = config.whatsapp if config else None

    if not owner_whatsapp:
        logger.warning(
            "[notif:negocio] Teléfono del negocio ausente — aviso al prestador no se enviará "
            "(booking=%s)", booking.booking_code,
        )
        return

    logger.info("[notif:negocio] Disparando — booking=%s dest=%s", booking.booking_code, owner_whatsapp)

    lines = [
        "─" * 52,
        f"[MOCK → NEGOCIO]  booking={booking.booking_code}",
        f"  Para:      {business_name} ({owner_whatsapp})",
        f"  Código:    {booking.booking_code}",
        f"  Cliente:   {booking.client_name} — {booking.client_phone}",
        f"  Servicio:  {booking.service.name}",
        f"  Fecha:     {booking.date}  {str(booking.start_time)[:5]} – {str(booking.end_time)[:5]}",
    ]
    if booking.client_address:
        lines.append(f"  Domicilio: {booking.client_address}")
    if booking.notes:
        lines.append(f"  Notas:     {booking.notes}")
    lines.append("─" * 52)

    logger.info("\n".join(lines))
    logger.info("[notif:negocio] OK — booking=%s", booking.booking_code)
