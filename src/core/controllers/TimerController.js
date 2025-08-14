import { TimerRepository } from '../data/TimerRepository.js';
import { TimerEntryRepository } from '../data/TimerEntryRepository.js';
import { TimerState } from '../state/TimerState.js';
import { TimeFormatter } from '../utils/TimeFormatter.js';

export class TimerController {
    constructor(appState, themeManager) {
        this.appState = appState;
        this.themeManager = themeManager;
        this.timerState = new TimerState();
        
        this.listeners = {
            timerStarted: [],
            timerStopped: [],
            timerUpdated: [],
            totalTimeChanged: []
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.appState.addEventListener('dateChange', ({ newDate }) => {
            this.loadTimerStateForDate(newDate);
            this.updateTotalTime();
        });

        this.timerState.addEventListener('timerStarted', (data) => {
            TimerRepository.startTimer(data.date, data.category);
            this.notifyListeners('timerStarted', data);
            this.updateTotalTime();
        });

        this.timerState.addEventListener('timerStopped', (data) => {
            TimerRepository.stopTimer(data.date, data.category);
            this.notifyListeners('timerStopped', data);
            this.updateTotalTime();
        });

        this.timerState.addEventListener('timerUpdated', (data) => {
            if (!data.isLiveUpdate) {
                TimerRepository.saveTimerState(data.date, data.category, data.timer);
            }
            this.notifyListeners('timerUpdated', data);
            this.updateTotalTime();
        });
    }

    loadTimerStateForDate(date) {
        // Load both legacy and new entry data
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        
        // Load legacy timers for compatibility
        categories.forEach(category => {
            const savedState = TimerRepository.getTimerState(date, category);
            this.timerState.setTimer(date, category, {
                startTime: savedState.startTime,
                totalTime: savedState.totalTime,
                isRunning: !!savedState.startTime
            });
            
            if (savedState.startTime) {
                this.timerState.startUpdateInterval(date, category);
            }
        });

        // Entries are handled by OffPlatformView directly now
        this.updateTotalTime();
    }

    startTimer(category, date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        
        const otherCategories = ['projectTraining', 'sheetwork', 'blocked']
            .filter(cat => cat !== category);
        
        otherCategories.forEach(otherCategory => {
            if (this.timerState.isTimerRunning(timerDate, otherCategory)) {
                this.stopTimer(otherCategory, timerDate);
            }
        });

        const timer = this.timerState.startTimer(timerDate, category);
        
        return timer;
    }

    stopTimer(category, date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        const timer = this.timerState.stopTimer(timerDate, category);
        return timer;
    }

    editTimer(category, hours, minutes, seconds, date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        const timer = this.timerState.editTimer(timerDate, category, hours, minutes, seconds);
        
        return timer;
    }

    getCurrentSeconds(category, date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        return this.timerState.getCurrentSeconds(timerDate, category);
    }

    isTimerRunning(category, date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        return this.timerState.isTimerRunning(timerDate, category);
    }

    getRunningTimers(date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        return this.timerState.getRunningTimers(timerDate);
    }

    getTotalOffPlatformSeconds(date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        
        // Use new entry-based system
        const entrySeconds = TimerEntryRepository.getTotalSecondsForDate(timerDate);
        
        // Also include any legacy timer state for backward compatibility
        const legacySeconds = this.timerState.getTotalSecondsForDate(timerDate);
        
        return entrySeconds + legacySeconds;
    }

    getTotalOnPlatformSeconds(noteController) {
        const notes = noteController.getNotesForCurrentDate();
        return notes.reduce((total, note) => total + note.timer.getSeconds(), 0);
    }

    getTotalSeconds(noteController) {
        const onPlatformSeconds = this.getTotalOnPlatformSeconds(noteController);
        const offPlatformSeconds = this.getTotalOffPlatformSeconds();
        return onPlatformSeconds + offPlatformSeconds;
    }

    formatTime(seconds) {
        return TimeFormatter.formatTime(seconds);
    }

    stopAllTimers(date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        this.timerState.stopAllTimersForDate(timerDate);
        
        // Stop all running entries
        TimerEntryRepository.stopAllRunningEntries(timerDate);
    }

    // Legacy method for compatibility - returns null since we no longer use OffPlatformTimer
    getOffPlatformTimer() {
        return null;
    }

    updateTotalTime() {
        this.notifyListeners('totalTimeChanged', {
            date: this.appState.getCurrentDate()
        });
    }

    // Legacy method for compatibility - returns empty object
    getTimerDisplayElements() {
        return {};
    }

    // Legacy method for compatibility - no-op since displays are handled by OffPlatformView
    updateTimerDisplays() {
        // Display updates are now handled by OffPlatformView and OffPlatformEntryList
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
                    console.error(`Error in TimerController ${event} listener:`, error);
                }
            });
        }
    }

    cleanup() {
        this.timerState.cleanup();
    }
}