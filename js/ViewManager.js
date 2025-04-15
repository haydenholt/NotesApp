/**
 * Manages switching between Notes view and Diff view
 */
export class ViewManager {
    constructor() {
        this.notesView = document.getElementById('notesView');
        this.diffView = document.getElementById('diffView');
        this.currentView = 'notes'; // 'notes' or 'diff'
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault(); // Prevent browser default behavior
                this.toggleView();
            }
        });
    }
    
    toggleView() {
        if (this.currentView === 'notes') {
            this.notesView.classList.add('hidden');
            this.diffView.classList.remove('hidden');
            this.currentView = 'diff';
        } else {
            this.notesView.classList.remove('hidden');
            this.diffView.classList.add('hidden');
            this.currentView = 'notes';
        }
    }
}

export default ViewManager;