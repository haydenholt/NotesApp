export class TimerState {
    constructor() {
        this.timers = new Map(); // timerKey -> timer data
        this.listeners = {
            timerStarted: [],
            timerStopped: [],
            timerUpdated: [],
            timerReset: []
        };
        this.updateIntervals = new Map(); // timerKey -> intervalId
    }

    createTimerKey(date, category) {
        return `${date}_${category}`;
    }

    getTimer(date, category) {
        const key = this.createTimerKey(date, category);
        return this.timers.get(key) || {
            date,
            category,
            startTime: null,
            totalTime: 0,
            isRunning: false
        };
    }

    setTimer(date, category, timerData) {
        const key = this.createTimerKey(date, category);
        this.timers.set(key, { ...timerData, date, category });
        this.notifyListeners('timerUpdated', { date, category, timer: timerData });
    }

    startTimer(date, category) {
        const timer = this.getTimer(date, category);
        
        if (!timer.isRunning) {
            timer.startTime = Date.now();
            timer.isRunning = true;
            this.setTimer(date, category, timer);
            
            this.startUpdateInterval(date, category);
            this.notifyListeners('timerStarted', { date, category, timer });
        }
        
        return timer;
    }

    stopTimer(date, category) {
        const timer = this.getTimer(date, category);
        
        if (timer.isRunning && timer.startTime) {
            const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
            timer.totalTime += elapsed;
            timer.startTime = null;
            timer.isRunning = false;
            this.setTimer(date, category, timer);
            
            this.stopUpdateInterval(date, category);
            this.notifyListeners('timerStopped', { date, category, timer });
        }
        
        return timer;
    }

    resetTimer(date, category) {
        const timer = this.getTimer(date, category);
        const wasRunning = timer.isRunning;
        
        if (wasRunning) {
            this.stopUpdateInterval(date, category);
        }
        
        timer.startTime = null;
        timer.totalTime = 0;
        timer.isRunning = false;
        this.setTimer(date, category, timer);
        
        this.notifyListeners('timerReset', { date, category, timer });
        return timer;
    }

    editTimer(date, category, hours, minutes, seconds) {
        const timer = this.getTimer(date, category);
        const wasRunning = timer.isRunning;
        
        if (wasRunning) {
            this.stopUpdateInterval(date, category);
        }
        
        timer.totalTime = (hours * 3600) + (minutes * 60) + seconds;
        
        if (wasRunning) {
            timer.startTime = Date.now();
            this.startUpdateInterval(date, category);
        }
        
        this.setTimer(date, category, timer);
        this.notifyListeners('timerUpdated', { date, category, timer });
        
        return timer;
    }

    getCurrentSeconds(date, category) {
        const timer = this.getTimer(date, category);
        let totalSeconds = timer.totalTime;
        
        if (timer.isRunning && timer.startTime) {
            const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
            totalSeconds += elapsed;
        }
        
        return totalSeconds;
    }

    isTimerRunning(date, category) {
        const timer = this.getTimer(date, category);
        return timer.isRunning;
    }

    getRunningTimers(date) {
        const runningTimers = [];
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        
        categories.forEach(category => {
            if (this.isTimerRunning(date, category)) {
                runningTimers.push({ category, timer: this.getTimer(date, category) });
            }
        });
        
        return runningTimers;
    }

    getTotalSecondsForDate(date) {
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        return categories.reduce((total, category) => {
            return total + this.getCurrentSeconds(date, category);
        }, 0);
    }

    stopAllTimersForDate(date) {
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        categories.forEach(category => {
            if (this.isTimerRunning(date, category)) {
                this.stopTimer(date, category);
            }
        });
    }

    startUpdateInterval(date, category) {
        const key = this.createTimerKey(date, category);
        
        if (this.updateIntervals.has(key)) {
            clearInterval(this.updateIntervals.get(key));
        }
        
        const intervalId = setInterval(() => {
            if (this.isTimerRunning(date, category)) {
                this.notifyListeners('timerUpdated', { 
                    date, 
                    category, 
                    timer: this.getTimer(date, category),
                    isLiveUpdate: true
                });
            } else {
                this.stopUpdateInterval(date, category);
            }
        }, 1000);
        
        this.updateIntervals.set(key, intervalId);
    }

    stopUpdateInterval(date, category) {
        const key = this.createTimerKey(date, category);
        const intervalId = this.updateIntervals.get(key);
        
        if (intervalId) {
            clearInterval(intervalId);
            this.updateIntervals.delete(key);
        }
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
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    cleanup() {
        this.updateIntervals.forEach(intervalId => clearInterval(intervalId));
        this.updateIntervals.clear();
        this.timers.clear();
    }
}