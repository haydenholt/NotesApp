/**
 * @jest-environment jsdom
 */

import { TimerController } from '../../../src/core/controllers/TimerController.js';

// Mock dependencies
jest.mock('../../../src/core/data/TimerRepository.js', () => ({
    TimerRepository: {
        startTimer: jest.fn(),
        stopTimer: jest.fn(),
        saveTimerState: jest.fn(),
        getTimerState: jest.fn(() => ({
            startTime: null,
            totalTime: 0
        }))
    }
}));

jest.mock('../../../src/core/state/TimerState.js', () => ({
    TimerState: jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
        setTimer: jest.fn(),
        startUpdateInterval: jest.fn(),
        startTimer: jest.fn(() => ({ startTime: Date.now(), totalTime: 0, isRunning: true })),
        stopTimer: jest.fn(() => ({ startTime: null, totalTime: 300, isRunning: false })),
        editTimer: jest.fn(() => ({ startTime: null, totalTime: 3600, isRunning: false })),
        getCurrentSeconds: jest.fn(() => 150),
        isTimerRunning: jest.fn(() => false),
        getRunningTimers: jest.fn(() => []),
        getTotalSecondsForDate: jest.fn(() => 600),
        stopAllTimersForDate: jest.fn(),
        cleanup: jest.fn()
    }))
}));

jest.mock('../../../src/core/utils/TimeFormatter.js', () => ({
    TimeFormatter: {
        formatTime: jest.fn((seconds) => {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }),
        parseTimeInput: jest.fn((h, m, s) => h * 3600 + m * 60 + s),
        secondsToHMS: jest.fn((seconds) => ({
            hours: Math.floor(seconds / 3600),
            minutes: Math.floor((seconds % 3600) / 60),
            seconds: seconds % 60
        }))
    }
}));

jest.mock('../../../src/ui/components/OffPlatformTimer.js', () => {
    return jest.fn().mockImplementation(() => ({
        currentDate: null,
        onStart: jest.fn(),
        onStop: jest.fn(),
        loadTimerState: jest.fn(),
        startTimer: jest.fn(),
        stopTimer: jest.fn(),
        editTimer: jest.fn(),
        stopAllTimers: jest.fn(),
        displayElements: {},
        updateDisplay: jest.fn(),
        updateTotalDisplay: jest.fn()
    }));
});

import { TimerRepository } from '../../../src/core/data/TimerRepository.js';
import { TimerState } from '../../../src/core/state/TimerState.js';
import { TimeFormatter } from '../../../src/core/utils/TimeFormatter.js';

describe('TimerController', () => {
    let controller;
    let mockAppState;
    let mockThemeManager;
    let mockTimerState;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockAppState = {
            getCurrentDate: jest.fn(() => '2024-01-15'),
            addEventListener: jest.fn()
        };
        
        mockThemeManager = {};
        
        controller = new TimerController(mockAppState, mockThemeManager);
        mockTimerState = controller.timerState;
    });

    describe('constructor', () => {
        it('should initialize with required dependencies', () => {
            expect(controller.appState).toBe(mockAppState);
            expect(controller.themeManager).toBe(mockThemeManager);
            expect(controller.timerState).toBeDefined();
            expect(controller.offPlatformTimer).toBeDefined();
            expect(controller.listeners).toEqual({
                timerStarted: [],
                timerStopped: [],
                timerUpdated: [],
                totalTimeChanged: []
            });
        });

        it('should setup event listeners for app state', () => {
            expect(mockAppState.addEventListener).toHaveBeenCalledWith('dateChange', expect.any(Function));
        });

        it('should setup event listeners for timer state', () => {
            expect(mockTimerState.addEventListener).toHaveBeenCalledWith('timerStarted', expect.any(Function));
            expect(mockTimerState.addEventListener).toHaveBeenCalledWith('timerStopped', expect.any(Function));
            expect(mockTimerState.addEventListener).toHaveBeenCalledWith('timerUpdated', expect.any(Function));
        });

        it('should setup off-platform timer callbacks', () => {
            expect(controller.offPlatformTimer.onStart).toHaveBeenCalledTimes(3);
            expect(controller.offPlatformTimer.onStop).toHaveBeenCalledTimes(3);
        });
    });

    describe('setupEventListeners', () => {
        it('should handle dateChange event', () => {
            const dateChangeCallback = mockAppState.addEventListener.mock.calls
                .find(call => call[0] === 'dateChange')[1];
            
            const loadSpy = jest.spyOn(controller, 'loadTimerStateForDate');
            
            dateChangeCallback({ newDate: '2024-01-16' });
            
            expect(loadSpy).toHaveBeenCalledWith('2024-01-16');
        });

        it('should handle timerStarted event from TimerState', () => {
            const timerStartedCallback = mockTimerState.addEventListener.mock.calls
                .find(call => call[0] === 'timerStarted')[1];
            
            const notifySpy = jest.spyOn(controller, 'notifyListeners');
            const updateTimeSpy = jest.spyOn(controller, 'updateTotalTime');
            
            const eventData = { date: '2024-01-15', category: 'projectTraining' };
            timerStartedCallback(eventData);
            
            expect(TimerRepository.startTimer).toHaveBeenCalledWith('2024-01-15', 'projectTraining');
            expect(notifySpy).toHaveBeenCalledWith('timerStarted', eventData);
            expect(updateTimeSpy).toHaveBeenCalled();
        });

        it('should handle timerStopped event from TimerState', () => {
            const timerStoppedCallback = mockTimerState.addEventListener.mock.calls
                .find(call => call[0] === 'timerStopped')[1];
            
            const notifySpy = jest.spyOn(controller, 'notifyListeners');
            const updateTimeSpy = jest.spyOn(controller, 'updateTotalTime');
            
            const eventData = { date: '2024-01-15', category: 'projectTraining' };
            timerStoppedCallback(eventData);
            
            expect(TimerRepository.stopTimer).toHaveBeenCalledWith('2024-01-15', 'projectTraining');
            expect(notifySpy).toHaveBeenCalledWith('timerStopped', eventData);
            expect(updateTimeSpy).toHaveBeenCalled();
        });

        it('should handle timerUpdated event from TimerState', () => {
            const timerUpdatedCallback = mockTimerState.addEventListener.mock.calls
                .find(call => call[0] === 'timerUpdated')[1];
            
            const notifySpy = jest.spyOn(controller, 'notifyListeners');
            const updateTimeSpy = jest.spyOn(controller, 'updateTotalTime');
            
            // Test with live update (should not save)
            const liveEventData = { 
                date: '2024-01-15', 
                category: 'projectTraining', 
                isLiveUpdate: true,
                timer: {} 
            };
            timerUpdatedCallback(liveEventData);
            
            expect(TimerRepository.saveTimerState).not.toHaveBeenCalled();
            expect(notifySpy).toHaveBeenCalledWith('timerUpdated', liveEventData);
            expect(updateTimeSpy).toHaveBeenCalled();
            
            // Test with non-live update (should save)
            jest.clearAllMocks();
            const nonLiveEventData = { 
                date: '2024-01-15', 
                category: 'projectTraining', 
                isLiveUpdate: false,
                timer: { test: 'data' } 
            };
            timerUpdatedCallback(nonLiveEventData);
            
            expect(TimerRepository.saveTimerState).toHaveBeenCalledWith('2024-01-15', 'projectTraining', { test: 'data' });
        });
    });

    describe('loadTimerStateForDate', () => {
        beforeEach(() => {
            TimerRepository.getTimerState.mockImplementation((date, category) => ({
                startTime: category === 'projectTraining' ? Date.now() : null,
                totalTime: 300
            }));
        });

        it('should load timer state for all categories', () => {
            controller.loadTimerStateForDate('2024-01-16');

            expect(TimerRepository.getTimerState).toHaveBeenCalledWith('2024-01-16', 'projectTraining');
            expect(TimerRepository.getTimerState).toHaveBeenCalledWith('2024-01-16', 'sheetwork');
            expect(TimerRepository.getTimerState).toHaveBeenCalledWith('2024-01-16', 'blocked');
            
            expect(mockTimerState.setTimer).toHaveBeenCalledTimes(3);
            expect(mockTimerState.startUpdateInterval).toHaveBeenCalledWith('2024-01-16', 'projectTraining');
        });

        it('should update off-platform timer', () => {
            controller.loadTimerStateForDate('2024-01-16');

            expect(controller.offPlatformTimer.currentDate).toBe('2024-01-16');
            expect(controller.offPlatformTimer.loadTimerState).toHaveBeenCalled();
        });

        it('should update total time', () => {
            const updateTimeSpy = jest.spyOn(controller, 'updateTotalTime');
            
            controller.loadTimerStateForDate('2024-01-16');

            expect(updateTimeSpy).toHaveBeenCalled();
        });
    });

    describe('startTimer', () => {
        beforeEach(() => {
            mockTimerState.isTimerRunning.mockImplementation((date, category) => {
                return category === 'sheetwork'; // Simulate sheetwork running
            });
        });

        it('should stop other running timers before starting new one', () => {
            const stopSpy = jest.spyOn(controller, 'stopTimer');
            
            controller.startTimer('projectTraining');

            expect(stopSpy).toHaveBeenCalledWith('sheetwork', '2024-01-15');
            expect(mockTimerState.startTimer).toHaveBeenCalledWith('2024-01-15', 'projectTraining');
            expect(controller.offPlatformTimer.startTimer).toHaveBeenCalledWith('projectTraining');
        });

        it('should use provided date or current date', () => {
            controller.startTimer('projectTraining', '2024-01-20');

            expect(mockTimerState.startTimer).toHaveBeenCalledWith('2024-01-20', 'projectTraining');
        });

        it('should return timer object', () => {
            const result = controller.startTimer('projectTraining');

            expect(result).toEqual({ startTime: expect.any(Number), totalTime: 0, isRunning: true });
        });
    });

    describe('stopTimer', () => {
        it('should stop timer using timer state and off-platform timer', () => {
            const result = controller.stopTimer('projectTraining');

            expect(mockTimerState.stopTimer).toHaveBeenCalledWith('2024-01-15', 'projectTraining');
            expect(controller.offPlatformTimer.stopTimer).toHaveBeenCalledWith('projectTraining');
            expect(result).toEqual({ startTime: null, totalTime: 300, isRunning: false });
        });

        it('should use provided date or current date', () => {
            controller.stopTimer('projectTraining', '2024-01-20');

            expect(mockTimerState.stopTimer).toHaveBeenCalledWith('2024-01-20', 'projectTraining');
        });
    });

    describe('editTimer', () => {
        it('should edit timer and update off-platform timer display', () => {
            TimeFormatter.parseTimeInput.mockReturnValue(3661); // 1h 1m 1s
            TimeFormatter.secondsToHMS.mockReturnValue({ hours: 1, minutes: 1, seconds: 1 });

            const result = controller.editTimer('projectTraining', 1, 1, 1);

            expect(mockTimerState.editTimer).toHaveBeenCalledWith('2024-01-15', 'projectTraining', 1, 1, 1);
            expect(TimeFormatter.parseTimeInput).toHaveBeenCalledWith(1, 1, 1);
            expect(TimeFormatter.secondsToHMS).toHaveBeenCalledWith(3661);
            expect(controller.offPlatformTimer.editTimer).toHaveBeenCalledWith('projectTraining', 1, 1, 1);
            expect(result).toEqual({ startTime: null, totalTime: 3600, isRunning: false });
        });

        it('should use provided date or current date', () => {
            controller.editTimer('projectTraining', 1, 0, 0, '2024-01-20');

            expect(mockTimerState.editTimer).toHaveBeenCalledWith('2024-01-20', 'projectTraining', 1, 0, 0);
        });
    });

    describe('timer state queries', () => {
        it('should get current seconds for category', () => {
            const result = controller.getCurrentSeconds('projectTraining');

            expect(mockTimerState.getCurrentSeconds).toHaveBeenCalledWith('2024-01-15', 'projectTraining');
            expect(result).toBe(150);
        });

        it('should check if timer is running', () => {
            const result = controller.isTimerRunning('projectTraining');

            expect(mockTimerState.isTimerRunning).toHaveBeenCalledWith('2024-01-15', 'projectTraining');
            expect(result).toBe(false);
        });

        it('should get running timers', () => {
            const result = controller.getRunningTimers();

            expect(mockTimerState.getRunningTimers).toHaveBeenCalledWith('2024-01-15');
            expect(result).toEqual([]);
        });

        it('should get total off-platform seconds', () => {
            const result = controller.getTotalOffPlatformSeconds();

            expect(mockTimerState.getTotalSecondsForDate).toHaveBeenCalledWith('2024-01-15');
            expect(result).toBe(600);
        });
    });

    describe('total time calculations', () => {
        it('should calculate total on-platform seconds', () => {
            const mockNoteController = {
                getNotesForCurrentDate: jest.fn(() => [
                    { timer: { getSeconds: () => 300 } },
                    { timer: { getSeconds: () => 200 } }
                ])
            };

            const result = controller.getTotalOnPlatformSeconds(mockNoteController);

            expect(result).toBe(500);
        });

        it('should calculate total seconds (on + off platform)', () => {
            const mockNoteController = {
                getNotesForCurrentDate: jest.fn(() => [
                    { timer: { getSeconds: () => 300 } }
                ])
            };

            const result = controller.getTotalSeconds(mockNoteController);

            expect(result).toBe(900); // 300 (on-platform) + 600 (off-platform)
        });
    });

    describe('utility methods', () => {
        it('should format time using TimeFormatter', () => {
            const result = controller.formatTime(3661);

            expect(TimeFormatter.formatTime).toHaveBeenCalledWith(3661);
            expect(result).toBe('01:01:01');
        });

        it('should stop all timers', () => {
            controller.stopAllTimers();

            expect(mockTimerState.stopAllTimersForDate).toHaveBeenCalledWith('2024-01-15');
            expect(controller.offPlatformTimer.stopAllTimers).toHaveBeenCalled();
        });

        it('should get off-platform timer instance', () => {
            const result = controller.getOffPlatformTimer();

            expect(result).toBe(controller.offPlatformTimer);
        });

        it('should update total time and notify listeners', () => {
            const notifySpy = jest.spyOn(controller, 'notifyListeners');
            
            controller.updateTotalTime();

            expect(notifySpy).toHaveBeenCalledWith('totalTimeChanged', {
                date: '2024-01-15'
            });
        });

        it('should get timer display elements', () => {
            const result = controller.getTimerDisplayElements();

            expect(result).toBe(controller.offPlatformTimer.displayElements);
        });

        it('should update timer displays', () => {
            controller.updateTimerDisplays();

            expect(controller.offPlatformTimer.updateDisplay).toHaveBeenCalledWith('projectTraining');
            expect(controller.offPlatformTimer.updateDisplay).toHaveBeenCalledWith('sheetwork');
            expect(controller.offPlatformTimer.updateDisplay).toHaveBeenCalledWith('blocked');
            expect(controller.offPlatformTimer.updateTotalDisplay).toHaveBeenCalled();
        });
    });

    describe('event handling', () => {
        it('should add and remove event listeners', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            controller.addEventListener('timerStarted', callback1);
            controller.addEventListener('timerStarted', callback2);

            expect(controller.listeners.timerStarted).toContain(callback1);
            expect(controller.listeners.timerStarted).toContain(callback2);

            controller.removeEventListener('timerStarted', callback1);

            expect(controller.listeners.timerStarted).not.toContain(callback1);
            expect(controller.listeners.timerStarted).toContain(callback2);
        });

        it('should handle invalid event types gracefully', () => {
            expect(() => {
                controller.addEventListener('invalidEvent', jest.fn());
                controller.removeEventListener('invalidEvent', jest.fn());
            }).not.toThrow();
        });

        it('should notify listeners and handle errors', () => {
            const goodCallback = jest.fn();
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            controller.addEventListener('timerStarted', goodCallback);
            controller.addEventListener('timerStarted', errorCallback);

            const testData = { test: 'data' };
            controller.notifyListeners('timerStarted', testData);

            expect(goodCallback).toHaveBeenCalledWith(testData);
            expect(errorCallback).toHaveBeenCalledWith(testData);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('cleanup', () => {
        it('should cleanup timer state', () => {
            controller.cleanup();

            expect(mockTimerState.cleanup).toHaveBeenCalled();
        });
    });
});