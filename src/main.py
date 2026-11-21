from typing import List, Optional
import os
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notes API")

# API Routes
@app.post("/notes", response_model=schemas.NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    return crud.create_note(db=db, note=note)

@app.get("/notes", response_model=List[schemas.NoteResponse])
def list_notes(q: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return crud.get_notes(db, q=q)

@app.get("/notes/{id}", response_model=schemas.NoteResponse)
def get_note(id: int, db: Session = Depends(get_db)):
    db_note = crud.get_note(db, note_id=id)
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@app.put("/notes/{id}", response_model=schemas.NoteResponse)
def update_note(id: int, note: schemas.NoteUpdate, db: Session = Depends(get_db)):
    db_note = crud.update_note(db, note_id=id, note=note)
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@app.delete("/notes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(id: int, db: Session = Depends(get_db)):
    success = crud.delete_note(db, note_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    return None

# Serve Static Files
@app.get("/")
async def read_index():
    return FileResponse("index.html")

# Mount static files (styles.css, app.js)
# Note: This should be after API routes to avoid shadowing them if using "/"
app.mount("/", StaticFiles(directory=".", html=True), name="static")
