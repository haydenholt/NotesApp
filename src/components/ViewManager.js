import SystemPromptView from './SystemPromptView.js';

/**
 * Manages switching between Notes view, Diff view, and System Prompt view
 */
export class ViewManager {
    constructor() {
        this.navigationManager = null; // Will be set by NavigationManager
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
                this.toggleView('diff', 'notes', true);
            } else if (key === 'p') {
                e.preventDefault();
                this.toggleView('systemPrompt', 'notes', true);
            } else if (key === 'y') {
                e.preventDefault();
                this.toggleView('payAnalysis', 'notes', true);
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
        
        // Notify navigation manager of view change
        if (this.navigationManager) {
            this.navigationManager.syncWithView(viewName);
        }
        
        if (view.onShow) {
            try {
                view.onShow();
            } catch (error) {
                console.error(`[ViewManager] ERROR onShow for view: ${viewName}`, error);
            }
        }
    }

    toggleView(viewName, fallback, isKeyboardShortcut = false) {
        const targetView = this.currentView === viewName ? fallback : viewName;
        
        // Save scroll position for keyboard shortcuts
        if (isKeyboardShortcut && this.navigationManager) {
            this.navigationManager.saveCurrentScrollPosition();
        }
        
        this.showView(targetView);
    }
}

export default ViewManager;