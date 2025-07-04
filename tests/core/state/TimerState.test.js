/**
 * @jest-environment jsdom
 */

import { TimerState } from '../../../src/core/state/TimerState.js';

describe('TimerState', () => {
    let timerState;
    let mockDateNow;
    let dateNowSpy;

    beforeEach(() => {
        jest.useFakeTimers();
        mockDateNow = 1000000; // Fixed timestamp for testing
        dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockDateNow);
        timerState = new TimerState();
    });

    afterEach(() => {
        jest.useRealTimers();
        dateNowSpy.mockRestore();
    });

    describe('constructor', () => {
        it('should initialize with empty maps and listeners', () => {
            expect(timerState.timers).toBeInstanceOf(Map);
            expect(timerState.updateIntervals).toBeInstanceOf(Map);
            expect(timerState.timers.size).toBe(0);
            expect(timerState.updateIntervals.size).toBe(0);
            expect(timerState.listeners).toEqual({
                timerStarted: [],
                timerStopped: [],
                timerUpdated: [],
                timerReset: []
            });
        });
    });

    describe('timer key management', () => {
        it('should create timer key from date and category', () => {
            const key = timerState.createTimerKey('2024-01-15', 'projectTraining');
            expect(key).toBe('2024-01-15_projectTraining');
        });
    });

    describe('timer retrieval', () => {
        it('should return default timer for non-existent timer', () => {
            const timer = timerState.getTimer('2024-01-15', 'projectTraining');
            
            expect(timer).toEqual({
                date: '2024-01-15',
                category: 'projectTraining',
                startTime: null,
                totalTime: 0,
                isRunning: false
            });
        });

        it('should return existing timer', () => {
            const timerData = {
                startTime: 123456,
                totalTime: 300,
                isRunning: true
            };
            
            timerState.setTimer('2024-01-15', 'projectTraining', timerData);
            const timer = timerState.getTimer('2024-01-15', 'projectTraining');
            
            expect(timer).toEqual({
                date: '2024-01-15',
                category: 'projectTraining',
                startTime: 123456,
                totalTime: 300,
                isRunning: true
            });
        });
    });

    describe('setTimer', () => {
        it('should set timer and notify listeners', () => {
            const callback = jest.fn();
            timerState.addEventListener('timerUpdated', callback);

            const timerData = {
                startTime: 123456,
                totalTime: 300,
                isRunning: true
            };

            timerState.setTimer('2024-01-15', 'projectTraining', timerData);

            const key = '2024-01-15_projectTraining';
            expect(timerState.timers.get(key)).toEqual({
                date: '2024-01-15',
                category: 'projectTraining',
                startTime: 123456,
                totalTime: 300,
                isRunning: true
            });

            expect(callback).toHaveBeenCalledWith({
                date: '2024-01-15',
                category: 'projectTraining',
                timer: timerData
            });
        });
    });

    describe('startTimer', () => {
        it('should start new timer', () => {
            const callback = jest.fn();
            timerState.addEventListener('timerStarted', callback);

            const timer = timerState.startTimer('2024-01-15', 'projectTraining');

            expect(timer.startTime).toBe(mockDateNow);
            expect(timer.isRunning).toBe(true);
            expect(timer.totalTime).toBe(0);
            expect(callback).toHaveBeenCalledWith({
                date: '2024-01-15',
                category: 'projectTraining',
                timer
            });
        });

        it('should not restart already running timer', () => {
            const originalStartTime = 999999;
            const timerData = {
                startTime: originalStartTime,
                totalTime: 100,
                isRunning: true
            };
            
            timerState.setTimer('2024-01-15', 'projectTraining', timerData);
            
            const callback = jest.fn();
            timerState.addEventListener('timerStarted', callback);

            const timer = timerState.startTimer('2024-01-15', 'projectTraining');

            expect(timer.startTime).toBe(originalStartTime); // Should not change
            expect(callback).not.toHaveBeenCalled();
        });

        it('should start update interval when timer starts', () => {
            timerState.startTimer('2024-01-15', 'projectTraining');

            const key = '2024-01-15_projectTraining';
            expect(timerState.updateIntervals.has(key)).toBe(true);
        });
    });

    describe('stopTimer', () => {
        beforeEach(() => {
            // Set up a running timer
            timerState.startTimer('2024-01-15', 'projectTraining');
            // Advance time by 60 seconds
            mockDateNow += 60000;
            dateNowSpy.mockReturnValue(mockDateNow);
        });

        it('should stop running timer and add elapsed time', () => {
            const callback = jest.fn();
            timerState.addEventListener('timerStopped', callback);

            const timer = timerState.stopTimer('2024-01-15', 'projectTraining');

            expect(timer.startTime).toBe(null);
            expect(timer.isRunning).toBe(false);
            expect(timer.totalTime).toBe(60); // 60 seconds elapsed
            expect(callback).toHaveBeenCalledWith({
                date: '2024-01-15',
                category: 'projectTraining',
                timer
            });
        });

        it('should stop update interval when timer stops', () => {
            timerState.stopTimer('2024-01-15', 'projectTraining');

            const key = '2024-01-15_projectTraining';
            expect(timerState.updateIntervals.has(key)).toBe(false);
        });

        it('should do nothing for non-running timer', () => {
            // Stop the timer first
            timerState.stopTimer('2024-01-15', 'projectTraining');
            
            const callback = jest.fn();
            timerState.addEventListener('timerStopped', callback);

            const timer = timerState.stopTimer('2024-01-15', 'projectTraining');

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('resetTimer', () => {
        it('should reset running timer', () => {
            // Start timer and add some total time
            timerState.startTimer('2024-01-15', 'projectTraining');
            const timer = timerState.getTimer('2024-01-15', 'projectTraining');
            timer.totalTime = 300;
            timerState.setTimer('2024-01-15', 'projectTraining', timer);

            const callback = jest.fn();
            timerState.addEventListener('timerReset', callback);

            const resetTimer = timerState.resetTimer('2024-01-15', 'projectTraining');

            expect(resetTimer.startTime).toBe(null);
            expect(resetTimer.isRunning).toBe(false);
            expect(resetTimer.totalTime).toBe(0);
            expect(callback).toHaveBeenCalledWith({
                date: '2024-01-15',
                category: 'projectTraining',
                timer: resetTimer
            });
        });

        it('should stop update interval when resetting running timer', () => {
            timerState.startTimer('2024-01-15', 'projectTraining');
            timerState.resetTimer('2024-01-15', 'projectTraining');

            const key = '2024-01-15_projectTraining';
            expect(timerState.updateIntervals.has(key)).toBe(false);
        });

        it('should reset stopped timer', () => {
            const timerData = {
                startTime: null,
                totalTime: 500,
                isRunning: false
            };
            timerState.setTimer('2024-01-15', 'projectTraining', timerData);

            const resetTimer = timerState.resetTimer('2024-01-15', 'projectTraining');

            expect(resetTimer.totalTime).toBe(0);
        });
    });

    describe('editTimer', () => {
        it('should edit stopped timer time', () => {
            const callback = jest.fn();
            timerState.addEventListener('timerUpdated', callback);

            const timer = timerState.editTimer('2024-01-15', 'projectTraining', 1, 30, 45);

            expect(timer.totalTime).toBe(5445); // 1*3600 + 30*60 + 45
            expect(timer.isRunning).toBe(false);
            expect(callback).toHaveBeenCalledWith({
                date: '2024-01-15',
                category: 'projectTraining',
                timer
            });
        });

        it('should edit running timer and preserve running state', () => {
            // Start timer first
            timerState.startTimer('2024-01-15', 'projectTraining');
            const originalStartTime = mockDateNow;
            
            // Advance time for the edit
            mockDateNow += 5000;
            dateNowSpy.mockReturnValue(mockDateNow);

            const timer = timerState.editTimer('2024-01-15', 'projectTraining', 0, 10, 0);

            expect(timer.totalTime).toBe(600); // 10 minutes
            expect(timer.isRunning).toBe(true);
            expect(timer.startTime).toBe(mockDateNow); // New start time
            expect(timer.startTime).not.toBe(originalStartTime);
        });

        it('should manage update intervals for running timers', () => {
            timerState.startTimer('2024-01-15', 'projectTraining');
            
            const key = '2024-01-15_projectTraining';
            const originalIntervalId = timerState.updateIntervals.get(key);

            timerState.editTimer('2024-01-15', 'projectTraining', 1, 0, 0);

            // Should have a new interval ID
            const newIntervalId = timerState.updateIntervals.get(key);
            expect(newIntervalId).toBeDefined();
            expect(newIntervalId).not.toBe(originalIntervalId);
        });
    });

    describe('getCurrentSeconds', () => {
        it('should return total time for stopped timer', () => {
            const timerData = {
                startTime: null,
                totalTime: 300,
                isRunning: false
            };
            timerState.setTimer('2024-01-15', 'projectTraining', timerData);

            const seconds = timerState.getCurrentSeconds('2024-01-15', 'projectTraining');

            expect(seconds).toBe(300);
        });

        it('should return total time plus elapsed for running timer', () => {
            // Start timer
            timerState.startTimer('2024-01-15', 'projectTraining');
            const timer = timerState.getTimer('2024-01-15', 'projectTraining');
            timer.totalTime = 200;
            timerState.setTimer('2024-01-15', 'projectTraining', timer);

            // Advance time by 100 seconds
            mockDateNow += 100000;
            dateNowSpy.mockReturnValue(mockDateNow);

            const seconds = timerState.getCurrentSeconds('2024-01-15', 'projectTraining');

            expect(seconds).toBe(300); // 200 + 100
        });

        it('should return 0 for non-existent timer', () => {
            const seconds = timerState.getCurrentSeconds('2024-01-15', 'projectTraining');

            expect(seconds).toBe(0);
        });
    });

    describe('isTimerRunning', () => {
        it('should return true for running timer', () => {
            timerState.startTimer('2024-01-15', 'projectTraining');

            expect(timerState.isTimerRunning('2024-01-15', 'projectTraining')).toBe(true);
        });

        it('should return false for stopped timer', () => {
            const timerData = {
                startTime: null,
                totalTime: 300,
                isRunning: false
            };
            timerState.setTimer('2024-01-15', 'projectTraining', timerData);

            expect(timerState.isTimerRunning('2024-01-15', 'projectTraining')).toBe(false);
        });

        it('should return false for non-existent timer', () => {
            expect(timerState.isTimerRunning('2024-01-15', 'projectTraining')).toBe(false);
        });
    });

    describe('getRunningTimers', () => {
        it('should return running timers for date', () => {
            timerState.startTimer('2024-01-15', 'projectTraining');
            timerState.startTimer('2024-01-15', 'sheetwork');
            
            // Set up a stopped timer
            const stoppedTimer = {
                startTime: null,
                totalTime: 100,
                isRunning: false
            };
            timerState.setTimer('2024-01-15', 'blocked', stoppedTimer);

            const runningTimers = timerState.getRunningTimers('2024-01-15');

            expect(runningTimers).toHaveLength(2);
            expect(runningTimers.map(t => t.category)).toContain('projectTraining');
            expect(runningTimers.map(t => t.category)).toContain('sheetwork');
            expect(runningTimers.map(t => t.category)).not.toContain('blocked');
        });

        it('should return empty array when no timers are running', () => {
            const runningTimers = timerState.getRunningTimers('2024-01-15');

            expect(runningTimers).toEqual([]);
        });
    });

    describe('getTotalSecondsForDate', () => {
        it('should return sum of all category times', () => {
            // Set up different timer states
            const timer1 = { startTime: null, totalTime: 300, isRunning: false };
            const timer2 = { startTime: mockDateNow - 100000, totalTime: 200, isRunning: true }; // Running for 100 seconds
            const timer3 = { startTime: null, totalTime: 150, isRunning: false };

            timerState.setTimer('2024-01-15', 'projectTraining', timer1);
            timerState.setTimer('2024-01-15', 'sheetwork', timer2);
            timerState.setTimer('2024-01-15', 'blocked', timer3);

            const total = timerState.getTotalSecondsForDate('2024-01-15');

            expect(total).toBe(750); // 300 + (200 + 100) + 150
        });

        it('should return 0 for date with no timers', () => {
            const total = timerState.getTotalSecondsForDate('2024-01-15');

            expect(total).toBe(0);
        });
    });

    describe('stopAllTimersForDate', () => {
        it('should stop all running timers for date', () => {
            timerState.startTimer('2024-01-15', 'projectTraining');
            timerState.startTimer('2024-01-15', 'sheetwork');
            
            const stoppedTimer = {
                startTime: null,
                totalTime: 100,
                isRunning: false
            };
            timerState.setTimer('2024-01-15', 'blocked', stoppedTimer);

            timerState.stopAllTimersForDate('2024-01-15');

            expect(timerState.isTimerRunning('2024-01-15', 'projectTraining')).toBe(false);
            expect(timerState.isTimerRunning('2024-01-15', 'sheetwork')).toBe(false);
            expect(timerState.isTimerRunning('2024-01-15', 'blocked')).toBe(false);
        });

        it('should handle date with no running timers', () => {
            expect(() => {
                timerState.stopAllTimersForDate('2024-01-15');
            }).not.toThrow();
        });
    });

    describe('update intervals', () => {
        it('should start update interval and notify listeners', () => {
            const callback = jest.fn();
            timerState.addEventListener('timerUpdated', callback);

            timerState.startTimer('2024-01-15', 'projectTraining');

            // Fast-forward time to trigger interval
            jest.advanceTimersByTime(1000);

            expect(callback).toHaveBeenCalledWith({
                date: '2024-01-15',
                category: 'projectTraining',
                timer: expect.any(Object),
                isLiveUpdate: true
            });
        });

        it('should clear existing interval when starting new one', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            timerState.startUpdateInterval('2024-01-15', 'projectTraining');
            timerState.startUpdateInterval('2024-01-15', 'projectTraining');

            expect(clearIntervalSpy).toHaveBeenCalled();
        });

        it('should stop update interval and clean up', () => {
            timerState.startUpdateInterval('2024-01-15', 'projectTraining');
            const key = '2024-01-15_projectTraining';
            
            expect(timerState.updateIntervals.has(key)).toBe(true);

            timerState.stopUpdateInterval('2024-01-15', 'projectTraining');

            expect(timerState.updateIntervals.has(key)).toBe(false);
        });

        it('should auto-stop interval when timer is no longer running', () => {
            timerState.startTimer('2024-01-15', 'projectTraining');
            timerState.stopTimer('2024-01-15', 'projectTraining');

            const key = '2024-01-15_projectTraining';
            
            // Manually start interval to test auto-stop behavior
            timerState.startUpdateInterval('2024-01-15', 'projectTraining');
            
            // Fast-forward time to trigger interval check
            jest.advanceTimersByTime(1000);

            expect(timerState.updateIntervals.has(key)).toBe(false);
        });

        it('should handle stopping non-existent interval', () => {
            expect(() => {
                timerState.stopUpdateInterval('2024-01-15', 'nonexistent');
            }).not.toThrow();
        });
    });

    describe('event handling', () => {
        it('should add and remove event listeners', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            timerState.addEventListener('timerStarted', callback1);
            timerState.addEventListener('timerStarted', callback2);

            expect(timerState.listeners.timerStarted).toContain(callback1);
            expect(timerState.listeners.timerStarted).toContain(callback2);

            timerState.removeEventListener('timerStarted', callback1);

            expect(timerState.listeners.timerStarted).not.toContain(callback1);
            expect(timerState.listeners.timerStarted).toContain(callback2);
        });

        it('should handle invalid event types gracefully', () => {
            expect(() => {
                timerState.addEventListener('invalidEvent', jest.fn());
                timerState.removeEventListener('invalidEvent', jest.fn());
            }).not.toThrow();
        });

        it('should notify listeners and handle errors', () => {
            const goodCallback = jest.fn();
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            timerState.addEventListener('timerStarted', goodCallback);
            timerState.addEventListener('timerStarted', errorCallback);

            timerState.startTimer('2024-01-15', 'projectTraining');

            expect(goodCallback).toHaveBeenCalled();
            expect(errorCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Error in timerStarted listener:', expect.any(Error));

            consoleSpy.mockRestore();
        });

        it('should handle notifying listeners for non-existent events', () => {
            expect(() => {
                timerState.notifyListeners('nonExistentEvent', {});
            }).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('should clear all intervals and timers', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            timerState.startTimer('2024-01-15', 'projectTraining');
            timerState.startTimer('2024-01-15', 'sheetwork');

            expect(timerState.timers.size).toBe(2);
            expect(timerState.updateIntervals.size).toBe(2);

            timerState.cleanup();

            expect(timerState.timers.size).toBe(0);
            expect(timerState.updateIntervals.size).toBe(0);
            expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
        });

        it('should handle cleanup with no active timers', () => {
            expect(() => {
                timerState.cleanup();
            }).not.toThrow();
        });
    });
});