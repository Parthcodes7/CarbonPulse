# CarbonPulse AI 🌍

**Intelligent carbon footprint analysis for a sustainable lifestyle.**

---

## Project Structure

```
challenge-3/
├── app.py               # Flask backend – emission calculation engine
├── app.js               # Vanilla JS frontend logic (calls backend)
├── carbon_logic.js      # Offline JS fallback engine (mirrors backend math)
├── index.html           # Main frontend page
├── styles.css           # Styling
├── requirements.txt     # Python dependencies
├── Dockerfile           # Backend → Cloud Run
├── test_app.py          # Pytest suite (34 tests)
└── greenprint/          # React/Vite frontend (alternative UI)
    ├── src/
    ├── Dockerfile
    └── app.yaml         # → App Engine (frontend)
```

---

## Running Locally

### Backend (Flask)

```bash
# Create & activate venv
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # macOS/Linux

pip install -r requirements.txt
python app.py               # → http://127.0.0.1:5000
```

### Frontend

Just open `index.html` in a browser (while the backend is running).

### Tests

```bash
pytest test_app.py -v
```

---

## Deployment

### Backend → Google Cloud Run

```bash
# Set project
gcloud config set project carbonpulse-500106

# Build & push container
gcloud builds submit --tag gcr.io/carbonpulse-500106/carbonpulse-api .

# Deploy to Cloud Run
gcloud run deploy carbonpulse-api \
  --image gcr.io/carbonpulse-500106/carbonpulse-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

### Frontend → Google App Engine

```bash
cd greenprint
npm install
npm run build
gcloud app deploy app.yaml --project carbonpulse-500106
```

### Set Backend URL in Frontend

After Cloud Run deploy completes, copy the service URL and add it to `index.html` before the `<script src="app.js">` tag:

```html
<script>window.CARBONPULSE_API_URL = "https://YOUR-CLOUD-RUN-URL";</script>
<script src="app.js"></script>
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.11 + Flask + Gunicorn |
| Frontend | Vanilla HTML/CSS/JS |
| Alt Frontend | React 19 + Vite + TypeScript |
| Container | Docker |
| Backend Hosting | Google Cloud Run |
| Frontend Hosting | Google App Engine |
| Tests | pytest (34 tests) |
