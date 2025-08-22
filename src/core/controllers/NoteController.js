import { NotesRepository } from '../data/NotesRepository.js';
import { NotesState } from '../state/NotesState.js';
import Note from '../../ui/components/Note.js';

export class NoteController {
    constructor(appState, themeManager) {
        this.appState = appState;
        this.themeManager = themeManager;
        this.notesState = new NotesState();
        
        this.listeners = {
            noteCreated: [],
            noteCompleted: [],
            noteDeleted: [],
            noteEdited: [],
            notesClearing: []
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listeners are set up in NoteApp to coordinate view updates
        // No direct date change handling here to avoid duplicate loading
    }

    async loadNotesForDate(date) {
        // Clear state first
        this.notesState.clearNotesForDate(date);
        
        const savedNotes = await NotesRepository.cleanupCorruptNotes(date);
        const sortedNotes = Object.entries(savedNotes)
            .sort(([a], [b]) => parseInt(a) - parseInt(b));

        if (sortedNotes.length === 0) {
            this.createNewNote(1, date);
        } else {
            sortedNotes.forEach(([id, noteData]) => {
                const note = this.createNewNote(parseInt(id), date);
                // Restore the note's state from saved data
                this.restoreNoteFromData(note, noteData);
            });

            const allCompleted = sortedNotes.every(([, note]) => note.completed);
            if (allCompleted) {
                const nextNumber = await NotesRepository.getNextNoteNumber(date);
                this.createNewNote(nextNumber, date);
            }
        }
        
        // Refresh display indices after all notes are loaded to handle canceled notes correctly
        this.refreshDisplayIndices(date);

        return this.notesState.getNotesForDate(date);
    }

    async reloadNotesForDate(date) {
        // Clear the view first to prevent duplication
        this.notifyListeners('notesClearing', { date });
        
        // Then reload notes
        return this.loadNotesForDate(date);
    }

    createNewNote(number, date = null) {
        const noteDate = date || this.appState.getCurrentDate();
        const displayIndex = this.calculateDisplayIndex(noteDate, number);
        
        const note = new Note(number, noteDate, displayIndex, {
            enableEditing: this.enableNoteEditing.bind(this),
            completeEditing: this.completeNoteEditing.bind(this),
            deleteNote: this.deleteNote.bind(this),
            markEditing: this.markNoteAsEditing.bind(this)
        }, this.themeManager);

        this.notesState.addNote(note);
        this.notifyListeners('noteCreated', { note, date: noteDate });
        
        return note;
    }

    restoreNoteFromData(note, noteData) {
        if (!note || !noteData) return;

        // Restore form field values
        if (note.elements) {
            if (noteData.discussion !== undefined) {
                note.elements.discussion.value = noteData.discussion || '';
            }
            if (noteData.projectID !== undefined) {
                note.elements.projectID.value = noteData.projectID || '';
            }
            if (noteData.attemptID !== undefined) {
                note.elements.attemptID.value = noteData.attemptID || '';
            }
            if (noteData.operationID !== undefined) {
                note.elements.operationID.value = noteData.operationID || '';
            }
            if (noteData.failingIssues !== undefined) {
                note.elements.failingIssues.value = noteData.failingIssues || '';
            }
            if (noteData.nonFailingIssues !== undefined) {
                note.elements.nonFailingIssues.value = noteData.nonFailingIssues || '';
            }
        }

        // Restore note state
        note.completed = noteData.completed || false;
        note.canceled = noteData.canceled || false;
        
        // Update the number display if the note is canceled
        if (note.canceled && note.updateNumberDisplay) {
            note.updateNumberDisplay();
        }

        // Restore timer state
        if (note.timer) {
            note.timer.startTimestamp = noteData.startTimestamp || null;
            note.timer.endTimestamp = noteData.endTimestamp || null;
            note.timer.hasStarted = noteData.hasStarted || false;
            note.timer.completed = noteData.completed || false;
            note.timer.additionalTime = noteData.additionalTime || 0;
            
            // Restart display updates if timer is running (has started but not ended)
            if (note.timer.startTimestamp && !note.timer.endTimestamp && !note.timer.completed) {
                note.timer.startDisplay();
            }
        }

        // Update visual state based on completion
        if (noteData.completed) {
            note.updateToCompletedState(noteData.canceled || false);
        }
    }

    calculateDisplayIndex(date, number) {
        const notes = this.notesState.getNotesForDate(date);
        return notes.filter(n => !n.canceled && n.number < number).length + 1;
    }

    refreshDisplayIndices(date) {
        const notes = this.notesState.getNotesForDate(date);
        let displayCounter = 1;
        
        // Sort notes by number to process them in order
        const sortedNotes = notes.sort((a, b) => a.number - b.number);
        
        sortedNotes.forEach(note => {
            if (!note.canceled) {
                // Update the number display for non-canceled notes
                this.updateNoteDisplayNumber(note, displayCounter);
                displayCounter++;
            } else {
                // Update the number display for canceled notes to show "Cancelled"
                this.updateNoteDisplayNumber(note, null);
            }
        });
    }

    updateNoteDisplayNumber(note, displayIndex) {
        if (!note) return;
        
        // Update the note's displayIndex and call its updateNumberDisplay method
        if (displayIndex !== null) {
            note.displayIndex = displayIndex;
        }
        
        // Use the note's own updateNumberDisplay method if available
        if (note.updateNumberDisplay) {
            note.updateNumberDisplay();
        }
    }

    enableNoteEditing(number) {
        const date = this.appState.getCurrentDate();
        const note = this.notesState.getNote(date, number);
        if (!note || !note.completed) return;

        this.appState.markNoteAsEditing(number);
        
        note.updateToEditingState();
        note.completed = false;
        note.timer.completed = false;
        note.timer.hasStarted = true;
        note.timer.restart();

        this.updateNoteInStorage(note);
        this.notesState.updateNote(note);
        this.notifyListeners('noteEdited', { note, action: 'enableEditing' });
    }

    completeNoteEditing(number, canceled = false) {
        const date = this.appState.getCurrentDate();
        const note = this.notesState.getNote(date, number);
        if (!note) return;

        const isCanceled = canceled || note.canceled;
        
        note.updateToCompletedState(isCanceled);
        note.completed = true;
        note.canceled = isCanceled;
        note.timer.completed = true;
        
        if (!note.timer.endTimestamp && note.timer.hasStarted) {
            note.timer.stop();
        }
        note.timer.hasStarted = true;

        this.updateNoteInStorage(note);
        this.notesState.updateNote(note);
        this.appState.clearNoteEditing(number);
        
        this.notifyListeners('noteCompleted', { note, canceled: isCanceled });

        // If note was canceled, refresh display indices for all notes
        if (isCanceled) {
            this.refreshDisplayIndices(date);
        }

        if (!this.appState.getSearchState().isActive) {
            this.checkAndCreateNewNote(date).catch(console.error);
        }
    }

    async checkAndCreateNewNote(date) {
        const hasInProgress = this.notesState.hasInProgressNoteForDate(date);
        const hasEmpty = this.notesState.hasEmptyNoteForDate(date);
        
        if (!hasEmpty && !hasInProgress) {
            const nextNumber = await NotesRepository.getNextNoteNumber(date);
            const newNote = this.createNewNote(nextNumber, date);
            this.notifyListeners('noteCreated', { 
                note: newNote, 
                date, 
                autoCreated: true 
            });
        }
    }

    async deleteNote(number) {
        const date = this.appState.getCurrentDate();
        const note = this.notesState.getNote(date, number);
        if (!note) return false;

        // Store current scroll position
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        try {
            // Remove from storage and renumber (await these operations)
            await NotesRepository.deleteNote(date, number);
            await NotesRepository.renumberNotes(date);
            
            // Clear all notes from memory state
            this.notesState.clearNotesForDate(date);
            
            // Notify that notes are clearing (this will clear the DOM)
            this.notifyListeners('notesClearing', { date });
            
            // Reload notes with the new numbering
            await this.loadNotesForDate(date);
            
        } catch (error) {
            console.error('Error deleting note:', error);
            return false;
        }
        
        // Notify listeners with the note being deleted
        this.notifyListeners('noteDeleted', { note, date, number });
        
        // Restore scroll position after a brief delay to allow DOM updates
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 50);
        
        return true;
    }


    markNoteAsEditing(number) {
        this.appState.markNoteAsEditing(number);
    }

    updateNoteInStorage(note) {
        const noteData = {
            completed: note.completed,
            canceled: note.canceled,
            startTimestamp: note.timer.startTimestamp,
            endTimestamp: note.timer.endTimestamp,
            hasStarted: note.timer.hasStarted,
            additionalTime: note.timer.additionalTime,
            projectID: note.elements.projectID.value,
            attemptID: note.elements.attemptID.value,
            operationID: note.elements.operationID.value,
            failingIssues: note.elements.failingIssues.value,
            nonFailingIssues: note.elements.nonFailingIssues.value,
            discussion: note.elements.discussion.value
        };

        NotesRepository.saveNote(note.date, note.number, noteData).catch(console.error);
    }

    getNotesForCurrentDate() {
        return this.notesState.getNotesForDate(this.appState.getCurrentDate());
    }

    getAllNotes() {
        return this.notesState.getAllNotes();
    }

    getNote(number, date = null) {
        const noteDate = date || this.appState.getCurrentDate();
        return this.notesState.getNote(noteDate, number);
    }

    stopAllNoteTimers() {
        const currentNotes = this.getNotesForCurrentDate();
        currentNotes.forEach(note => {
            if (note.timer) {
                note.timer.stop();
            }
        });
    }

    getNotesStats(date = null) {
        const noteDate = date || this.appState.getCurrentDate();
        return this.notesState.getStats(noteDate);
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
                    console.error(`Error in NoteController ${event} listener:`, error);
                }
            });
        }
    }
}