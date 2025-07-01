/**
 * @jest-environment jsdom
 */

import { TimerRepository } from '../../../src/core/data/TimerRepository.js';

describe('TimerRepository', () => {
    let mockStorage;
    let mockLocalStorage;

    beforeEach(() => {
        // Create a real storage simulation
        mockStorage = {};
        
        mockLocalStorage = {
            getItem: jest.fn((key) => mockStorage[key] || null),
            setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
            removeItem: jest.fn((key) => { delete mockStorage[key]; }),
            clear: jest.fn(() => { mockStorage = {}; }),
            key: jest.fn(),
            length: 0
        };
        
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });
        
        jest.clearAllMocks();
    });

    describe('getTimerKey', () => {
        it('should generate correct timer key', () => {
            const key = TimerRepository.getTimerKey('2024-01-15', 'projectTraining');
            expect(key).toBe('timer_2024-01-15_projectTraining');
        });

        it('should handle different categories', () => {
            expect(TimerRepository.getTimerKey('2024-01-15', 'sheetwork')).toBe('timer_2024-01-15_sheetwork');
            expect(TimerRepository.getTimerKey('2024-01-15', 'blocked')).toBe('timer_2024-01-15_blocked');
        });
    });

    describe('getTimerState', () => {
        it('should return default state for non-existent timer', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            
            expect(state).toEqual({
                startTime: null,
                totalTime: 0
            });
        });

        it('should return saved state for existing timer', () => {
            const savedState = {
                startTime: Date.now(),
                totalTime: 300
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState));

            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            
            expect(state).toEqual(savedState);
        });

        it('should handle corrupted JSON gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockLocalStorage.getItem.mockReturnValue('invalid json');

            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            
            expect(state).toEqual({
                startTime: null,
                totalTime: 0
            });
            expect(consoleSpy).toHaveBeenCalledWith('Error loading timer state:', '2024-01-15', 'projectTraining', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('saveTimerState', () => {
        it('should save timer state successfully', () => {
            const state = {
                startTime: Date.now(),
                totalTime: 150
            };

            const result = TimerRepository.saveTimerState('2024-01-15', 'projectTraining', state);
            
            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('timer_2024-01-15_projectTraining', JSON.stringify(state));
        });

        it('should handle save errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Mock localStorage.setItem to throw an error
            const mockSetItem = jest.fn(() => {
                throw new Error('Storage quota exceeded');
            });
            Object.defineProperty(window, 'localStorage', {
                value: {
                    ...localStorage,
                    setItem: mockSetItem
                },
                writable: true
            });

            const result = TimerRepository.saveTimerState('2024-01-15', 'projectTraining', {});
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('Error saving timer state:', '2024-01-15', 'projectTraining', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('getAllTimerStatesForDate', () => {
        it('should return states for all categories', () => {
            // Set up some timer states
            const projectState = { startTime: null, totalTime: 100 };
            const sheetworkState = { startTime: Date.now(), totalTime: 200 };
            const blockedState = { startTime: null, totalTime: 300 };
            
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'timer_2024-01-15_projectTraining') return JSON.stringify(projectState);
                if (key === 'timer_2024-01-15_sheetwork') return JSON.stringify(sheetworkState);
                if (key === 'timer_2024-01-15_blocked') return JSON.stringify(blockedState);
                return null;
            });

            const states = TimerRepository.getAllTimerStatesForDate('2024-01-15');
            
            expect(states).toEqual({
                projectTraining: projectState,
                sheetwork: sheetworkState,
                blocked: blockedState
            });
        });

        it('should return default states for non-existent timers', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            
            const states = TimerRepository.getAllTimerStatesForDate('2024-01-15');
            
            expect(states).toEqual({
                projectTraining: { startTime: null, totalTime: 0 },
                sheetwork: { startTime: null, totalTime: 0 },
                blocked: { startTime: null, totalTime: 0 }
            });
        });
    });

    describe('startTimer', () => {
        beforeEach(() => {
            jest.spyOn(Date, 'now').mockReturnValue(1000000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should start timer with current timestamp', () => {
            const result = TimerRepository.startTimer('2024-01-15', 'projectTraining');
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.startTime).toBe(1000000);
            expect(state.totalTime).toBe(0);
        });

        it('should preserve total time when starting', () => {
            // Set up existing state with total time
            const existingState = { startTime: null, totalTime: 500 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(existingState));

            const result = TimerRepository.startTimer('2024-01-15', 'projectTraining');
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.startTime).toBe(1000000);
            expect(state.totalTime).toBe(500);
        });
    });

    describe('stopTimer', () => {
        beforeEach(() => {
            jest.spyOn(Date, 'now').mockReturnValue(2000000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should stop running timer and add elapsed time', () => {
            // Set up running timer that started 1000 seconds ago
            const runningState = { startTime: 1000000, totalTime: 300 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(runningState));

            const result = TimerRepository.stopTimer('2024-01-15', 'projectTraining');
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.startTime).toBe(null);
            expect(state.totalTime).toBe(1300); // 300 + 1000 elapsed seconds
        });

        it('should handle stopping already stopped timer', () => {
            // Set up stopped timer
            const stoppedState = { startTime: null, totalTime: 300 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(stoppedState));

            const result = TimerRepository.stopTimer('2024-01-15', 'projectTraining');
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.startTime).toBe(null);
            expect(state.totalTime).toBe(300); // Unchanged
        });

        it('should handle non-existent timer', () => {
            const result = TimerRepository.stopTimer('2024-01-15', 'projectTraining');
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.startTime).toBe(null);
            expect(state.totalTime).toBe(0);
        });
    });

    describe('setTimer', () => {
        beforeEach(() => {
            jest.spyOn(Date, 'now').mockReturnValue(3000000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should set timer to specific time', () => {
            const result = TimerRepository.setTimer('2024-01-15', 'projectTraining', 1, 30, 45);
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.totalTime).toBe(5445); // 1*3600 + 30*60 + 45
            expect(state.startTime).toBe(null);
        });

        it('should preserve running state when editing running timer', () => {
            // Set up running timer
            const runningState = { startTime: 2000000, totalTime: 100 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(runningState));

            const result = TimerRepository.setTimer('2024-01-15', 'projectTraining', 0, 10, 0);
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.totalTime).toBe(600); // 10 minutes
            expect(state.startTime).toBe(3000000); // Reset start time to current
        });

        it('should keep stopped state when editing stopped timer', () => {
            // Set up stopped timer
            const stoppedState = { startTime: null, totalTime: 100 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(stoppedState));

            const result = TimerRepository.setTimer('2024-01-15', 'projectTraining', 0, 5, 0);
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.totalTime).toBe(300); // 5 minutes
            expect(state.startTime).toBe(null);
        });
    });

    describe('getCurrentSeconds', () => {
        beforeEach(() => {
            jest.spyOn(Date, 'now').mockReturnValue(5000000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should return total time for stopped timer', () => {
            const stoppedState = { startTime: null, totalTime: 300 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(stoppedState));

            const seconds = TimerRepository.getCurrentSeconds('2024-01-15', 'projectTraining');
            
            expect(seconds).toBe(300);
        });

        it('should return total time plus elapsed for running timer', () => {
            // Timer started 1000 seconds ago with 500 total time
            const runningState = { startTime: 4000000, totalTime: 500 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(runningState));

            const seconds = TimerRepository.getCurrentSeconds('2024-01-15', 'projectTraining');
            
            expect(seconds).toBe(1500); // 500 + 1000 elapsed
        });

        it('should return 0 for non-existent timer', () => {
            const seconds = TimerRepository.getCurrentSeconds('2024-01-15', 'projectTraining');
            
            expect(seconds).toBe(0);
        });
    });

    describe('isRunning', () => {
        it('should return true for running timer', () => {
            const runningState = { startTime: Date.now(), totalTime: 100 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(runningState));

            const running = TimerRepository.isRunning('2024-01-15', 'projectTraining');
            
            expect(running).toBe(true);
        });

        it('should return false for stopped timer', () => {
            const stoppedState = { startTime: null, totalTime: 100 };
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(stoppedState));

            const running = TimerRepository.isRunning('2024-01-15', 'projectTraining');
            
            expect(running).toBe(false);
        });

        it('should return false for non-existent timer', () => {
            const running = TimerRepository.isRunning('2024-01-15', 'projectTraining');
            
            expect(running).toBe(false);
        });
    });

    describe('getTotalSecondsForDate', () => {
        beforeEach(() => {
            jest.spyOn(Date, 'now').mockReturnValue(6000000);
        });

        afterEach(() => {
            Date.now.mockRestore();
        });

        it('should return sum of all category times', () => {
            // Set up different states for each category
            const projectState = { startTime: null, totalTime: 300 };
            const sheetworkState = { startTime: 5000000, totalTime: 200 }; // Running for 1000 seconds
            const blockedState = { startTime: null, totalTime: 150 };
            
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(projectState));
            localStorage.setItem('timer_2024-01-15_sheetwork', JSON.stringify(sheetworkState));
            localStorage.setItem('timer_2024-01-15_blocked', JSON.stringify(blockedState));

            const total = TimerRepository.getTotalSecondsForDate('2024-01-15');
            
            expect(total).toBe(1650); // 300 + (200 + 1000) + 150
        });

        it('should return 0 for date with no timers', () => {
            const total = TimerRepository.getTotalSecondsForDate('2024-01-15');
            
            expect(total).toBe(0);
        });

        it('should handle mix of running and stopped timers', () => {
            // One running, two stopped
            const projectState = { startTime: 5500000, totalTime: 100 }; // Running for 500 seconds
            const sheetworkState = { startTime: null, totalTime: 200 };
            const blockedState = { startTime: null, totalTime: 300 };
            
            localStorage.setItem('timer_2024-01-15_projectTraining', JSON.stringify(projectState));
            localStorage.setItem('timer_2024-01-15_sheetwork', JSON.stringify(sheetworkState));
            localStorage.setItem('timer_2024-01-15_blocked', JSON.stringify(blockedState));

            const total = TimerRepository.getTotalSecondsForDate('2024-01-15');
            
            expect(total).toBe(1100); // (100 + 500) + 200 + 300
        });
    });
});