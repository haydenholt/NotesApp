import { DateUtils } from '../utils/DateUtils.js';

export class AppState {
    constructor() {
        this.currentDate = DateUtils.getCurrentDate();
        this.isSearchActive = false;
        this.searchQuery = '';
        this.editingNotes = {}; // Track which notes are being edited, per date
        this.listeners = {
            dateChange: [],
            searchChange: [],
            editingChange: []
        };
    }

    setCurrentDate(date) {
        if (this.currentDate !== date) {
            const oldDate = this.currentDate;
            this.currentDate = date;
            this.notifyListeners('dateChange', { oldDate, newDate: date });
        }
    }

    getCurrentDate() {
        return this.currentDate;
    }

    setSearchState(isActive, query = '') {
        if (this.isSearchActive !== isActive || this.searchQuery !== query) {
            this.isSearchActive = isActive;
            this.searchQuery = query;
            this.notifyListeners('searchChange', { isActive, query });
        }
    }

    getSearchState() {
        return {
            isActive: this.isSearchActive,
            query: this.searchQuery
        };
    }

    markNoteAsEditing(noteNumber) {
        if (!this.editingNotes[this.currentDate]) {
            this.editingNotes[this.currentDate] = {};
        }
        this.editingNotes[this.currentDate][noteNumber] = true;
        this.notifyListeners('editingChange', { 
            date: this.currentDate, 
            noteNumber, 
            isEditing: true 
        });
    }

    clearNoteEditing(noteNumber) {
        if (this.editingNotes[this.currentDate] && 
            this.editingNotes[this.currentDate][noteNumber]) {
            delete this.editingNotes[this.currentDate][noteNumber];
            this.notifyListeners('editingChange', { 
                date: this.currentDate, 
                noteNumber, 
                isEditing: false 
            });
        }
    }

    isNoteEditing(noteNumber, date = null) {
        const checkDate = date || this.currentDate;
        return !!(this.editingNotes[checkDate] && 
                 this.editingNotes[checkDate][noteNumber]);
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

    reset() {
        this.currentDate = DateUtils.getCurrentDate();
        this.isSearchActive = false;
        this.searchQuery = '';
        this.editingNotes = {};
    }

    getState() {
        return {
            currentDate: this.currentDate,
            isSearchActive: this.isSearchActive,
            searchQuery: this.searchQuery,
            editingNotes: { ...this.editingNotes }
        };
    }
}