export class NavigationManager {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.viewManager.navigationManager = this; // Set back-reference
        this.navButtons = {
            notes: document.getElementById('navNotes'),
            diff: document.getElementById('navDiff'),
            prompt: document.getElementById('navPrompt'),
            pay: document.getElementById('navPay')
        };
        
        // Store scroll positions for each view
        this.scrollPositions = {
            notes: 0,
            diff: 0,
            prompt: 0,
            pay: 0
        };
        
        this.setupEventListeners();
        this.updateActiveButton('notes'); // Default to notes view
    }
    
    setupEventListeners() {
        // Only set up listeners if elements exist (for test compatibility)
        if (this.navButtons.notes) {
            this.navButtons.notes.addEventListener('click', () => this.navigateTo('notes'));
        }
        if (this.navButtons.diff) {
            this.navButtons.diff.addEventListener('click', () => this.navigateTo('diff'));
        }
        if (this.navButtons.prompt) {
            this.navButtons.prompt.addEventListener('click', () => this.navigateTo('prompt'));
        }
        if (this.navButtons.pay) {
            this.navButtons.pay.addEventListener('click', () => this.navigateTo('pay'));
        }
    }
    
    navigateTo(view) {
        // Save current scroll position before switching views
        this.saveCurrentScrollPosition();
        
        // Map nav button names to ViewManager view names
        const viewMap = {
            'notes': 'notes',
            'diff': 'diff',
            'prompt': 'systemPrompt',
            'pay': 'payAnalysis'
        };
        
        // Update the active button first to ensure getCurrentView works correctly
        this.updateActiveButton(view);
        this.viewManager.showView(viewMap[view]);
        
        // Restore scroll position for the new view
        this.restoreScrollPosition(view);
    }
    
    updateActiveButton(activeView) {
        // Remove active class from all buttons
        Object.values(this.navButtons).forEach(button => {
            if (button) {
                button.classList.remove('active');
            }
        });
        
        // Add active class to current button
        if (this.navButtons[activeView]) {
            this.navButtons[activeView].classList.add('active');
        }
    }
    
    // Method to sync nav with keyboard shortcuts
    syncWithView(viewName) {
        const navMap = {
            'notes': 'notes',
            'diff': 'diff', 
            'systemPrompt': 'prompt',
            'payAnalysis': 'pay'
        };
        
        const navKey = navMap[viewName];
        if (navKey) {
            this.updateActiveButton(navKey);
            // Restore scroll position when syncing (for keyboard shortcuts)
            this.restoreScrollPosition(navKey);
        }
    }
    
    saveCurrentScrollPosition() {
        // Get the current active view
        const currentView = this.getCurrentView();
        if (currentView) {
            this.scrollPositions[currentView] = window.pageYOffset || document.documentElement.scrollTop;
        }
    }
    
    restoreScrollPosition(view) {
        // Use setTimeout to ensure DOM is updated before scrolling
        setTimeout(() => {
            const scrollY = this.scrollPositions[view] || 0;
            window.scrollTo(0, scrollY);
        }, 0);
    }
    
    getCurrentView() {
        // Determine current view based on active button
        for (const [view, button] of Object.entries(this.navButtons)) {
            if (button && button.classList.contains('active')) {
                return view;
            }
        }
        return 'notes'; // Default fallback
    }
}

export default NavigationManager;