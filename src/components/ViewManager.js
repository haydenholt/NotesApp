import SystemPromptView from './SystemPromptView.js';

/**
 * Manages switching between Notes view, Diff view, and System Prompt view
 */
export class ViewManager {
    constructor() {
        this.views = {
            notes: { element: document.getElementById('notesView') },
            diff: { element: document.getElementById('diffView') },
            systemPrompt: {
                element: document.getElementById('systemPromptView'),
                init: () => this.systemPromptViewInstance = new SystemPromptView('systemPromptView')
            },
            payAnalysis: {
                element: document.getElementById('payAnalysisView'),
                onShow: () => window.payAnalysis.generateReport()
            }
        };
        this.currentView = 'notes';

        document.addEventListener('keydown', (e) => {
            if (!e.ctrlKey) return;
            const key = e.key.toLowerCase();
            if (key === 'd') {
                e.preventDefault();
                this.toggleView('diff', 'notes');
            } else if (key === 'p') {
                e.preventDefault();
                this.toggleView('systemPrompt', 'notes');
            } else if (key === 'y') {
                e.preventDefault();
                this.toggleView('payAnalysis', 'notes');
            }
        });

        if (!this.views.systemPrompt.element) {
            console.error("[ViewManager] System Prompt View container element NOT FOUND!");
        }
    }

    hideAllViews() {
        Object.values(this.views).forEach(v => {
            if (v.element) v.element.classList.add('hidden');
        });
    }

    showView(viewName) {
        const view = this.views[viewName] || this.views.notes;
        if (!view.element) {
            console.error(`[ViewManager] No view element found for: ${viewName}`);
            return;
        }
        this.hideAllViews();
        if (view.init && !view.initialized) {
            try {
                view.init();
                view.initialized = true;
            } catch (error) {
                console.error(`[ViewManager] ERROR initializing view ${viewName}:`, error);
                return;
            }
        }
        view.element.classList.remove('hidden');
        this.currentView = viewName;
        if (view.onShow) {
            try {
                view.onShow();
            } catch (error) {
                console.error(`[ViewManager] ERROR onShow for view: ${viewName}`, error);
            }
        }
    }

    toggleView(viewName, fallback) {
        this.showView(this.currentView === viewName ? fallback : viewName);
    }
}

export default ViewManager;