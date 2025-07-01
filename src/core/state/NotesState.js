export class NotesState {
    constructor() {
        this.notes = new Map(); // noteId -> Note instance
        this.notesByDate = new Map(); // date -> Set of noteIds
        this.listeners = {
            noteAdded: [],
            noteRemoved: [],
            noteUpdated: [],
            notesCleared: []
        };
    }

    addNote(note) {
        const noteId = this.generateNoteKey(note.date, note.number);
        this.notes.set(noteId, note);
        
        if (!this.notesByDate.has(note.date)) {
            this.notesByDate.set(note.date, new Set());
        }
        this.notesByDate.get(note.date).add(noteId);
        
        this.notifyListeners('noteAdded', { note, noteId });
    }

    removeNote(date, number) {
        const noteId = this.generateNoteKey(date, number);
        const note = this.notes.get(noteId);
        
        if (note) {
            this.notes.delete(noteId);
            
            if (this.notesByDate.has(date)) {
                this.notesByDate.get(date).delete(noteId);
                if (this.notesByDate.get(date).size === 0) {
                    this.notesByDate.delete(date);
                }
            }
            
            this.notifyListeners('noteRemoved', { note, noteId });
        }
        
        return !!note;
    }

    updateNote(note) {
        const noteId = this.generateNoteKey(note.date, note.number);
        if (this.notes.has(noteId)) {
            this.notes.set(noteId, note);
            this.notifyListeners('noteUpdated', { note, noteId });
        }
    }

    getNote(date, number) {
        const noteId = this.generateNoteKey(date, number);
        return this.notes.get(noteId);
    }

    getNotesForDate(date) {
        const noteIds = this.notesByDate.get(date);
        if (!noteIds) return [];
        
        return Array.from(noteIds)
            .map(noteId => this.notes.get(noteId))
            .filter(note => note) // Filter out any undefined notes
            .sort((a, b) => a.number - b.number);
    }

    getAllNotes() {
        return Array.from(this.notes.values());
    }

    clearNotesForDate(date) {
        const noteIds = this.notesByDate.get(date);
        if (noteIds) {
            noteIds.forEach(noteId => {
                this.notes.delete(noteId);
            });
            this.notesByDate.delete(date);
        }
        
        this.notifyListeners('notesCleared', { date });
    }

    clearAllNotes() {
        this.notes.clear();
        this.notesByDate.clear();
        this.notifyListeners('notesCleared', { date: null });
    }

    hasEmptyNoteForDate(date) {
        const notes = this.getNotesForDate(date);
        return notes.some(note => 
            !note.completed && 
            !note.elements.failingIssues.value.trim() &&
            !note.elements.nonFailingIssues.value.trim() &&
            !note.elements.discussion.value.trim() &&
            !note.elements.projectID.value.trim() &&
            !note.elements.attemptID.value.trim()
        );
    }

    hasInProgressNoteForDate(date) {
        const notes = this.getNotesForDate(date);
        return notes.some(note => 
            !note.completed && (
                note.elements.failingIssues.value.trim() ||
                note.elements.nonFailingIssues.value.trim() ||
                note.elements.discussion.value.trim() ||
                note.elements.projectID.value.trim() ||
                note.elements.attemptID.value.trim()
            )
        );
    }

    getCompletedNotesForDate(date) {
        return this.getNotesForDate(date).filter(note => note.completed);
    }

    getIncompleteNotesForDate(date) {
        return this.getNotesForDate(date).filter(note => !note.completed);
    }

    generateNoteKey(date, number) {
        return `${date}_${number}`;
    }

    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    getStats(date) {
        const notes = this.getNotesForDate(date);
        const completed = notes.filter(note => note.completed && !note.canceled);
        
        return {
            total: notes.length,
            completed: completed.length,
            incomplete: notes.filter(note => !note.completed).length,
            canceled: notes.filter(note => note.canceled).length,
            failed: completed.filter(note => 
                note.elements.failingIssues.value.trim() !== ''
            ).length,
            nonFailed: completed.filter(note => 
                note.elements.nonFailingIssues.value.trim() !== '' &&
                note.elements.failingIssues.value.trim() === ''
            ).length,
            noIssue: completed.filter(note => 
                note.elements.failingIssues.value.trim() === '' &&
                note.elements.nonFailingIssues.value.trim() === ''
            ).length
        };
    }
}