# ─────────────────────────────────────────────────
# CarbonPulse AI – Flask Backend  (Cloud Run)
# ─────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy source
COPY app.py .

# Cloud Run injects $PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

# Use gunicorn for production — 2 workers is fine for Cloud Run
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 2 --timeout 60 app:app"]
