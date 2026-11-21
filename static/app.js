/**
 * Notes App - Vanilla JavaScript Logic
 */

// --- State Management ---
let state = {
    notes: [],
    selectedNoteId: null,
    searchQuery: '',
    isLoading: false,
    isSaving: false
};

// --- DOM Elements ---
const elements = {
    notesList: document.getElementById('notes-list'),
    searchInput: document.getElementById('search-input'),
    loadingIndicator: document.getElementById('loading-indicator'),
    emptyState: document.getElementById('empty-state'),
    emptyIcon: document.getElementById('empty-icon'),
    emptyStateTitle: document.getElementById('empty-state-title'),
    emptyStateDesc: document.getElementById('empty-state-desc'),
    createFirstNoteBtn: document.getElementById('create-first-note-btn'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    
    errorBanner: document.getElementById('error-banner'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    closeErrorBtn: document.getElementById('close-error-btn'),
    
    editorForm: document.getElementById('note-editor-form'),
    noteIdInput: document.getElementById('note-id'),
    noteTitleInput: document.getElementById('note-title-input'),
    noteContentInput: document.getElementById('note-content-input'),
    formTitle: document.getElementById('form-title'),
    saveNoteBtn: document.getElementById('save-note-btn'),
    cancelNoteBtn: document.getElementById('cancel-note-btn'),
    deleteNoteBtn: document.getElementById('delete-note-btn'),
    
    titleCharCounter: document.getElementById('title-char-counter'),
    contentCharCounter: document.getElementById('content-char-counter'),
    titleError: document.getElementById('title-error'),
    contentError: document.getElementById('content-error'),
    
    timestampInfo: document.getElementById('timestamp-info'),
    createdAtDisplay: document.getElementById('created-at-display'),
    updatedAtDisplay: document.getElementById('updated-at-display'),
    
    newNoteBtnHeader: document.getElementById('new-note-btn-header'),
    
    deleteModal: document.getElementById('delete-confirm-modal'),
    deleteNoteTitleDisplay: document.getElementById('delete-note-title-display'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    
    appMain: document.getElementById('app-main')
};

// --- API Client ---
const API = {
    async fetchNotes(query = '') {
        const url = query ? `/notes?q=${encodeURIComponent(query)}` : '/notes';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch notes');
        return await response.json();
    },

    async createNote(note) {
        const response = await fetch('/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.[0]?.msg || 'Failed to create note');
        }
        return await response.json();
    },

    async updateNote(id, note) {
        const response = await fetch(`/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.[0]?.msg || 'Failed to update note');
        }
        return await response.json();
    },

    async deleteNote(id) {
        const response = await fetch(`/notes/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete note');
        return true;
    }
};

// --- UI Logic ---

function showLoading(show) {
    state.isLoading = show;
    elements.loadingIndicator.classList.toggle('hidden', !show);
    if (show) {
        elements.notesList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
    }
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorBanner.classList.remove('hidden');
}

function hideError() {
    elements.errorBanner.classList.add('hidden');
}

function updateCharCounters() {
    const titleLen = elements.noteTitleInput.value.length;
    const contentLen = elements.noteContentInput.value.length;
    
    elements.titleCharCounter.textContent = `${titleLen} / 120`;
    elements.contentCharCounter.textContent = `${contentLen} / 5000`;
    
    elements.titleCharCounter.classList.toggle('danger', titleLen >= 120);
    elements.contentCharCounter.classList.toggle('danger', contentLen >= 5000);
    
    // Clear validation errors on input
    elements.noteTitleInput.classList.remove('is-invalid');
    elements.titleError.classList.add('hidden');
    elements.noteContentInput.classList.remove('is-invalid');
    elements.contentError.classList.add('hidden');
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
}

function renderNotesList() {
    elements.notesList.innerHTML = '';
    
    if (state.notes.length === 0) {
        elements.notesList.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
        
        if (state.searchQuery) {
            elements.emptyIcon.textContent = '🔍';
            elements.emptyStateTitle.textContent = 'No matching notes';
            elements.emptyStateDesc.textContent = `No notes found matching "${state.searchQuery}"`;
            elements.createFirstNoteBtn.classList.add('hidden');
            elements.clearSearchBtn.classList.remove('hidden');
        } else {
            elements.emptyIcon.textContent = '📝';
            elements.emptyStateTitle.textContent = 'No notes yet';
            elements.emptyStateDesc.textContent = 'Create your first note to get started';
            elements.createFirstNoteBtn.classList.remove('hidden');
            elements.clearSearchBtn.classList.add('hidden');
        }
        return;
    }

    elements.emptyState.classList.add('hidden');
    elements.notesList.classList.remove('hidden');

    state.notes.forEach(note => {
        const item = document.createElement('div');
        item.className = `note-item ${state.selectedNoteId === note.id ? 'selected' : ''}`;
        item.dataset.id = note.id;
        
        item.innerHTML = `
            <h3 class="note-item-title">${escapeHtml(note.title)}</h3>
            <p class="note-item-preview">${escapeHtml(note.content || 'No content')}</p>
            <span class="note-item-time">${formatRelativeTime(note.updated_at)}</span>
        `;
        
        item.addEventListener('click', () => selectNote(note.id));
        elements.notesList.appendChild(item);
    });
}

function selectNote(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;

    state.selectedNoteId = id;
    
    elements.noteIdInput.value = note.id;
    elements.noteTitleInput.value = note.title;
    elements.noteContentInput.value = note.content || '';
    elements.formTitle.textContent = 'Edit Note';
    
    elements.timestampInfo.classList.remove('hidden');
    elements.createdAtDisplay.textContent = `Created: ${new Date(note.created_at).toLocaleString()}`;
    elements.updatedAtDisplay.textContent = `Updated: ${new Date(note.updated_at).toLocaleString()}`;
    
    elements.deleteNoteBtn.classList.remove('hidden');
    
    // Reset validation states
    elements.noteTitleInput.classList.remove('is-invalid');
    elements.titleError.classList.add('hidden');
    elements.noteContentInput.classList.remove('is-invalid');
    elements.contentError.classList.add('hidden');
    
    updateCharCounters();
    renderNotesList();
    
    // Mobile view toggle
    elements.appMain.classList.add('editor-active');
}

function resetForm() {
    state.selectedNoteId = null;
    elements.editorForm.reset();
    elements.noteIdInput.value = '';
    elements.formTitle.textContent = 'New Note';
    elements.timestampInfo.classList.add('hidden');
    elements.deleteNoteBtn.classList.add('hidden');
    
    // Reset validation states
    elements.noteTitleInput.classList.remove('is-invalid');
    elements.titleError.classList.add('hidden');
    elements.noteContentInput.classList.remove('is-invalid');
    elements.contentError.classList.add('hidden');
    
    updateCharCounters();
    renderNotesList();
    
    // Mobile view toggle
    elements.appMain.classList.add('editor-active');
    elements.noteTitleInput.focus();
}

async function loadNotes(query = '') {
    showLoading(true);
    hideError();
    try {
        state.notes = await API.fetchNotes(query);
        renderNotesList();
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

function validateForm() {
    let isValid = true;
    const title = elements.noteTitleInput.value.trim();
    const content = elements.noteContentInput.value;

    if (!title || title.length > 120) {
        elements.noteTitleInput.classList.add('is-invalid');
        elements.titleError.classList.remove('hidden');
        isValid = false;
    } else {
        elements.noteTitleInput.classList.remove('is-invalid');
        elements.titleError.classList.add('hidden');
    }

    if (content.length > 5000) {
        elements.noteContentInput.classList.add('is-invalid');
        elements.contentError.classList.remove('hidden');
        isValid = false;
    } else {
        elements.noteContentInput.classList.remove('is-invalid');
        elements.contentError.classList.add('hidden');
    }

    return isValid;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    if (state.isSaving) return;

    if (!validateForm()) return;

    const noteData = {
        title: elements.noteTitleInput.value.trim(),
        content: elements.noteContentInput.value.trim() || null
    };

    state.isSaving = true;
    elements.saveNoteBtn.disabled = true;
    elements.saveNoteBtn.textContent = 'Saving...';

    try {
        let savedNote;
        if (state.selectedNoteId) {
            savedNote = await API.updateNote(state.selectedNoteId, noteData);
        } else {
            savedNote = await API.createNote(noteData);
        }
        
        // Refresh list and select the saved note
        await loadNotes(state.searchQuery);
        selectNote(savedNote.id);
    } catch (err) {
        showError(err.message);
    } finally {
        state.isSaving = false;
        elements.saveNoteBtn.disabled = false;
        elements.saveNoteBtn.textContent = 'Save Note';
    }
}

async function handleDeleteConfirm() {
    if (!state.selectedNoteId) return;

    elements.confirmDeleteBtn.disabled = true;
    elements.confirmDeleteBtn.textContent = 'Deleting...';

    try {
        await API.deleteNote(state.selectedNoteId);
        closeDeleteModal();
        state.selectedNoteId = null;
        await loadNotes(state.searchQuery);
        resetForm();
        // On mobile, go back to list after delete
        elements.appMain.classList.remove('editor-active');
    } catch (err) {
        showError(err.message);
        closeDeleteModal();
    } finally {
        elements.confirmDeleteBtn.disabled = false;
        elements.confirmDeleteBtn.textContent = 'Delete Note';
    }
}

function openDeleteModal() {
    const note = state.notes.find(n => n.id === state.selectedNoteId);
    if (!note) return;
    
    elements.deleteNoteTitleDisplay.textContent = note.title;
    elements.deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    elements.deleteModal.classList.add('hidden');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Debounce Helper ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- Event Listeners ---

elements.searchInput.addEventListener('input', debounce((e) => {
    state.searchQuery = e.target.value;
    loadNotes(state.searchQuery);
}, 250));

elements.editorForm.addEventListener('submit', handleFormSubmit);

elements.noteTitleInput.addEventListener('input', updateCharCounters);
elements.noteContentInput.addEventListener('input', updateCharCounters);

elements.newNoteBtnHeader.addEventListener('click', resetForm);
elements.createFirstNoteBtn.addEventListener('click', resetForm);

elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    loadNotes();
});

elements.cancelNoteBtn.addEventListener('click', () => {
    if (state.selectedNoteId) {
        selectNote(state.selectedNoteId);
    } else {
        resetForm();
    }
    // Mobile: go back to list
    elements.appMain.classList.remove('editor-active');
});

elements.deleteNoteBtn.addEventListener('click', openDeleteModal);
elements.confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);

elements.closeErrorBtn.addEventListener('click', hideError);
elements.retryBtn.addEventListener('click', () => loadNotes(state.searchQuery));

// Close modal on backdrop click
elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal();
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.deleteModal.classList.contains('hidden')) {
        closeDeleteModal();
    }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
});
