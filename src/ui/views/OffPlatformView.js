import { DOMHelpers } from '../../core/utils/DOMHelpers.js';
import { OffPlatformEntryList } from '../components/OffPlatformEntryList.js';
import { TimerEntryRepository } from '../../core/data/TimerEntryRepository.js';

export class OffPlatformView {
    constructor(themeManager, timerController = null) {
        this.themeManager = themeManager;
        this.timerController = timerController;
        this.container = null;
        this.stickyContainer = null;
        this.entryList = null;
        this.currentDate = null;
        this.listeners = {
            timerStartRequested: [],
            timerStopRequested: [],
            timerEditRequested: []
        };
        
        // Listen for theme changes
        document.addEventListener('themeChanged', () => {
            this.updateTheme();
        });
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

        this.container.textContent = '';

        const offPlatformSection = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'mb-5 p-4 rounded-lg shadow off-platform-section',
                this.themeManager.getColor('background', 'card')
            )
        );

        // Create entry list with callbacks
        this.entryList = new OffPlatformEntryList(this.themeManager, {
            entryAdded: (entryData) => this.handleEntryAdded(entryData),
            entryStarted: (entryData) => this.handleEntryStarted(entryData),
            entryStopped: (entryData) => this.handleEntryStopped(entryData),
            entryUpdated: (entryData) => this.handleEntryUpdated(entryData),
            entryDeleted: (entryData) => this.handleEntryDeleted(entryData),
            stickyTimerUpdate: (entryId, timeText) => this.updateStickyTimer(entryId, timeText)
        });

        // Load entries for current date
        if (this.currentDate) {
            this.loadEntriesForCurrentDate().catch(console.error);
        }

        offPlatformSection.appendChild(this.entryList.getContainer());
        this.container.appendChild(offPlatformSection);

        this.setupScrollBehavior();
    }

    async loadEntriesForCurrentDate() {
        if (!this.currentDate || !this.entryList) return;
        
        const entries = await TimerEntryRepository.getEntries(this.currentDate);
        this.entryList.loadEntries(entries);
    }

    // Entry event handlers
    handleEntryAdded(entryData) {
        this.saveCurrentEntries();
        this.updateStickyVisibility();
    }

    handleEntryStarted(entryData) {
        this.saveCurrentEntries();
        this.updateStickyVisibility();
        // Notify listeners for compatibility
        this.notifyListeners('timerStartRequested', { entryId: entryData.id, entryData });
    }

    handleEntryStopped(entryData) {
        this.saveCurrentEntries();
        this.updateStickyVisibility();
        // Notify listeners for compatibility
        this.notifyListeners('timerStopRequested', { entryId: entryData.id, entryData });
    }

    handleEntryUpdated(entryData) {
        this.saveCurrentEntries();
    }

    handleEntryDeleted(entryData) {
        if (this.currentDate) {
            TimerEntryRepository.deleteEntry(this.currentDate, entryData.id).catch(console.error);
        }
        this.updateStickyVisibility();
    }

    saveCurrentEntries() {
        if (this.entryList && this.currentDate) {
            const entries = this.entryList.getAllEntries();
            TimerEntryRepository.saveEntries(this.currentDate, entries).catch(console.error);
        }
    }

    // Maintain compatibility with existing API
    updateTimerDisplay(categoryId, timeText, isRunning = false) {
        // This is called by the old system - we'll update entries when date changes instead
        this.updateStickyVisibility();
    }
    
    setCurrentDate(date) {
        this.currentDate = date;
        this.loadEntriesForCurrentDate().catch(console.error);
        this.updateStickyVisibility();
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
        if (!this.entryList) return [];
        
        const runningEntry = this.entryList.getRunningEntry();
        if (!runningEntry) return [];
        
        return [{
            entryId: runningEntry.id,
            timeText: runningEntry.timeText,
            label: runningEntry.title || 'Untitled Entry'
        }];
    }

    showStickyTimer(timerInfo) {
        if (!this.stickyContainer) return;

        this.stickyContainer.textContent = '';

        const activeTimer = DOMHelpers.createElement('div', 
            'flex items-center justify-between max-w-screen-lg mx-auto'
        );

        const entryLabel = DOMHelpers.createElement('div',
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
                // Stop the running entry
                if (this.entryList) {
                    const runningEntry = this.entryList.getRunningEntry();
                    if (runningEntry && runningEntry.entry) {
                        runningEntry.entry.stopTimer();
                    }
                }
                this.hideStickyTimer();
            }
        );

        activeTimer.appendChild(entryLabel);
        activeTimer.appendChild(timerDisplay);
        activeTimer.appendChild(stopButton);
        this.stickyContainer.appendChild(activeTimer);

        this.stickyContainer.classList.remove('hidden');

        // Store reference for live updates
        this.stickyContainer.timerDisplay = timerDisplay;
        this.stickyContainer.entryId = timerInfo.entryId;
    }

    hideStickyTimer() {
        if (this.stickyContainer) {
            this.stickyContainer.classList.add('hidden');
            this.stickyContainer.timerDisplay = null;
            this.stickyContainer.entryId = null;
        }
    }

    updateStickyTimer(entryId, timeText) {
        if (this.stickyContainer && 
            this.stickyContainer.entryId === entryId && 
            this.stickyContainer.timerDisplay) {
            this.stickyContainer.timerDisplay.textContent = timeText;
        }
    }

    updateTheme() {
        // Update main off-platform section container
        if (this.container && this.container.firstElementChild) {
            const offPlatformSection = this.container.querySelector('.off-platform-section');
            if (offPlatformSection) {
                offPlatformSection.className = this.themeManager.combineClasses(
                    'mb-5 p-4 rounded-lg shadow off-platform-section',
                    this.themeManager.getColor('background', 'card')
                );
            }
        }

        // Update entry list theme
        if (this.entryList) {
            this.entryList.updateTheme();
        }

        // Update sticky container theme
        if (this.stickyContainer) {
            this.stickyContainer.className = this.themeManager.combineClasses(
                'hidden fixed top-0 left-0 right-0 shadow-md p-3 z-50 transition-all duration-300',
                this.themeManager.getColor('background', 'primary'),
                this.themeManager.getColor('border', 'primary')
            );
            
            // If sticky timer is visible, update its content
            const activeTimer = this.stickyContainer.querySelector('.flex');
            if (activeTimer && !this.stickyContainer.classList.contains('hidden')) {
                const runningEntry = this.getRunningEntry();
                if (runningEntry) {
                    this.showStickyTimer(runningEntry);
                }
            }
        }
    }

    show() {
        if (this.container) {
            this.container.style.display = '';
        }
        if (this.entryList) {
            this.entryList.show();
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        if (this.entryList) {
            this.entryList.hide();
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