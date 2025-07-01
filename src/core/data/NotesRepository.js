export class NotesRepository {
    static getNotesForDate(dateKey) {
        try {
            const data = localStorage.getItem(dateKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading notes for date:', dateKey, error);
            return {};
        }
    }

    static saveNotesForDate(dateKey, notes) {
        try {
            localStorage.setItem(dateKey, JSON.stringify(notes));
            return true;
        } catch (error) {
            console.error('Error saving notes for date:', dateKey, error);
            return false;
        }
    }

    static saveNote(dateKey, noteId, noteData) {
        const notes = this.getNotesForDate(dateKey);
        notes[noteId] = noteData;
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
        const queryLower = query.toLowerCase();
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
                const notes = this.getNotesForDate(key);
                
                Object.entries(notes)
                    .sort(([a], [b]) => parseInt(b, 10) - parseInt(a, 10))
                    .forEach(([id, note]) => {
                        const projectID = (note.projectID || '').toLowerCase();
                        const attemptID = (note.attemptID || '').toLowerCase();
                        const operationID = (note.operationID || '').toLowerCase();
                        
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