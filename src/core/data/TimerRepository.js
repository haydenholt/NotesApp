export class TimerRepository {
    static getOffPlatformKey(dateKey) {
        return `offPlatform_${dateKey}`;
    }

    static getOffPlatformData(dateKey) {
        try {
            const key = this.getOffPlatformKey(dateKey);
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : {
                timers: {
                    projectTraining: {
                        startTime: null,
                        totalSeconds: 0
                    },
                    sheetwork: {
                        startTime: null,
                        totalSeconds: 0
                    },
                    blocked: {
                        startTime: null,
                        totalSeconds: 0
                    }
                }
            };
        } catch (error) {
            console.error('Error loading off-platform data:', dateKey, error);
            return {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 0 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
        }
    }

    static getTimerState(dateKey, category) {
        try {
            const offPlatformData = this.getOffPlatformData(dateKey);
            const timer = offPlatformData.timers[category];
            return timer ? {
                startTime: timer.startTime,
                totalTime: timer.totalSeconds
            } : {
                startTime: null,
                totalTime: 0
            };
        } catch (error) {
            console.error('Error loading timer state:', dateKey, category, error);
            return {
                startTime: null,
                totalTime: 0
            };
        }
    }

    static saveTimerState(dateKey, category, state) {
        try {
            const offPlatformData = this.getOffPlatformData(dateKey);
            offPlatformData.timers[category] = {
                startTime: state.startTime,
                totalSeconds: state.totalTime
            };
            const key = this.getOffPlatformKey(dateKey);
            localStorage.setItem(key, JSON.stringify(offPlatformData));
            return true;
        } catch (error) {
            console.error('Error saving timer state:', dateKey, category, error);
            return false;
        }
    }

    static getAllTimerStatesForDate(dateKey) {
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        const states = {};
        
        categories.forEach(category => {
            states[category] = this.getTimerState(dateKey, category);
        });
        
        return states;
    }

    static startTimer(dateKey, category) {
        const state = this.getTimerState(dateKey, category);
        state.startTime = Date.now();
        return this.saveTimerState(dateKey, category, state);
    }

    static stopTimer(dateKey, category) {
        const state = this.getTimerState(dateKey, category);
        if (state.startTime) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            state.totalTime += elapsed;
            state.startTime = null;
        }
        return this.saveTimerState(dateKey, category, state);
    }

    static setTimer(dateKey, category, hours, minutes, seconds) {
        const state = this.getTimerState(dateKey, category);
        const wasRunning = !!state.startTime;
        
        state.totalTime = (hours * 3600) + (minutes * 60) + seconds;
        
        if (wasRunning) {
            state.startTime = Date.now();
        }
        
        return this.saveTimerState(dateKey, category, state);
    }

    static getCurrentSeconds(dateKey, category) {
        const state = this.getTimerState(dateKey, category);
        let totalSeconds = state.totalTime;
        
        if (state.startTime) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            totalSeconds += elapsed;
        }
        
        return totalSeconds;
    }

    static isRunning(dateKey, category) {
        const state = this.getTimerState(dateKey, category);
        return !!state.startTime;
    }

    static getTotalSecondsForDate(dateKey) {
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        return categories.reduce((total, category) => {
            return total + this.getCurrentSeconds(dateKey, category);
        }, 0);
    }
}