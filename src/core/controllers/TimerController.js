import { TimerRepository } from '../data/TimerRepository.js';
import { TimerState } from '../state/TimerState.js';
import { TimeFormatter } from '../utils/TimeFormatter.js';
import OffPlatformTimer from '../../ui/components/OffPlatformTimer.js';

export class TimerController {
    constructor(appState, themeManager) {
        this.appState = appState;
        this.themeManager = themeManager;
        this.timerState = new TimerState();
        this.offPlatformTimer = new OffPlatformTimer(themeManager);
        
        this.listeners = {
            timerStarted: [],
            timerStopped: [],
            timerUpdated: [],
            totalTimeChanged: []
        };
        
        this.setupEventListeners();
        this.setupOffPlatformTimer();
    }

    setupEventListeners() {
        this.appState.addEventListener('dateChange', ({ newDate }) => {
            this.loadTimerStateForDate(newDate);
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

    setupOffPlatformTimer() {
        this.offPlatformTimer.currentDate = this.appState.getCurrentDate();
        
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        categories.forEach(category => {
            this.offPlatformTimer.onStart(category, () => {
                this.startTimer(category);
            });
            
            this.offPlatformTimer.onStop(category, () => {
                this.stopTimer(category);
            });
        });
    }

    loadTimerStateForDate(date) {
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        
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

        this.offPlatformTimer.currentDate = date;
        this.offPlatformTimer.loadTimerState();
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
        this.offPlatformTimer.startTimer(category);
        
        return timer;
    }

    stopTimer(category, date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        const timer = this.timerState.stopTimer(timerDate, category);
        this.offPlatformTimer.stopTimer(category);
        return timer;
    }

    editTimer(category, hours, minutes, seconds, date = null) {
        const timerDate = date || this.appState.getCurrentDate();
        const timer = this.timerState.editTimer(timerDate, category, hours, minutes, seconds);
        
        const totalSeconds = TimeFormatter.parseTimeInput(hours, minutes, seconds);
        const { hours: h, minutes: m, seconds: s } = TimeFormatter.secondsToHMS(totalSeconds);
        this.offPlatformTimer.editTimer(category, h, m, s);
        
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
        return this.timerState.getTotalSecondsForDate(timerDate);
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
        this.offPlatformTimer.stopAllTimers();
    }

    getOffPlatformTimer() {
        return this.offPlatformTimer;
    }

    updateTotalTime() {
        this.notifyListeners('totalTimeChanged', {
            date: this.appState.getCurrentDate()
        });
    }

    getTimerDisplayElements() {
        return this.offPlatformTimer.displayElements;
    }

    updateTimerDisplays() {
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        categories.forEach(category => {
            this.offPlatformTimer.updateDisplay(category);
        });
        this.offPlatformTimer.updateTotalDisplay();
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