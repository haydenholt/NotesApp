import SystemPromptView from './SystemPromptView.js';

/**
 * Manages switching between Notes view, Diff view, and System Prompt view
 */
export class ViewManager {
    constructor() {
        this.notesView = document.getElementById('notesView');
        this.diffView = document.getElementById('diffView');
        // Get the container for the SystemPromptView
        this.systemPromptViewContainer = document.getElementById('systemPromptView'); 
        this.systemPromptViewInstance = null; // To hold the instance
        // Get the container for the Pay Analysis view
        this.payAnalysisView = document.getElementById('payAnalysisView');

        // Store view containers for easy toggling
        this.viewElements = {
            notes: this.notesView,
            diff: this.diffView,
            systemPrompt: this.systemPromptViewContainer,
            payAnalysis: this.payAnalysisView
        };
        this.currentView = 'notes'; // 'notes', 'diff', or 'systemPrompt'
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleBetweenNotesAndDiff();
            } else if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                if (this.currentView === 'systemPrompt') {
                    this.showView('notes');
                } else {
                    this.showView('systemPrompt');
                }
            } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                if (this.currentView === 'payAnalysis') {
                    this.showView('notes');
                } else {
                    this.showView('payAnalysis');
                }
            }
        });

        if (!this.systemPromptViewContainer) {
            console.error("[ViewManager] System Prompt View container element NOT FOUND!");
        }
    }

    hideAllViews() {
        Object.values(this.viewElements).forEach(view => {
            if (view) {
                view.classList.add('hidden');
            }
        });
    }

    showView(viewName) {
        this.hideAllViews();
        let viewToShow;
        switch (viewName) {
            case 'notes':
                viewToShow = this.viewElements.notes;
                this.currentView = 'notes';
                break;
            case 'diff':
                viewToShow = this.viewElements.diff;
                this.currentView = 'diff';
                break;
            case 'systemPrompt':
                if (!this.systemPromptViewContainer) {
                    console.error('[ViewManager] CRITICAL: systemPromptViewContainer is null when trying to show systemPrompt view!');
                    return; 
                }
                if (!this.systemPromptViewInstance) {
                    try {
                        this.systemPromptViewInstance = new SystemPromptView('systemPromptView');
                    } catch (error) {
                        console.error('[ViewManager] ERROR creating SystemPromptView instance:', error);
                        return; // Stop if instance creation fails
                    }
                }
                viewToShow = this.viewElements.systemPrompt;
                this.currentView = 'systemPrompt';
                break;
            case 'payAnalysis':
                viewToShow = this.viewElements.payAnalysis;
                this.currentView = 'payAnalysis';
                break;
            default:
                viewToShow = this.viewElements.notes;
                this.currentView = 'notes';
        }
        if (viewToShow) {
            viewToShow.classList.remove('hidden');
            // Refresh pay analysis report when view is shown
            if (this.currentView === 'payAnalysis' && window.payAnalysis) {
                window.payAnalysis.generateReport();
            }
        } else {
            console.error(`[ViewManager] No view element found to show for: ${viewName}`);
        }
    }
    
    toggleBetweenNotesAndDiff() {
        if (this.currentView === 'notes') {
            this.showView('diff');
        } else if (this.currentView === 'diff') {
            this.showView('notes');
        } else {
            this.showView('notes');
        }
    }
}

export default ViewManager;