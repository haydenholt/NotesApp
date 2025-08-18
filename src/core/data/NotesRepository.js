import { SecurityUtils } from '../utils/SecurityUtils.js';

export class NotesRepository {
    static getNotesForDate(dateKey) {
        try {
            // Validate the dateKey format for security
            if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                console.warn('Invalid date key format:', dateKey);
                return {};
            }
            
            const data = SecurityUtils.validateStorageData(dateKey);
            return data || {};
        } catch (error) {
            console.error('Error loading notes for date:', dateKey, error);
            return {};
        }
    }

    static saveNotesForDate(dateKey, notes) {
        try {
            // Validate the dateKey format
            if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                console.error('Invalid date key format:', dateKey);
                return false;
            }
            
            // Validate and sanitize the notes object
            if (typeof notes !== 'object' || notes === null) {
                console.error('Invalid notes data type');
                return false;
            }
            
            const sanitizedNotes = {};
            for (const [noteId, noteData] of Object.entries(notes)) {
                // Validate note ID
                if (!/^\d+$/.test(noteId)) {
                    console.warn('Skipping note with invalid ID:', noteId);
                    continue;
                }
                
                // Sanitize note data
                sanitizedNotes[noteId] = SecurityUtils.sanitizeNoteData(noteData);
            }
            
            localStorage.setItem(dateKey, JSON.stringify(sanitizedNotes));
            return true;
        } catch (error) {
            console.error('Error saving notes for date:', dateKey, error);
            return false;
        }
    }

    static saveNote(dateKey, noteId, noteData) {
        // Validate inputs
        if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
            console.error('Invalid date key format:', dateKey);
            return false;
        }
        
        if (!noteId || !/^\d+$/.test(String(noteId))) {
            console.error('Invalid note ID:', noteId);
            return false;
        }
        
        if (!noteData || typeof noteData !== 'object') {
            console.error('Invalid note data');
            return false;
        }
        
        const notes = this.getNotesForDate(dateKey);
        notes[noteId] = SecurityUtils.sanitizeNoteData(noteData);
        return this.saveNotesForDate(dateKey, notes);
    }

    static deleteNote(dateKey, noteId) {
        const notes = this.getNotesForDate(dateKey);
        delete notes[noteId];
        return this.saveNotesForDate(dateKey, notes);
    }

    static getNextNoteNumber(dateKey) {
        const notes = this.getNotesForDate(dateKey);
        let nextNumber = 1;
        while (notes.hasOwnProperty(nextNumber)) {
            nextNumber++;
        }
        return nextNumber;
    }

    static renumberNotes(dateKey) {
        const notes = this.getNotesForDate(dateKey);
        const sortedEntries = Object.entries(notes)
            .sort(([a], [b]) => parseInt(a) - parseInt(b));
        
        if (sortedEntries.length === 0) return true;
        
        const renumberedNotes = {};
        sortedEntries.forEach(([, note], index) => {
            renumberedNotes[index + 1] = note;
        });
        
        return this.saveNotesForDate(dateKey, renumberedNotes);
    }

    static cleanupCorruptNotes(dateKey) {
        const notes = this.getNotesForDate(dateKey);
        let hasChanges = false;
        
        Object.keys(notes).forEach(key => {
            const note = notes[key];
            if (!note || typeof note !== 'object') {
                delete notes[key];
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this.saveNotesForDate(dateKey, notes);
        }
        
        return notes;
    }

    static searchNotes(query) {
        const results = [];
        
        // Sanitize search query
        const sanitizedQuery = SecurityUtils.sanitizeInput(query);
        if (!sanitizedQuery) {
            return results;
        }
        
        const queryLower = sanitizedQuery.toLowerCase();
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
                const notes = this.getNotesForDate(key);
                
                Object.entries(notes)
                    .sort(([a], [b]) => parseInt(b, 10) - parseInt(a, 10))
                    .forEach(([id, note]) => {
                        // Sanitize note fields before searching
                        const projectID = SecurityUtils.sanitizeInput(note.projectID || '').toLowerCase();
                        const attemptID = SecurityUtils.sanitizeInput(note.attemptID || '').toLowerCase();
                        const operationID = SecurityUtils.sanitizeInput(note.operationID || '').toLowerCase();
                        
                        if (projectID.includes(queryLower) || 
                            operationID.includes(queryLower) || 
                            attemptID.includes(queryLower)) {
                            results.push({
                                dateKey: key,
                                id,
                                note,
                                matchesProjectID: projectID.includes(queryLower)
                            });
                        }
                    });
            }
        }
        
        // Sort results by date (most recent first), then by note ID within each date (highest first)
        results.sort((a, b) => {
            // First compare dates (descending order - most recent first)
            const dateCompare = b.dateKey.localeCompare(a.dateKey);
            if (dateCompare !== 0) {
                return dateCompare;
            }
            // If dates are equal, compare note IDs (descending order - highest first)
            return parseInt(b.id, 10) - parseInt(a.id, 10);
        });
        
        return results;
    }

    static getAllCompletedNotes() {
        const allNotes = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
                const notes = this.getNotesForDate(key);
                
                Object.entries(notes).forEach(([id, note]) => {
                    if (note.completed) {
                        allNotes.push({
                            dateKey: key,
                            id,
                            note
                        });
                    }
                });
            }
        }
        
        return allNotes;
    }
}