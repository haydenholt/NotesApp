import NavigationManager from '../../src/components/NavigationManager.js';

// Mock ViewManager
const mockViewManager = {
    showView: jest.fn(),
    navigationManager: null
};

describe('NavigationManager', () => {
    let navigationManager;
    let mockNavButtons;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <button id="navNotes" class="nav-button active">Notes</button>
            <button id="navDiff" class="nav-button">Diff</button>
            <button id="navPrompt" class="nav-button">Prompts</button>
            <button id="navPay" class="nav-button">Pay</button>
        `;

        // Mock window methods
        global.window.scrollTo = jest.fn();
        global.window.pageYOffset = 0;
        Object.defineProperty(document.documentElement, 'scrollTop', {
            value: 0,
            writable: true
        });

        jest.clearAllMocks();
        
        navigationManager = new NavigationManager(mockViewManager);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllTimers();
    });

    describe('Scroll Position Management', () => {
        test('should save current scroll position before navigation', () => {
            // Set a scroll position
            global.window.pageYOffset = 500;
            
            // Navigate to different view
            navigationManager.navigateTo('diff');
            
            // Check that scroll position was saved for notes
            expect(navigationManager.scrollPositions.notes).toBe(500);
        });

        test('should restore scroll position when returning to view', (done) => {
            // Set saved scroll position for notes
            navigationManager.scrollPositions.notes = 300;
            
            // Navigate to notes (current view is already notes, so this should restore)
            navigationManager.restoreScrollPosition('notes');
            
            // Check that scroll was called with saved position (setTimeout needs time)
            setTimeout(() => {
                expect(window.scrollTo).toHaveBeenCalledWith(0, 300);
                done();
            }, 10);
        });

        test('should handle keyboard shortcut scroll restoration', (done) => {
            // Set saved scroll position for notes
            navigationManager.scrollPositions.notes = 200;
            
            // Simulate keyboard shortcut via syncWithView
            navigationManager.syncWithView('notes');
            
            // Check that scroll was restored
            setTimeout(() => {
                expect(window.scrollTo).toHaveBeenCalledWith(0, 200);
                done();
            }, 10);
        });

        test('should default to 0 scroll position for new views', (done) => {
            // Navigate to view with no saved position
            navigationManager.navigateTo('diff');
            
            setTimeout(() => {
                expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
                done();
            }, 10);
        });
    });

    describe('View State Management', () => {
        test('should correctly identify current view', () => {
            expect(navigationManager.getCurrentView()).toBe('notes');
            
            // Change active button
            document.getElementById('navNotes').classList.remove('active');
            document.getElementById('navDiff').classList.add('active');
            
            expect(navigationManager.getCurrentView()).toBe('diff');
        });

        test('should save scroll position when switching via keyboard shortcuts', () => {
            global.window.pageYOffset = 400;
            
            // Directly call the save method to test it works
            navigationManager.saveCurrentScrollPosition();
            
            expect(navigationManager.scrollPositions.notes).toBe(400);
        });
    });
});