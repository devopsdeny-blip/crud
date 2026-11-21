# QA verdict for TKT-FE-001: FAIL

src/main.py uses app.mount("/", StaticFiles(directory="."), ...) which exposes source code and database files over HTTP. Expected dedicated static folder or restricted routing. Responsible role: FRONTEND/BACKEND.