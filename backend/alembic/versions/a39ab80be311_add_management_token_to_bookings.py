"""add_management_token_to_bookings

Revision ID: a39ab80be311
Revises: 508f229cc371
Create Date: 2026-04-02 03:05:41.403920

"""
from typing import Sequence, Union
import secrets
from alembic import op
import sqlalchemy as sa


revision: str = 'a39ab80be311'
down_revision: Union[str, None] = '508f229cc371'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Agregar nullable para no romper filas existentes
    op.add_column('bookings', sa.Column('management_token', sa.String(length=64), nullable=True))

    # 2. Backfill: token opaco único para cada fila existente
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id FROM bookings WHERE management_token IS NULL")).fetchall()
    for row in rows:
        token = secrets.token_urlsafe(32)
        bind.execute(
            sa.text("UPDATE bookings SET management_token = :token WHERE id = :id"),
            {"token": token, "id": row[0]},
        )

    # 3. batch_alter_table: impone NOT NULL + unique (necesario en SQLite)
    with op.batch_alter_table("bookings") as batch_op:
        batch_op.alter_column("management_token", nullable=False)
        batch_op.create_unique_constraint("uq_bookings_management_token", ["management_token"])


def downgrade() -> None:
    with op.batch_alter_table("bookings") as batch_op:
        batch_op.drop_constraint("uq_bookings_management_token", type_="unique")
        batch_op.drop_column("management_token")
