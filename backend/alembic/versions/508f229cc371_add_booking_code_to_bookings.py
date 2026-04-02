"""add_booking_code_to_bookings

Revision ID: 508f229cc371
Revises: 
Create Date: 2026-04-01 22:20:01.727347

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '508f229cc371'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Agregar la columna como nullable para no romper filas existentes
    op.add_column('bookings', sa.Column('booking_code', sa.String(length=20), nullable=True))

    # 2. Backfill: generar códigos únicos para cualquier fila que ya exista
    import secrets
    import string
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id FROM bookings WHERE booking_code IS NULL")).fetchall()
    alphabet = string.ascii_uppercase + string.digits
    for row in rows:
        code = "BWH-" + "".join(secrets.choice(alphabet) for _ in range(6))
        bind.execute(
            sa.text("UPDATE bookings SET booking_code = :code WHERE id = :id"),
            {"code": code, "id": row[0]},
        )

    # 3. batch_alter_table: hace recreación de tabla (necesario en SQLite
    #    para imponer NOT NULL y unique en una columna ya existente)
    with op.batch_alter_table("bookings") as batch_op:
        batch_op.alter_column("booking_code", nullable=False)
        batch_op.create_unique_constraint("uq_bookings_booking_code", ["booking_code"])


def downgrade() -> None:
    with op.batch_alter_table("bookings") as batch_op:
        batch_op.drop_constraint("uq_bookings_booking_code", type_="unique")
        batch_op.drop_column("booking_code")
