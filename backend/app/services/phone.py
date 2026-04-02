"""
Utilidades de normalización de teléfonos.

Convierte números en cualquier formato local al estándar E.164
(ej: "1123456789" → "+541123456789" con región AR).

La función nunca lanza excepción: si el número no puede parsearse,
retorna el valor original y emite un WARNING.
"""
import logging

import phonenumbers
from phonenumbers import NumberParseException, PhoneNumberFormat

logger = logging.getLogger(__name__)


def normalize_e164(raw: str, default_region: str = "AR") -> str:
    """
    Normaliza un número de teléfono al formato E.164.

    Parámetros:
        raw:            número en cualquier formato (local, internacional, con espacios, etc.)
        default_region: región ISO 3166-1 alfa-2 para parsear números sin prefijo de país.
                        Default "AR" (Argentina).

    Retorna:
        Número en formato E.164 ("+54...") si el parseo es exitoso y el número es válido.
        El valor original `raw` si no puede parsearse o no es un número válido.
    """
    if not raw:
        return raw
    try:
        parsed = phonenumbers.parse(raw, default_region)
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, PhoneNumberFormat.E164)
    except NumberParseException:
        pass
    logger.warning("[phone] No se pudo normalizar '%s' a E.164 — se usa tal cual", raw)
    return raw
