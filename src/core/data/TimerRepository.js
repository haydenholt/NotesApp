import { SecureStorage } from './SecureStorage.js';

export class TimerRepository {
    static getOffPlatformKey(dateKey) {
        return `offPlatform_${dateKey}`;
    }

    static async getOffPlatformData(dateKey) {
        try {
            const key = this.getOffPlatformKey(dateKey);
            const data = await SecureStorage.getItem(key);
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

    static async getTimerState(dateKey, category) {
        try {
            const offPlatformData = await this.getOffPlatformData(dateKey);
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

    static async saveTimerState(dateKey, category, state) {
        try {
            const offPlatformData = await this.getOffPlatformData(dateKey);
            offPlatformData.timers[category] = {
                startTime: state.startTime,
                totalSeconds: state.totalTime
            };
            const key = this.getOffPlatformKey(dateKey);
            await SecureStorage.setItem(key, JSON.stringify(offPlatformData));
            return true;
        } catch (error) {
            console.error('Error saving timer state:', dateKey, category, error);
            return false;
        }
    }

    static async getAllTimerStatesForDate(dateKey) {
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        const states = {};
        
        for (const category of categories) {
            states[category] = await this.getTimerState(dateKey, category);
        }
        
        return states;
    }

    static async startTimer(dateKey, category) {
        const state = await this.getTimerState(dateKey, category);
        state.startTime = Date.now();
        return await this.saveTimerState(dateKey, category, state);
    }

    static async stopTimer(dateKey, category) {
        const state = await this.getTimerState(dateKey, category);
        if (state.startTime) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            state.totalTime += elapsed;
            state.startTime = null;
        }
        return await this.saveTimerState(dateKey, category, state);
    }

    static async setTimer(dateKey, category, hours, minutes, seconds) {
        const state = await this.getTimerState(dateKey, category);
        const wasRunning = !!state.startTime;
        
        state.totalTime = (hours * 3600) + (minutes * 60) + seconds;
        
        if (wasRunning) {
            state.startTime = Date.now();
        }
        
        return await this.saveTimerState(dateKey, category, state);
    }

    static async getCurrentSeconds(dateKey, category) {
        const state = await this.getTimerState(dateKey, category);
        let totalSeconds = state.totalTime;
        
        if (state.startTime) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            totalSeconds += elapsed;
        }
        
        return totalSeconds;
    }

    static async isRunning(dateKey, category) {
        const state = await this.getTimerState(dateKey, category);
        return !!state.startTime;
    }

    static async getTotalSecondsForDate(dateKey) {
        const categories = ['projectTraining', 'sheetwork', 'blocked'];
        let total = 0;
        for (const category of categories) {
            total += await this.getCurrentSeconds(dateKey, category);
        }
        return total;
    }
}