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
        this.appState.addEventListener('dateChange', ({ newDate }) => {
            this.loadNotesForDate(newDate);
        });
    }

    async loadNotesForDate(date) {
        this.notesState.clearNotesForDate(date);
        
        const savedNotes = NotesRepository.cleanupCorruptNotes(date);
        const sortedNotes = Object.entries(savedNotes)
            .sort(([a], [b]) => parseInt(a) - parseInt(b));

        if (sortedNotes.length === 0) {
            this.createNewNote(1, date);
        } else {
            sortedNotes.forEach(([id]) => {
                this.createNewNote(parseInt(id), date);
            });

            const allCompleted = sortedNotes.every(([, note]) => note.completed);
            if (allCompleted) {
                const nextNumber = NotesRepository.getNextNoteNumber(date);
                this.createNewNote(nextNumber, date);
            }
        }

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
        if (!note.container) return;
        
        const numberDisplay = note.container.querySelector('.font-bold.mb-2');
        if (numberDisplay) {
            if (displayIndex === null && note.canceled) {
                numberDisplay.textContent = "Cancelled";
                // Apply canceled styling
                numberDisplay.className = `${this.themeManager.getColor('note', 'cancelledNumber')} font-bold mb-2`;
            } else if (displayIndex !== null) {
                numberDisplay.textContent = String(displayIndex);
                // Apply normal styling
                numberDisplay.className = `${this.themeManager.getColor('text', 'tertiary')} font-bold mb-2`;
            }
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
            this.checkAndCreateNewNote(date);
        }
    }

    checkAndCreateNewNote(date) {
        const hasInProgress = this.notesState.hasInProgressNoteForDate(date);
        const hasEmpty = this.notesState.hasEmptyNoteForDate(date);
        
        if (!hasEmpty && !hasInProgress) {
            const nextNumber = NotesRepository.getNextNoteNumber(date);
            const newNote = this.createNewNote(nextNumber, date);
            this.notifyListeners('noteCreated', { 
                note: newNote, 
                date, 
                autoCreated: true 
            });
        }
    }

    deleteNote(number) {
        const date = this.appState.getCurrentDate();
        const note = this.notesState.getNote(date, number);
        if (!note) return false;

        // Remove from storage and renumber
        NotesRepository.deleteNote(date, number);
        NotesRepository.renumberNotes(date);
        
        // Remove from state
        this.notesState.removeNote(date, number);
        
        // Notify listeners with the note being deleted
        this.notifyListeners('noteDeleted', { note, date, number });
        
        // Reload notes to reflect the renumbering
        this.reloadNotesForDate(date);
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

        NotesRepository.saveNote(note.date, note.number, noteData);
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