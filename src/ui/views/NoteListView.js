import { DOMHelpers } from '../../core/utils/DOMHelpers.js';

export class NoteListView {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.container = null;
        this.listeners = {
            noteHighlighted: []
        };
    }

    render(containerElement) {
        this.container = containerElement;
        this.clear();
    }

    addNote(note) {
        if (!this.container || !note.container) return;
        this.container.appendChild(note.container);
    }

    removeNote(note) {
        if (!this.container || !note.container) return;
        if (this.container.contains(note.container)) {
            this.container.removeChild(note.container);
        }
    }

    clear() {
        if (this.container) {
            // Get all note elements and destroy them properly
            const noteElements = this.container.querySelectorAll('[data-note-id]');
            noteElements.forEach(element => {
                // If the element has a reference to the Note instance, destroy it
                if (element._noteInstance && element._noteInstance.destroy) {
                    element._noteInstance.destroy();
                }
            });
            this.container.innerHTML = '';
        }
    }

    highlightNote(noteId, duration = 2000) {
        if (!this.container) return;
        
        const noteElement = this.container.querySelector(`[data-note-id="${noteId}"]`);
        if (noteElement) {
            DOMHelpers.scrollToElement(noteElement, 'smooth', 'center');
            DOMHelpers.addHighlight(noteElement, 'ring-2 ring-blue-300', duration);
            
            this.notifyListeners('noteHighlighted', { noteId, element: noteElement });
        }
    }

    scrollToNote(noteId, behavior = 'smooth') {
        if (!this.container) return;
        
        const noteElement = this.container.querySelector(`[data-note-id="${noteId}"]`);
        if (noteElement) {
            DOMHelpers.scrollToElement(noteElement, behavior, 'start');
        }
    }

    scrollToBottom(behavior = 'smooth') {
        if (!this.container) return;
        
        const lastNote = this.container.lastElementChild;
        if (lastNote) {
            DOMHelpers.scrollToElement(lastNote, behavior, 'start');
        }
    }

    scrollToTop() {
        window.scrollTo(0, 0);
    }

    getNoteElements() {
        if (!this.container) return [];
        return Array.from(this.container.querySelectorAll('[data-note-id]'));
    }

    getVisibleNotes() {
        const noteElements = this.getNoteElements();
        const windowHeight = window.innerHeight;
        
        return noteElements.filter(element => {
            const rect = element.getBoundingClientRect();
            return rect.top < windowHeight && rect.bottom > 0;
        });
    }

    focusFirstTextarea() {
        if (!this.container) return;
        
        const firstTextarea = this.container.querySelector('textarea');
        if (firstTextarea) {
            firstTextarea.focus();
        }
    }

    updateTheme() {
        // Notes handle their own theme updates through the Note class
        // This method is here for consistency with other views
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
                    console.error(`Error in NoteListView ${event} listener:`, error);
                }
            });
        }
    }
}