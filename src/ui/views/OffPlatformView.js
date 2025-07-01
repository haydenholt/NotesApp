import { DOMHelpers } from '../../core/utils/DOMHelpers.js';

export class OffPlatformView {
    constructor(themeManager, timerController = null) {
        this.themeManager = themeManager;
        this.timerController = timerController;
        this.container = null;
        this.stickyContainer = null;
        this.timerCards = new Map(); // category -> card element
        this.listeners = {
            timerStartRequested: [],
            timerStopRequested: [],
            timerEditRequested: []
        };
    }

    render(containerElement) {
        this.container = containerElement;
        this.setupStickyContainer();
        this.renderOffPlatformSection();
    }

    setupStickyContainer() {
        this.stickyContainer = document.getElementById('stickyTimerContainer') || 
            DOMHelpers.createElement('div');
        
        if (!document.getElementById('stickyTimerContainer')) {
            this.stickyContainer.id = 'stickyTimerContainer';
            this.stickyContainer.className = this.themeManager.combineClasses(
                'hidden fixed top-0 left-0 right-0 shadow-md p-3 z-50 transition-all duration-300',
                this.themeManager.getColor('background', 'primary'),
                this.themeManager.getColor('border', 'primary')
            );
            document.body.appendChild(this.stickyContainer);
        }
    }

    renderOffPlatformSection() {
        if (!this.container) return;

        this.container.innerHTML = '';

        const offPlatformSection = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'mb-5 p-4 rounded-lg shadow off-platform-section',
                this.themeManager.getColor('background', 'card')
            )
        );

        const header = DOMHelpers.createElement('h2',
            this.themeManager.combineClasses(
                'text-lg font-semibold mb-3',
                this.themeManager.getColor('text', 'secondary')
            ),
            'Off-platform time'
        );

        const timerGrid = this.createTimerGrid();

        offPlatformSection.appendChild(header);
        offPlatformSection.appendChild(timerGrid);
        this.container.appendChild(offPlatformSection);

        this.setupScrollBehavior();
    }

    createTimerGrid() {
        const timerGrid = DOMHelpers.createElement('div', 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-3');

        const categories = [
            { id: 'projectTraining', label: 'Project Training' },
            { id: 'sheetwork', label: 'Sheet Work' },
            { id: 'blocked', label: 'Blocked from Working' }
        ];

        categories.forEach(category => {
            const timerCard = this.createTimerCard(category.id, category.label);
            this.timerCards.set(category.id, timerCard);
            timerGrid.appendChild(timerCard);
        });

        return timerGrid;
    }

    createTimerCard(categoryId, label) {
        const card = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'p-3 rounded-lg border transition-all hover:shadow-sm relative group',
                this.themeManager.getColor('background', 'secondary'),
                this.themeManager.getColor('border', 'light')
            )
        );

        const cardLabel = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'text-center text-sm font-medium mb-2',
                this.themeManager.getColor('text', 'tertiary')
            ),
            label
        );

        const timeDisplay = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'font-mono text-center text-2xl font-semibold my-2 py-2',
                this.themeManager.getColor('text', 'primary')
            ),
            '00:00:00'
        );
        timeDisplay.dataset.category = categoryId;

        const editButton = DOMHelpers.createButton(
            '✎',
            this.themeManager.combineClasses(
                'absolute top-2 right-2 w-6 h-6 rounded text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
                this.themeManager.getPrimaryButtonClasses('sm')
            ),
            () => this.notifyListeners('timerEditRequested', { categoryId, label })
        );
        editButton.title = 'Edit timer';

        const buttonContainer = DOMHelpers.createElement('div', 'flex gap-2 mt-2');

        const startButton = DOMHelpers.createButton(
            'Start',
            this.themeManager.combineClasses(
                'w-full',
                this.themeManager.getButtonClasses('success', 'sm')
            ),
            () => this.notifyListeners('timerStartRequested', { categoryId })
        );

        const stopButton = DOMHelpers.createButton(
            'Stop',
            this.themeManager.combineClasses(
                'w-full',
                this.themeManager.getButtonClasses('danger', 'sm')
            ),
            () => this.notifyListeners('timerStopRequested', { categoryId })
        );

        stopButton.style.display = 'none';

        buttonContainer.appendChild(startButton);
        buttonContainer.appendChild(stopButton);

        card.appendChild(cardLabel);
        card.appendChild(timeDisplay);
        card.appendChild(editButton);
        card.appendChild(buttonContainer);

        // Store references for easy access
        card.dataset.category = categoryId;
        card.startButton = startButton;
        card.stopButton = stopButton;
        card.timeDisplay = timeDisplay;

        return card;
    }

    updateTimerDisplay(categoryId, timeText, isRunning = false) {
        const card = this.timerCards.get(categoryId);
        if (!card) return;

        const timeDisplay = card.timeDisplay;
        if (timeDisplay) {
            timeDisplay.textContent = timeText;
        }

        this.updateButtonVisibility(categoryId, isRunning);
        this.updateCardVisualState(categoryId, isRunning);
    }

    updateButtonVisibility(categoryId, isRunning) {
        const card = this.timerCards.get(categoryId);
        if (!card) return;

        // Only update button visibility based on whether timer is running for current date
        const actuallyRunning = this.timerController ? 
            this.timerController.isTimerRunning(categoryId) : 
            isRunning; // fallback

        card.startButton.style.display = actuallyRunning ? 'none' : 'block';
        card.stopButton.style.display = actuallyRunning ? 'block' : 'none';
    }

    updateCardVisualState(categoryId, isRunning) {
        const card = this.timerCards.get(categoryId);
        if (!card) return;

        // Only update visual state based on whether timer is running for current date
        const actuallyRunning = this.timerController ? 
            this.timerController.isTimerRunning(categoryId) : 
            isRunning; // fallback

        if (actuallyRunning) {
            card.classList.add('ring-1', 'ring-green-200');
        } else {
            card.classList.remove('ring-1', 'ring-green-200');
        }
    }

    setupScrollBehavior() {
        window.addEventListener('scroll', () => {
            this.updateStickyVisibility();
        });
    }

    updateStickyVisibility() {
        if (!this.stickyContainer) return;

        const runningTimers = this.getRunningTimers();
        
        if (runningTimers.length > 0) {
            const offPlatformSection = document.querySelector('.off-platform-section');
            if (offPlatformSection) {
                const sectionBottom = offPlatformSection.getBoundingClientRect().bottom;
                
                if (sectionBottom < 0) {
                    this.showStickyTimer(runningTimers[0]);
                } else {
                    this.hideStickyTimer();
                }
            }
        } else {
            this.hideStickyTimer();
        }
    }

    getRunningTimers() {
        const runningTimers = [];
        
        this.timerCards.forEach((card, categoryId) => {
            // Check if timer is actually running for the current date via timerController
            const isRunning = this.timerController ? 
                this.timerController.isTimerRunning(categoryId) : 
                card.startButton.style.display === 'none'; // fallback
            
            if (isRunning) {
                runningTimers.push({
                    categoryId,
                    timeText: card.timeDisplay.textContent,
                    label: this.getCategoryLabel(categoryId)
                });
            }
        });
        
        return runningTimers;
    }

    getCategoryLabel(categoryId) {
        const labels = {
            projectTraining: 'Project Training',
            sheetwork: 'Sheet Work',
            blocked: 'Blocked from Working'
        };
        return labels[categoryId] || categoryId;
    }

    showStickyTimer(timerInfo) {
        if (!this.stickyContainer) return;

        this.stickyContainer.innerHTML = '';

        const activeTimer = DOMHelpers.createElement('div', 
            'flex items-center justify-between max-w-screen-lg mx-auto'
        );

        const categoryLabel = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'font-medium',
                this.themeManager.getColor('text', 'secondary')
            ),
            `${timerInfo.label} (running):`
        );

        const timerDisplay = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'font-mono text-xl font-semibold',
                this.themeManager.getColor('status', 'success')
            ),
            timerInfo.timeText
        );

        const stopButton = DOMHelpers.createButton(
            'Stop',
            this.themeManager.getButtonClasses('danger', 'sm'),
            () => {
                this.notifyListeners('timerStopRequested', { categoryId: timerInfo.categoryId });
                this.hideStickyTimer();
            }
        );

        activeTimer.appendChild(categoryLabel);
        activeTimer.appendChild(timerDisplay);
        activeTimer.appendChild(stopButton);
        this.stickyContainer.appendChild(activeTimer);

        this.stickyContainer.classList.remove('hidden');

        // Store reference for live updates
        this.stickyContainer.timerDisplay = timerDisplay;
        this.stickyContainer.categoryId = timerInfo.categoryId;
    }

    hideStickyTimer() {
        if (this.stickyContainer) {
            this.stickyContainer.classList.add('hidden');
            this.stickyContainer.timerDisplay = null;
            this.stickyContainer.categoryId = null;
        }
    }

    updateStickyTimer(categoryId, timeText) {
        if (this.stickyContainer && 
            this.stickyContainer.categoryId === categoryId && 
            this.stickyContainer.timerDisplay) {
            this.stickyContainer.timerDisplay.textContent = timeText;
        }
    }

    updateTheme() {
        // Re-render the entire section with new theme
        if (this.container) {
            this.renderOffPlatformSection();
        }

        // Update sticky container theme
        if (this.stickyContainer) {
            this.stickyContainer.className = this.themeManager.combineClasses(
                'hidden fixed top-0 left-0 right-0 shadow-md p-3 z-50 transition-all duration-300',
                this.themeManager.getColor('background', 'primary'),
                this.themeManager.getColor('border', 'primary')
            );
        }
    }

    show() {
        if (this.container) {
            this.container.style.display = '';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        this.hideStickyTimer();
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
                    console.error(`Error in OffPlatformView ${event} listener:`, error);
                }
            });
        }
    }
}