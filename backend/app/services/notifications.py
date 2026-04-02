"""
Servicio de notificaciones post-reserva.

Fase 1/2: mock (log a stdout).
Fase 3 (futuro): reemplazar _dispatch_whatsapp / _dispatch_email
con el transporte real del provider elegido (Twilio, 360dialog, etc.)

Estructura:
  Builders  — funciones puras, sin side effects, testeables sin DB ni HTTP
  Dispatchers — encapsulan el "envío" (hoy: logger.info)
  API pública — send_client_confirmation / send_business_alert
                (firmas estables; el router no las toca)
"""
from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING

from app.services.phone import normalize_e164

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.business import BusinessConfig

logger = logging.getLogger(__name__)


# ── Builders ──────────────────────────────────────────────────────────────────
# Funciones puras: reciben objetos ya cargados, retornan str, no tienen
# side effects. Permiten testear el contenido del mensaje sin infraestructura.

def build_customer_booking_receipt(
    booking: "Booking",
    config: "BusinessConfig | None",
    frontend_url: str | None,
) -> str:
    """
    Construye el texto del comprobante para el cliente.
    Incluye link de gestión solo si frontend_url y management_token están disponibles.
    """
    business_name = config.name if config else "el negocio"
    business_whatsapp = config.whatsapp if config else None

    lines = [
        "─" * 52,
        f"[COMPROBANTE CLIENTE]  código={booking.booking_code}",
        f"  Nombre:    {booking.client_name}",
        f"  Teléfono:  {booking.client_phone}",
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
    if frontend_url and getattr(booking, "management_token", None):
        lines.append(f"  Gestión:   {frontend_url}/booking/manage?token={booking.management_token}")
    lines.append("─" * 52)

    return "\n".join(lines)


def build_business_booking_alert(
    booking: "Booking",
    config: "BusinessConfig | None",
) -> str:
    """
    Construye el texto del aviso de nueva reserva para el negocio/prestador.
    """
    business_name = config.name if config else "Negocio"
    owner_whatsapp = config.whatsapp if config else None

    lines = [
        "─" * 52,
        f"[AVISO NEGOCIO]  código={booking.booking_code}",
        f"  Negocio:   {business_name}",
        f"  WhatsApp:  {owner_whatsapp or '(no configurado)'}",
        f"  Cliente:   {booking.client_name} — {booking.client_phone}",
        f"  Servicio:  {booking.service.name}",
        f"  Fecha:     {booking.date}  {str(booking.start_time)[:5]} – {str(booking.end_time)[:5]}",
    ]
    if booking.client_address:
        lines.append(f"  Domicilio: {booking.client_address}")
    if booking.notes:
        lines.append(f"  Notas:     {booking.notes}")
    lines.append("─" * 52)

    return "\n".join(lines)


# ── Dispatchers mock ──────────────────────────────────────────────────────────
# Encapsulan el canal de envío. Reemplazar el cuerpo en fase 3 con el
# cliente HTTP del provider real; la firma no cambia.

def _dispatch_whatsapp(phone: str, message: str, label: str) -> None:
    """Mock: loguea el mensaje como si se enviara por WhatsApp al número dado."""
    logger.info("[MOCK:whatsapp → %s]  dest=%s\n%s", label, phone, message)


def _dispatch_email(address: str, message: str, label: str) -> None:
    """Stub de canal email — disponible para fase 3. Por ahora solo loguea."""
    logger.info("[MOCK:email → %s]  dest=%s\n%s", label, address, message)


# ── API pública ───────────────────────────────────────────────────────────────
# Firmas estables. El router (public.py) llama a estas dos funciones
# dentro de un try/except y nunca las toca directamente.

def send_client_confirmation(booking: "Booking", config: "BusinessConfig | None") -> None:
    """
    Envía el comprobante de reserva al cliente.
    Canal actual: WhatsApp mock.
    Fase 3: reemplazar _dispatch_whatsapp con provider real.
    """
    logger.info(
        "[notif:cliente] Disparando — booking=%s dest=%s",
        booking.booking_code, booking.client_phone,
    )

    if not (config and config.whatsapp):
        logger.warning(
            "[notif:cliente] Teléfono del negocio ausente — "
            "comprobante sin link de contacto (booking=%s)", booking.booking_code,
        )

    frontend_url = os.getenv("FRONTEND_URL")
    message = build_customer_booking_receipt(booking, config, frontend_url)
    phone = normalize_e164(booking.client_phone)
    _dispatch_whatsapp(phone, message, "cliente")

    logger.info("[notif:cliente] OK — booking=%s", booking.booking_code)


def send_business_alert(booking: "Booking", config: "BusinessConfig | None") -> None:
    """
    Avisa al negocio/prestador sobre una nueva reserva confirmada.
    Canal actual: WhatsApp mock.
    Fase 3: reemplazar _dispatch_whatsapp con provider real.
    """
    owner_whatsapp = config.whatsapp if config else None

    if not owner_whatsapp:
        logger.warning(
            "[notif:negocio] Teléfono del negocio ausente — "
            "aviso al prestador no se enviará (booking=%s)", booking.booking_code,
        )
        return

    logger.info(
        "[notif:negocio] Disparando — booking=%s dest=%s",
        booking.booking_code, owner_whatsapp,
    )

    message = build_business_booking_alert(booking, config)
    phone = normalize_e164(owner_whatsapp)
    _dispatch_whatsapp(phone, message, "negocio")

    logger.info("[notif:negocio] OK — booking=%s", booking.booking_code)
