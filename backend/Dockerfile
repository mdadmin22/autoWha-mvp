FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# El seed NO corre automáticamente para no sobreescribir datos al reiniciar.
# Correrlo manualmente la primera vez:
#   docker compose exec backend python -m app.seed
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
