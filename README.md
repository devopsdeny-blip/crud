# Notes API

A simple REST API for managing notes, built with FastAPI and SQLite.

## Project Layout
- `src/`: Backend source code
  - `main.py`: FastAPI application and routes
  - `models.py`: SQLAlchemy database models
  - `schemas.py`: Pydantic models for request/response validation
  - `database.py`: Database connection and session management
  - `crud.py`: CRUD operations
- `tests/`: Pytest test suite
- `requirements.txt`: Project dependencies
- `README.md`: This file

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the App
Start the application using uvicorn:
```bash
uvicorn src.main:app --reload
```

## Running Tests
Execute the test suite using pytest:
```bash
pytest tests/
```
