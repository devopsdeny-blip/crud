import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database import Base, get_db
from src.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_create_note():
    response = client.post(
        "/notes",
        json={"title": "Test Note", "content": "Test Content"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Note"
    assert data["content"] == "Test Content"
    assert "id" in data

def test_create_note_validation_error():
    # Title too long
    response = client.post(
        "/notes",
        json={"title": "a" * 121, "content": "Test Content"},
    )
    assert response.status_code == 422

    # Title empty
    response = client.post(
        "/notes",
        json={"title": "", "content": "Test Content"},
    )
    assert response.status_code == 422

    # Content too long
    response = client.post(
        "/notes",
        json={"title": "Valid Title", "content": "a" * 5001},
    )
    assert response.status_code == 422

def test_list_notes():
    client.post("/notes", json={"title": "Note 1"})
    client.post("/notes", json={"title": "Note 2"})
    
    response = client.get("/notes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Newest first
    assert data[0]["title"] == "Note 2"
    assert data[1]["title"] == "Note 1"

def test_list_notes_search():
    client.post("/notes", json={"title": "Apple"})
    client.post("/notes", json={"title": "Banana"})
    client.post("/notes", json={"title": "Pineapple"})
    
    response = client.get("/notes?q=apple")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2 # Apple and Pineapple
    
    response = client.get("/notes?q=BANANA")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Banana"

def test_get_note():
    create_resp = client.post("/notes", json={"title": "Find Me"})
    note_id = create_resp.json()["id"]
    
    response = client.get(f"/notes/{note_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Find Me"

def test_get_note_not_found():
    response = client.get("/notes/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"

def test_update_note():
    create_resp = client.post("/notes", json={"title": "Old Title"})
    note_id = create_resp.json()["id"]
    
    response = client.put(
        f"/notes/{note_id}",
        json={"title": "New Title", "content": "New Content"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"
    
    # Verify persistence
    get_resp = client.get(f"/notes/{note_id}")
    assert get_resp.json()["title"] == "New Title"

def test_update_note_not_found():
    response = client.put("/notes/999", json={"title": "Title"})
    assert response.status_code == 404

def test_delete_note():
    create_resp = client.post("/notes", json={"title": "Delete Me"})
    note_id = create_resp.json()["id"]
    
    response = client.delete(f"/notes/{note_id}")
    assert response.status_code == 204
    
    # Verify deletion
    get_resp = client.get(f"/notes/{note_id}")
    assert get_resp.status_code == 404

def test_delete_note_not_found():
    response = client.delete("/notes/999")
    assert response.status_code == 404
