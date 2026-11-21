# QA Bug / Security Finding Report: TKT-FE-001 Static Mount Security Risk

## Verdict: FAIL (Blocked on Security Finding)

## Finding
- **File Path**: `src/main.py` (Responsible Role: FRONTEND / BACKEND)
- **Description**: `app.mount("/", StaticFiles(directory=".", html=True), name="static")` mounts the entire project root directory (`.`), allowing any client via HTTP to download internal source code files (e.g. `/src/main.py`, `/src/crud.py`, `/src/database.py`, `/src/models.py`, `/src/schemas.py`) and the SQLite database file (`/notes.db`).
- **Expected**: Static file serving should only serve static assets (such as CSS, JS, and index.html) from a dedicated directory (e.g. `static/` or explicit route handlers) without exposing source code or database files.
- **Actual**: All files in the repository root are publicly accessible over HTTP.
