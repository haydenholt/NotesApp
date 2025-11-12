import { AppState } from './state/AppState.js';
import { NoteController } from './controllers/NoteController.js';
import { TimerController } from './controllers/TimerController.js';
import { SearchController } from './controllers/SearchController.js';
import { StatisticsController } from './controllers/StatisticsController.js';
import { NoteListView } from '../ui/views/NoteListView.js';
import { SearchResultsView } from '../ui/views/SearchResultsView.js';
import { StatisticsView } from '../ui/views/StatisticsView.js';
import { DateNavigationView } from '../ui/views/DateNavigationView.js';
import { OffPlatformView } from '../ui/views/OffPlatformView.js';
import { ModalView } from '../ui/views/ModalView.js';
import { Toast } from '../ui/components/Toast.js';
import { ExportService } from './data/ExportService.js';
import { DOMHelpers } from './utils/DOMHelpers.js';
import { TimeFormatter } from './utils/TimeFormatter.js';
import { SecurityUtils } from './utils/SecurityUtils.js';
import Timer from '../ui/components/Timer.js';

export class NoteApp {
    constructor(themeManager) {
        this.themeManager = themeManager;
        
        // Initialize toast
        this.toast = new Toast(this.themeManager);
        
        // Initialize state
        this.appState = new AppState();
        
        // Initialize controllers
        this.noteController = new NoteController(this.appState, this.themeManager, this.toast);
        this.timerController = new TimerController(this.appState, this.themeManager);
        this.searchController = new SearchController(this.appState, this.themeManager);
        this.statisticsController = new StatisticsController(this.appState, this.themeManager);
        
        // Initialize views
        this.noteListView = new NoteListView(this.themeManager);
        this.searchResultsView = new SearchResultsView(this.themeManager);
        this.statisticsView = new StatisticsView(this.themeManager);
        this.dateNavigationView = new DateNavigationView(this.themeManager);
        this.offPlatformView = new OffPlatformView(this.themeManager, this.timerController);
        this.modalView = new ModalView(this.themeManager);
        
        // DOM elements
        this.elements = {
            container: document.getElementById('notesContainer'),
            totalTimeDisplay: document.getElementById('totalTime'),
            statsDisplay: document.getElementById('statsDisplay'),
            projectFailRateDisplay: document.getElementById('projectFailRateDisplay'),
            searchInput: document.getElementById('searchInput'),
            clearSearchButton: document.getElementById('clearSearchButton'),
            offPlatformContainer: document.getElementById('offPlatformContainer')
        };

        this.setupEventListeners();
        this.init();
    }

    setupEventListeners() {
        // App State listeners
        this.appState.addEventListener('dateChange', async ({ newDate }) => {
            await this.handleDateChange(newDate);
        });

        this.appState.addEventListener('searchChange', ({ isActive, query }) => {
            this.handleSearchChange(isActive, query);
        });

        // Note Controller listeners
        this.noteController.addEventListener('noteCreated', ({ note, autoCreated }) => {
            this.noteListView.addNote(note);
            if (autoCreated) {
                this.noteListView.scrollToNote(note.number);
                this.noteListView.focusFirstTextarea();
            }
            this.updateStatistics();
        });

        this.noteController.addEventListener('noteCompleted', () => {
            this.updateStatistics();
        });

        this.noteController.addEventListener('noteDeleted', ({ note }) => {
            // Remove only the deleted note from the DOM
            this.noteListView.removeNote(note);
            this.updateStatistics();
        });

        this.noteController.addEventListener('notesClearing', () => {
            this.noteListView.clear();
        });

        this.noteController.addEventListener('noteEdited', () => {
            this.updateStatistics();
        });

        // Timer Controller listeners
        this.timerController.addEventListener('totalTimeChanged', () => {
            this.updateTotalTimeDisplay().catch(console.error);
        });

        // Timer events are now handled directly by OffPlatformView
        // These listeners are kept for any legacy timer functionality
        this.timerController.addEventListener('timerStarted', (data) => {
            // No-op: OffPlatformView handles display updates automatically
        });

        this.timerController.addEventListener('timerStopped', (data) => {
            // No-op: OffPlatformView handles display updates automatically
        });

        this.timerController.addEventListener('timerUpdated', (data) => {
            // No-op: OffPlatformView handles display updates automatically
        });

        // Search Controller listeners
        this.searchController.addEventListener('searchStarted', () => {
            this.showSearchMode();
        });

        this.searchController.addEventListener('searchCompleted', ({ results }) => {
            this.searchResultsView.renderSearchResults(results, this.searchController.getCurrentQuery());
            this.updateSearchStatistics(results);
        });

        this.searchController.addEventListener('searchCleared', async () => {
            // Don't load notes if we're in the middle of navigating to a specific note
            if (!this.isNavigatingToNote) {
                this.showNormalMode();
                this.noteListView.clear();
                await this.noteController.loadNotesForDate(this.appState.getCurrentDate());
                
                // Restore scroll position immediately after notes are loaded
                if (this.searchScrollPosition) {
                    DOMHelpers.restoreScrollPosition(this.searchScrollPosition, 'instant');
                    this.searchScrollPosition = null;
                }
            }
        });

        this.searchController.addEventListener('navigateToResult', async ({ dateKey, noteId }) => {
            await this.navigateToNote(dateKey, noteId);
        });

        // View listeners
        this.dateNavigationView.addEventListener('dateChanged', ({ newDate }) => {
            this.appState.setCurrentDate(newDate);
        });

        this.searchResultsView.addEventListener('resultClicked', ({ dateKey, noteId }) => {
            this.searchController.navigateToResult(dateKey, noteId);
        });

        // Off-platform view listeners - entry system handles its own timer management
        this.offPlatformView.addEventListener('timerStartRequested', ({ entryId, entryData, categoryId }) => {
            // Handle both new entry-based events and legacy category-based events
            if (categoryId) {
                // Legacy category-based timer
                this.timerController.startTimer(categoryId);
            }
            // Entry-based timers are handled directly by OffPlatformView
        });

        this.offPlatformView.addEventListener('timerStopRequested', ({ entryId, entryData, categoryId }) => {
            // Handle both new entry-based events and legacy category-based events
            if (categoryId) {
                // Legacy category-based timer
                this.timerController.stopTimer(categoryId);
            }
            // Entry-based timers are handled directly by OffPlatformView
        });

        this.offPlatformView.addEventListener('timerEditRequested', async ({ categoryId, label }) => {
            // Keep this for any remaining legacy edit functionality
            if (categoryId) {
                await this.handleTimerEdit(categoryId, label);
            }
        });

        // DOM event listeners
        this.setupSearchInput();
        this.setupThemeListener();

        // Make app globally available for Timer class compatibility
        window.app = this;
    }

    setupSearchInput() {
        // Store scroll position at a higher scope so it persists across search sessions
        this.searchScrollPosition = null;
        
        const debouncedSearch = DOMHelpers.debounce((query) => {
            if (query.trim() === '') {
                this.searchController.clearSearch();
            } else {
                // Save scroll position before first search
                if (!this.searchController.isSearchActive() && !this.searchScrollPosition) {
                    this.searchScrollPosition = DOMHelpers.saveScrollPosition();
                }
                this.searchController.searchNotes(query);
                // Scroll to top when searching
                window.scrollTo(0, 0);
            }
        }, 300);

        this.elements.searchInput.addEventListener('input', () => {
            const query = this.elements.searchInput.value;
            debouncedSearch(query);
        });

        this.elements.clearSearchButton.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.searchController.clearSearch();
        });
    }

    setupThemeListener() {
        document.addEventListener('themeChanged', (event) => {
            const scrollPosition = event.detail?.scrollPosition ?? 
                (window.pageYOffset || document.documentElement.scrollTop);
            
            this.refreshAllViews();
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    window.scrollTo(0, scrollPosition);
                });
            });
        });
    }

    async init() {
        // Render views
        this.noteListView.render(this.elements.container);
        this.searchResultsView.render(this.elements.container);
        this.statisticsView.render(this.elements.statsDisplay, this.elements.projectFailRateDisplay);
        this.dateNavigationView.render(document.body, this.appState.getCurrentDate());
        this.offPlatformView.render(this.elements.offPlatformContainer);

        // Load initial data
        await this.loadCurrentDate();
        this.startTotalTimeUpdater();
    }

    async loadCurrentDate() {
        const currentDate = this.appState.getCurrentDate();
        this.dateNavigationView.setCurrentDate(currentDate);
        this.offPlatformView.setCurrentDate(currentDate);
        await this.noteController.loadNotesForDate(currentDate);
        this.timerController.loadTimerStateForDate(currentDate);
        this.updateStatistics();
        this.updateTotalTimeDisplay().catch(console.error);
    }

    async handleDateChange(newDate) {
        this.dateNavigationView.setCurrentDate(newDate);
        this.offPlatformView.setCurrentDate(newDate);
        
        if (!this.searchController.isSearchActive()) {
            this.showNormalMode();
            this.noteListView.clear(); // Clear the view before loading new notes
            await this.noteController.loadNotesForDate(newDate);
            
            // If we have a pending note to highlight (from navigateToNote), do it now
            if (this.pendingHighlightNote) {
                const noteToHighlight = this.pendingHighlightNote;
                this.pendingHighlightNote = null;
                // Give DOM a moment to render
                setTimeout(() => {
                    this.noteListView.highlightNote(noteToHighlight);
                }, 50);
            }
        } else {
            this.searchController.searchNotes(this.searchController.getCurrentQuery());
        }
        
        this.timerController.loadTimerStateForDate(newDate);
    }

    handleSearchChange(isActive, query) {
        // Don't handle search changes if we're navigating to a note
        if (this.isNavigatingToNote) {
            return;
        }
        
        if (isActive) {
            this.showSearchMode();
        } else {
            // Don't load notes here - the searchCleared event handler will do it
            // This prevents duplicate loading when clearing search
            this.showNormalMode();
        }
    }

    showSearchMode() {
        // Don't clear notes immediately to avoid visual jump
        this.offPlatformView.hide();
        this.hideTotalTimeBar();
        // Only clear if we're not already in search mode
        if (!this.searchResultsView.container?.hasChildNodes()) {
            this.noteListView.clear();
        }
    }

    showNormalMode() {
        this.offPlatformView.show();
        this.showTotalTimeBar();
        this.searchResultsView.clear();
        // Don't load notes here - let the caller decide if notes need to be loaded
    }

    hideTotalTimeBar() {
        const dateTimeBar = this.elements.totalTimeDisplay.parentElement;
        if (dateTimeBar) {
            dateTimeBar.style.display = 'none';
        }
    }

    showTotalTimeBar() {
        const dateTimeBar = this.elements.totalTimeDisplay.parentElement;
        if (dateTimeBar) {
            dateTimeBar.style.display = '';
        }
    }

    updateStatistics() {
        const notes = this.noteController.getNotesForCurrentDate();
        const stats = this.statisticsController.calculateDailyStatistics(notes);
        const projectStats = this.statisticsController.calculateProjectFailRates(notes);
        
        this.statisticsView.renderDailyStatistics(stats);
        this.statisticsView.renderProjectFailRates(projectStats, this.appState.getCurrentDate());
    }

    updateSearchStatistics(results) {
        const stats = this.statisticsController.calculateSearchStatistics(results);
        const projectStats = this.statisticsController.calculateSearchProjectFailRates(results);
        
        this.statisticsView.renderDailyStatistics(stats, true);
        this.statisticsView.renderProjectFailRates(projectStats, null, true);
    }

    async updateTotalTimeDisplay() {
        const onPlatformSeconds = this.timerController.getTotalOnPlatformSeconds(this.noteController);
        const offPlatformSeconds = await this.timerController.getTotalOffPlatformSeconds();
        const totalSeconds = onPlatformSeconds + offPlatformSeconds;
        
        const textMutedClass = this.themeManager.getColor('text', 'muted');
        const textPrimaryClass = this.themeManager.getColor('text', 'primary');
        
        // Clear and rebuild total time display safely
        this.elements.totalTimeDisplay.textContent = '';
        
        const container = SecurityUtils.createElement('div', '', 'flex items-center justify-between gap-4');
        
        // Left side - breakdown
        const breakdown = SecurityUtils.createElement('div', '', `text-sm ${textMutedClass} space-y-1`);
        const onPlatformDiv = SecurityUtils.createElement('div', `On-platform: ${TimeFormatter.formatTime(onPlatformSeconds)}`);
        const offPlatformDiv = SecurityUtils.createElement('div', `Off-platform: ${TimeFormatter.formatTime(offPlatformSeconds)}`);
        breakdown.appendChild(onPlatformDiv);
        breakdown.appendChild(offPlatformDiv);
        
        // Right side - total
        const totalDiv = SecurityUtils.createElement('div', `Total: ${TimeFormatter.formatTime(totalSeconds)}`, `font-semibold text-lg ${textPrimaryClass}`);
        
        container.appendChild(breakdown);
        container.appendChild(totalDiv);
        this.elements.totalTimeDisplay.appendChild(container);
    }

    startTotalTimeUpdater() {
        setInterval(() => {
            this.updateTotalTimeDisplay().catch(console.error);
        }, 1000);
    }

    async handleTimerEdit(categoryId, label) {
        try {
            const currentSeconds = this.timerController.getCurrentSeconds(categoryId);
            const { hours, minutes, seconds } = TimeFormatter.secondsToHMS(currentSeconds);
            
            const result = await this.modalView.createTimerEditModal(categoryId, label, hours, minutes, seconds);
            this.timerController.editTimer(categoryId, result.hours, result.minutes, result.seconds);
        } catch (error) {
            // User cancelled or error occurred
        }
    }

    async navigateToNote(dateKey, noteId) {
        // Set flag to prevent duplicate loads
        this.isNavigatingToNote = true;
        
        // Clear the search state and input
        this.searchController.clearSearch();
        this.elements.searchInput.value = '';
        
        // Show normal mode
        this.showNormalMode();
        
        // Clear and load notes for the target date
        this.noteListView.clear();
        
        // Change date if needed (this updates the UI date display)
        if (this.appState.getCurrentDate() !== dateKey) {
            // Just update the date display, don't trigger full date change
            this.appState.currentDate = dateKey;
            this.dateNavigationView.setCurrentDate(dateKey);
            this.offPlatformView.setCurrentDate(dateKey);
            this.timerController.loadTimerStateForDate(dateKey);
        }
        
        // Load notes for the target date
        await this.noteController.loadNotesForDate(dateKey);
        
        // Reset flag
        this.isNavigatingToNote = false;
        
        // Highlight and scroll to the note immediately
        this.noteListView.highlightNote(noteId);
    }

    refreshAllViews() {
        this.dateNavigationView.updateTheme();
        this.offPlatformView.updateTheme();
        
        // Update total time display with new theme colors
        this.updateTotalTimeDisplay().catch(console.error);
        
        if (this.searchController.isSearchActive()) {
            const results = this.searchController.getSearchResults();
            this.searchResultsView.renderSearchResults(results, this.searchController.getCurrentQuery());
            this.updateSearchStatistics(results);
        } else {
            // Just update statistics - notes handle their own theme updates
            this.updateStatistics();
        }
    }

    // Compatibility methods for existing Timer class
    stopAllTimers() {
        this.noteController.stopAllNoteTimers();
        this.timerController.stopAllTimers();
    }

    stopAllNoteTimers() {
        this.noteController.stopAllNoteTimers();
    }

    updateTotalTime() {
        this.updateTotalTimeDisplay().catch(console.error);
    }

    // Export functionality
    exportToCSV() {
        ExportService.exportAndDownloadNotes();
    }

    // Cleanup
    destroy() {
        this.timerController.cleanup();
        
        // Remove global reference
        if (window.app === this) {
            delete window.app;
        }
    }
}

// Default export for compatibility
export default NoteApp;