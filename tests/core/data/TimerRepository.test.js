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

    describe('getOffPlatformKey', () => {
        it('should generate correct off-platform key', () => {
            const key = TimerRepository.getOffPlatformKey('2024-01-15');
            expect(key).toBe('offPlatform_2024-01-15');
        });
    });

    describe('getOffPlatformData', () => {
        it('should return default structure for non-existent data', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            
            const data = TimerRepository.getOffPlatformData('2024-01-15');
            
            expect(data).toEqual({
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 0 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            });
        });

        it('should return saved data for existing key', () => {
            const savedData = {
                timers: {
                    projectTraining: { startTime: 1000000, totalSeconds: 300 },
                    sheetwork: { startTime: null, totalSeconds: 200 },
                    blocked: { startTime: null, totalSeconds: 100 }
                }
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

            const data = TimerRepository.getOffPlatformData('2024-01-15');
            
            expect(data).toEqual(savedData);
        });

        it('should handle corrupted JSON gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockLocalStorage.getItem.mockReturnValue('invalid json');

            const data = TimerRepository.getOffPlatformData('2024-01-15');
            
            expect(data).toEqual({
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 0 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            });
            expect(consoleSpy).toHaveBeenCalledWith('Error loading off-platform data:', '2024-01-15', expect.any(Error));
            
            consoleSpy.mockRestore();
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
            const savedData = {
                timers: {
                    projectTraining: { startTime: 1000000, totalSeconds: 300 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            
            expect(state).toEqual({
                startTime: 1000000,
                totalTime: 300
            });
        });

        it('should handle corrupted JSON gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockLocalStorage.getItem.mockReturnValue('invalid json');

            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            
            expect(state).toEqual({
                startTime: null,
                totalTime: 0
            });
            expect(consoleSpy).toHaveBeenCalledWith('Error loading off-platform data:', '2024-01-15', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('saveTimerState', () => {
        it('should save timer state successfully', () => {
            const state = {
                startTime: 1000000,
                totalTime: 150
            };

            const result = TimerRepository.saveTimerState('2024-01-15', 'projectTraining', state);
            
            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('offPlatform_2024-01-15', expect.stringContaining('"projectTraining"'));
        });

        it('should handle save errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Mock localStorage.setItem to throw an error
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            const result = TimerRepository.saveTimerState('2024-01-15', 'projectTraining', {});
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('Error saving timer state:', '2024-01-15', 'projectTraining', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('getAllTimerStatesForDate', () => {
        it('should return states for all categories', () => {
            // Set up off-platform data
            const offPlatformData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 100 },
                    sheetwork: { startTime: 1000000, totalSeconds: 200 },
                    blocked: { startTime: null, totalSeconds: 300 }
                }
            };
            
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(offPlatformData));

            const states = TimerRepository.getAllTimerStatesForDate('2024-01-15');
            
            expect(states).toEqual({
                projectTraining: { startTime: null, totalTime: 100 },
                sheetwork: { startTime: 1000000, totalTime: 200 },
                blocked: { startTime: null, totalTime: 300 }
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
            // Set up existing off-platform data with total time
            const existingData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 500 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            
            // First call is from startTimer -> getTimerState -> getOffPlatformData
            // Second call is from final state check -> getTimerState -> getOffPlatformData  
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(existingData));
            
            // After startTimer saves, we need the updated data for the final check
            const updatedData = {
                timers: {
                    projectTraining: { startTime: 1000000, totalSeconds: 500 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(updatedData));

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
            // Set up running timer that started 1000 seconds ago (2000000 - 1000000 = 1000 seconds)
            const runningData = {
                timers: {
                    projectTraining: { startTime: 1000000, totalSeconds: 300 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            
            // First call from stopTimer -> getTimerState -> getOffPlatformData
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(runningData));
            
            // After stopTimer saves, we need the updated data for the final check
            const stoppedData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 1300 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(stoppedData));

            const result = TimerRepository.stopTimer('2024-01-15', 'projectTraining');
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.startTime).toBe(null);
            expect(state.totalTime).toBe(1300); // 300 + 1000 elapsed seconds
        });

        it('should handle stopping already stopped timer', () => {
            // Set up stopped timer
            const stoppedData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 300 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(stoppedData));

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
            const runningData = {
                timers: {
                    projectTraining: { startTime: 2000000, totalSeconds: 100 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            
            // First call from setTimer -> getTimerState -> getOffPlatformData
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(runningData));
            
            // After setTimer saves, we need the updated data for the final check
            const updatedData = {
                timers: {
                    projectTraining: { startTime: 3000000, totalSeconds: 600 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(updatedData));

            const result = TimerRepository.setTimer('2024-01-15', 'projectTraining', 0, 10, 0);
            
            expect(result).toBe(true);
            
            const state = TimerRepository.getTimerState('2024-01-15', 'projectTraining');
            expect(state.totalTime).toBe(600); // 10 minutes
            expect(state.startTime).toBe(3000000); // Reset start time to current
        });

        it('should keep stopped state when editing stopped timer', () => {
            // Set up stopped timer
            const stoppedData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 100 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            
            // First call from setTimer -> getTimerState -> getOffPlatformData
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(stoppedData));
            
            // After setTimer saves, we need the updated data for the final check
            const updatedData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 300 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(updatedData));

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
            const stoppedData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 300 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(stoppedData));

            const seconds = TimerRepository.getCurrentSeconds('2024-01-15', 'projectTraining');
            
            expect(seconds).toBe(300);
        });

        it('should return total time plus elapsed for running timer', () => {
            // Timer started 1000 seconds ago with 500 total time (5000000 - 4000000 = 1000 seconds)
            const runningData = {
                timers: {
                    projectTraining: { startTime: 4000000, totalSeconds: 500 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(runningData));

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
            const runningData = {
                timers: {
                    projectTraining: { startTime: Date.now(), totalSeconds: 100 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(runningData));

            const running = TimerRepository.isRunning('2024-01-15', 'projectTraining');
            
            expect(running).toBe(true);
        });

        it('should return false for stopped timer', () => {
            const stoppedData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 100 },
                    sheetwork: { startTime: null, totalSeconds: 0 },
                    blocked: { startTime: null, totalSeconds: 0 }
                }
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(stoppedData));

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
            const offPlatformData = {
                timers: {
                    projectTraining: { startTime: null, totalSeconds: 300 },
                    sheetwork: { startTime: 5000000, totalSeconds: 200 }, // Running for 1000 seconds (6000000 - 5000000)
                    blocked: { startTime: null, totalSeconds: 150 }
                }
            };
            
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(offPlatformData));

            const total = TimerRepository.getTotalSecondsForDate('2024-01-15');
            
            expect(total).toBe(1650); // 300 + (200 + 1000) + 150
        });

        it('should return 0 for date with no timers', () => {
            const total = TimerRepository.getTotalSecondsForDate('2024-01-15');
            
            expect(total).toBe(0);
        });

        it('should handle mix of running and stopped timers', () => {
            // One running, two stopped
            const offPlatformData = {
                timers: {
                    projectTraining: { startTime: 5500000, totalSeconds: 100 }, // Running for 500 seconds (6000000 - 5500000)
                    sheetwork: { startTime: null, totalSeconds: 200 },
                    blocked: { startTime: null, totalSeconds: 300 }
                }
            };
            
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(offPlatformData));

            const total = TimerRepository.getTotalSecondsForDate('2024-01-15');
            
            expect(total).toBe(1100); // (100 + 500) + 200 + 300
        });
    });
});