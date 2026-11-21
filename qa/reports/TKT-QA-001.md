# QA Report: TKT-QA-001 (Verification of TKT-BE-002)

- Target Ticket: TKT-BE-002 (Implement FastAPI backend and SQLite database for Notes CRUD)
- Verification Date: 2026-03-31
- Test Runner: `pytest` via `run_tests`
- Smoke Runner: `smoke_test_app`

## Acceptance Criteria Verification

1. **All API endpoints pass functional verification**:
   - `POST /notes` (201 Created): Verified. Returns created note with ID and timestamps.
   - `GET /notes` (200 OK): Verified. Returns list of notes.
   - `GET /notes/{id}` (200 OK / 404 Not Found): Verified. Returns note or 404 when missing.
   - `PUT /notes/{id}` (200 OK / 404 Not Found): Verified. Updates note or 404 when missing.
   - `DELETE /notes/{id}` (204 No Content / 404 Not Found): Verified. Deletes note or 404 when missing.
   *Result: PASS*

2. **Case-insensitive title search `?q=` returns correct filtered list sorted newest first**:
   - Verified via unit tests (`test_list_notes` & `test_list_notes_search`) and API testing. Sorting is newest first (`created_at DESC`), search filter `ilike` works correctly case-insensitively.
   *Result: PASS*

3. **Validation constraints (title 1-120 chars, content max 5000 chars) return 422**:
   - Verified via `test_create_note_validation_error` and Pydantic schema validation (`min_length=1`, `max_length=120` for title, `max_length=5000` for content). Invalid payloads return `422 Unprocessable Entity`.
   *Result: PASS*

4. **Pytest test suite executes cleanly with 100% endpoint coverage**:
   - Ran `pytest` in sandbox via `run_tests`.
   - Result: `10 passed, 3 warnings in 1.90s` (Exit code 0). Covers all CRUD endpoints, search, 404 error handling, and validation errors.
   *Result: PASS*

5. **Smoke Test / UI Integration**:
   - Ran `smoke_test_app` against `src.main:app`. Server started successfully, UI loaded correctly at root (`/`), and `/notes` and `/docs` endpoints responded with `200 OK`.
   *Result: PASS*

## Conclusion
Verdict: **PASS**
