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
import { ExportService } from './data/ExportService.js';
import { DOMHelpers } from './utils/DOMHelpers.js';
import { TimeFormatter } from './utils/TimeFormatter.js';
import Timer from '../ui/components/Timer.js';

export class NoteApp {
    constructor(themeManager) {
        this.themeManager = themeManager;
        
        // Initialize state
        this.appState = new AppState();
        
        // Initialize controllers
        this.noteController = new NoteController(this.appState, this.themeManager);
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
        this.appState.addEventListener('dateChange', ({ newDate }) => {
            this.handleDateChange(newDate);
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

        this.noteController.addEventListener('noteDeleted', () => {
            this.updateStatistics();
            this.noteListView.scrollToBottom();
        });

        this.noteController.addEventListener('notesClearing', () => {
            this.noteListView.clear();
        });

        this.noteController.addEventListener('noteEdited', () => {
            this.updateStatistics();
        });

        // Timer Controller listeners
        this.timerController.addEventListener('totalTimeChanged', () => {
            this.updateTotalTimeDisplay();
        });

        this.timerController.addEventListener('timerStarted', (data) => {
            this.offPlatformView.updateTimerDisplay(data.category, 
                this.timerController.formatTime(this.timerController.getCurrentSeconds(data.category)), 
                true
            );
        });

        this.timerController.addEventListener('timerStopped', (data) => {
            this.offPlatformView.updateTimerDisplay(data.category, 
                this.timerController.formatTime(this.timerController.getCurrentSeconds(data.category)), 
                false
            );
        });

        this.timerController.addEventListener('timerUpdated', (data) => {
            const timeText = this.timerController.formatTime(this.timerController.getCurrentSeconds(data.category));
            this.offPlatformView.updateTimerDisplay(data.category, timeText, data.timer.isRunning);
            this.offPlatformView.updateStickyTimer(data.category, timeText);
        });

        // Search Controller listeners
        this.searchController.addEventListener('searchStarted', () => {
            this.showSearchMode();
        });

        this.searchController.addEventListener('searchCompleted', ({ results }) => {
            this.searchResultsView.renderSearchResults(results, this.searchController.getCurrentQuery());
            this.updateSearchStatistics(results);
        });

        this.searchController.addEventListener('searchCleared', () => {
            this.showNormalMode();
            this.noteListView.clear();
            this.noteController.loadNotesForDate(this.appState.getCurrentDate());
        });

        this.searchController.addEventListener('navigateToResult', ({ dateKey, noteId }) => {
            this.navigateToNote(dateKey, noteId);
        });

        // View listeners
        this.dateNavigationView.addEventListener('dateChanged', ({ newDate }) => {
            this.appState.setCurrentDate(newDate);
        });

        this.searchResultsView.addEventListener('resultClicked', ({ dateKey, noteId }) => {
            this.searchController.navigateToResult(dateKey, noteId);
        });

        this.offPlatformView.addEventListener('timerStartRequested', ({ categoryId }) => {
            this.timerController.startTimer(categoryId);
        });

        this.offPlatformView.addEventListener('timerStopRequested', ({ categoryId }) => {
            this.timerController.stopTimer(categoryId);
        });

        this.offPlatformView.addEventListener('timerEditRequested', async ({ categoryId, label }) => {
            await this.handleTimerEdit(categoryId, label);
        });

        // DOM event listeners
        this.setupSearchInput();
        this.setupThemeListener();

        // Make app globally available for Timer class compatibility
        window.app = this;
    }

    setupSearchInput() {
        const debouncedSearch = DOMHelpers.debounce((query) => {
            if (query.trim() === '') {
                this.searchController.clearSearch();
            } else {
                this.searchController.searchNotes(query);
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
        await this.noteController.loadNotesForDate(currentDate);
        this.timerController.loadTimerStateForDate(currentDate);
        this.updateStatistics();
        this.updateTotalTimeDisplay();
    }

    handleDateChange(newDate) {
        this.dateNavigationView.setCurrentDate(newDate);
        
        if (!this.searchController.isSearchActive()) {
            this.showNormalMode();
            this.noteListView.clear(); // Clear the view before loading new notes
            this.noteController.loadNotesForDate(newDate);
        } else {
            this.searchController.searchNotes(this.searchController.getCurrentQuery());
        }
        
        this.timerController.loadTimerStateForDate(newDate);
    }

    handleSearchChange(isActive, query) {
        if (isActive) {
            this.showSearchMode();
        } else {
            this.showNormalMode();
            this.noteListView.clear();
            this.noteController.loadNotesForDate(this.appState.getCurrentDate());
        }
    }

    showSearchMode() {
        this.offPlatformView.hide();
        this.hideTotalTimeBar();
        this.noteListView.clear();
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

    updateTotalTimeDisplay() {
        const onPlatformSeconds = this.timerController.getTotalOnPlatformSeconds(this.noteController);
        const offPlatformSeconds = this.timerController.getTotalOffPlatformSeconds();
        const totalSeconds = onPlatformSeconds + offPlatformSeconds;
        
        this.elements.totalTimeDisplay.innerHTML = `
            <div class="flex items-center justify-between gap-4">
                <div class="text-sm text-gray-600 space-y-1">
                    <div>On-platform: ${TimeFormatter.formatTime(onPlatformSeconds)}</div>
                    <div>Off-platform: ${TimeFormatter.formatTime(offPlatformSeconds)}</div>
                </div>
                <div class="font-semibold text-lg">Total: ${TimeFormatter.formatTime(totalSeconds)}</div>
            </div>
        `;
    }

    startTotalTimeUpdater() {
        setInterval(() => {
            this.updateTotalTimeDisplay();
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
            console.log('Timer edit cancelled or failed:', error.message);
        }
    }

    navigateToNote(dateKey, noteId) {
        this.appState.setCurrentDate(dateKey);
        this.elements.searchInput.value = '';
        
        setTimeout(() => {
            this.noteListView.highlightNote(noteId);
        }, 100);
    }

    refreshAllViews() {
        this.dateNavigationView.updateTheme();
        this.offPlatformView.updateTheme();
        
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
        this.updateTotalTimeDisplay();
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