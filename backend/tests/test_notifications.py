"""
Tests unitarios de builders de mensajes y normalización de teléfonos.

No requieren DB, HTTP ni sesión de SQLAlchemy.
Los objetos Booking y BusinessConfig se simulan con SimpleNamespace.
"""
from datetime import date, time
from types import SimpleNamespace

from app.services.phone import normalize_e164
from app.services.notifications import (
    build_customer_booking_receipt,
    build_business_booking_alert,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_booking(**overrides):
    """Booking mínimo válido para tests."""
    service = SimpleNamespace(name="Esmaltado semipermanente")
    defaults = dict(
        booking_code="BWH-TEST1",
        management_token="tok_abc123_opaco",
        client_name="Ana García",
        client_phone="1123456789",
        client_address=None,
        notes=None,
        service=service,
        date=date(2026, 5, 10),
        start_time=time(10, 0),
        end_time=time(11, 0),
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _make_config(**overrides):
    """BusinessConfig mínimo válido para tests."""
    defaults = dict(name="Noelia Nails", whatsapp="+5491123456789")
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


# ── normalize_e164 ────────────────────────────────────────────────────────────

class TestNormalizeE164:
    def test_numero_local_argentina(self):
        assert normalize_e164("1123456789") == "+541123456789"

    def test_numero_e164_completo_sin_cambios(self):
        assert normalize_e164("+5491123456789") == "+5491123456789"

    def test_numero_invalido_retorna_original(self):
        result = normalize_e164("texto-invalido")
        assert result == "texto-invalido"

    def test_cadena_vacia_retorna_original(self):
        assert normalize_e164("") == ""

    def test_no_lanza_excepcion_con_entrada_rara(self):
        # Nunca debe propagar excepción
        result = normalize_e164("???##!!!")
        assert isinstance(result, str)


# ── build_customer_booking_receipt ────────────────────────────────────────────

class TestBuildCustomerBookingReceipt:
    def test_contiene_codigo_nombre_y_servicio(self):
        msg = build_customer_booking_receipt(_make_booking(), _make_config(), None)
        assert "BWH-TEST1" in msg
        assert "Ana García" in msg
        assert "Esmaltado semipermanente" in msg

    def test_contiene_fecha_y_hora(self):
        msg = build_customer_booking_receipt(_make_booking(), _make_config(), None)
        assert "2026-05-10" in msg
        assert "10:00" in msg

    def test_incluye_link_gestion_con_token_y_frontend_url(self):
        booking = _make_booking(management_token="tok_xyz_secreto")
        msg = build_customer_booking_receipt(booking, _make_config(), "http://localhost:3000")
        assert "tok_xyz_secreto" in msg
        assert "localhost:3000/booking/manage" in msg

    def test_omite_link_gestion_sin_frontend_url(self):
        booking = _make_booking(management_token="tok_xyz_secreto")
        msg = build_customer_booking_receipt(booking, _make_config(), None)
        assert "tok_xyz_secreto" not in msg
        assert "/booking/manage" not in msg

    def test_omite_link_gestion_sin_management_token(self):
        booking = _make_booking(management_token=None)
        msg = build_customer_booking_receipt(booking, _make_config(), "http://localhost:3000")
        assert "/booking/manage" not in msg

    def test_incluye_direccion_si_presente(self):
        booking = _make_booking(client_address="Av. Corrientes 1234")
        msg = build_customer_booking_receipt(booking, _make_config(), None)
        assert "Av. Corrientes 1234" in msg

    def test_omite_seccion_direccion_si_ausente(self):
        booking = _make_booking(client_address=None)
        msg = build_customer_booking_receipt(booking, _make_config(), None)
        assert "Dirección" not in msg

    def test_incluye_link_contacto_si_negocio_tiene_whatsapp(self):
        msg = build_customer_booking_receipt(_make_booking(), _make_config(), None)
        assert "wa.me/" in msg

    def test_omite_link_contacto_si_whatsapp_ausente(self):
        config = _make_config(whatsapp=None)
        msg = build_customer_booking_receipt(_make_booking(), config, None)
        assert "wa.me/" not in msg

    def test_sin_none_literal_en_mensaje(self):
        """Ningún campo None debe aparecer como texto 'None'."""
        booking = _make_booking(client_address=None, notes=None, management_token=None)
        config = _make_config(whatsapp=None)
        msg = build_customer_booking_receipt(booking, config, None)
        assert "None" not in msg

    def test_config_none_no_rompe(self):
        msg = build_customer_booking_receipt(_make_booking(), None, None)
        assert "BWH-TEST1" in msg
        assert "None" not in msg


# ── build_business_booking_alert ─────────────────────────────────────────────

class TestBuildBusinessBookingAlert:
    def test_contiene_datos_del_cliente(self):
        msg = build_business_booking_alert(_make_booking(), _make_config())
        assert "Ana García" in msg
        assert "1123456789" in msg

    def test_contiene_codigo_y_servicio(self):
        msg = build_business_booking_alert(_make_booking(), _make_config())
        assert "BWH-TEST1" in msg
        assert "Esmaltado semipermanente" in msg

    def test_contiene_nombre_del_negocio(self):
        msg = build_business_booking_alert(_make_booking(), _make_config())
        assert "Noelia Nails" in msg

    def test_incluye_domicilio_si_presente(self):
        booking = _make_booking(client_address="Calle Falsa 123")
        msg = build_business_booking_alert(booking, _make_config())
        assert "Calle Falsa 123" in msg

    def test_omite_domicilio_si_ausente(self):
        booking = _make_booking(client_address=None)
        msg = build_business_booking_alert(booking, _make_config())
        assert "Domicilio" not in msg

    def test_sin_none_literal_en_mensaje(self):
        booking = _make_booking(client_address=None, notes=None)
        config = _make_config(whatsapp=None)
        msg = build_business_booking_alert(booking, config)
        assert "None" not in msg

    def test_config_none_no_rompe(self):
        msg = build_business_booking_alert(_make_booking(), None)
        assert "BWH-TEST1" in msg
        assert "None" not in msg
