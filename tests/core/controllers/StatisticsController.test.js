/**
 * @jest-environment jsdom
 */

import { StatisticsController } from '../../../src/core/controllers/StatisticsController.js';

// Mock TimeFormatter
jest.mock('../../../src/core/utils/TimeFormatter.js', () => ({
    TimeFormatter: {
        formatTime: jest.fn((seconds) => {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        })
    }
}));

describe('StatisticsController', () => {
    let controller;
    let mockAppState;
    let mockThemeManager;

    beforeEach(() => {
        mockAppState = {
            getCurrentDate: jest.fn(() => '2024-01-15')
        };
        mockThemeManager = {};
        controller = new StatisticsController(mockAppState, mockThemeManager);
    });

    describe('constructor', () => {
        it('should initialize with app state and theme manager', () => {
            expect(controller.appState).toBe(mockAppState);
            expect(controller.themeManager).toBe(mockThemeManager);
            expect(controller.listeners).toEqual({
                statisticsUpdated: [],
                projectStatsUpdated: []
            });
        });
    });

    describe('calculateDailyStatistics', () => {
        it('should calculate statistics for completed notes with different issue types', () => {
            const mockNotes = [
                {
                    completed: true,
                    canceled: false,
                    elements: {
                        failingIssues: { value: 'Some failing issue' },
                        nonFailingIssues: { value: '' }
                    }
                },
                {
                    completed: true,
                    canceled: false,
                    elements: {
                        failingIssues: { value: '' },
                        nonFailingIssues: { value: 'Some non-failing issue' }
                    }
                },
                {
                    completed: true,
                    canceled: false,
                    elements: {
                        failingIssues: { value: '' },
                        nonFailingIssues: { value: '' }
                    }
                },
                {
                    completed: false,
                    canceled: false,
                    elements: {
                        failingIssues: { value: 'Should not count' },
                        nonFailingIssues: { value: '' }
                    }
                },
                {
                    completed: true,
                    canceled: true,
                    elements: {
                        failingIssues: { value: 'Should not count' },
                        nonFailingIssues: { value: '' }
                    }
                }
            ];

            const callback = jest.fn();
            controller.addEventListener('statisticsUpdated', callback);

            const result = controller.calculateDailyStatistics(mockNotes);

            expect(result).toEqual({
                failedCount: 1,
                nonFailedCount: 1,
                noIssueCount: 1,
                totalCompleted: 3,
                date: '2024-01-15'
            });

            expect(callback).toHaveBeenCalledWith(result);
        });

        it('should handle empty notes array', () => {
            const result = controller.calculateDailyStatistics([]);

            expect(result).toEqual({
                failedCount: 0,
                nonFailedCount: 0,
                noIssueCount: 0,
                totalCompleted: 0,
                date: '2024-01-15'
            });
        });

        it('should handle notes with both failing and non-failing issues (prioritizes failing)', () => {
            const mockNotes = [
                {
                    completed: true,
                    canceled: false,
                    elements: {
                        failingIssues: { value: 'Failing issue' },
                        nonFailingIssues: { value: 'Non-failing issue' }
                    }
                }
            ];

            const result = controller.calculateDailyStatistics(mockNotes);

            expect(result.failedCount).toBe(1);
            expect(result.nonFailedCount).toBe(0);
            expect(result.noIssueCount).toBe(0);
        });
    });

    describe('calculateProjectFailRates', () => {
        it('should calculate fail rates by project', () => {
            const mockNotes = [
                {
                    completed: true,
                    canceled: false,
                    elements: {
                        projectID: { value: 'PROJECT123' },
                        failingIssues: { value: 'Failed' },
                        nonFailingIssues: { value: '' }
                    },
                    timer: { getSeconds: () => 300 }
                },
                {
                    completed: true,
                    canceled: false,
                    elements: {
                        projectID: { value: 'PROJECT123' },
                        failingIssues: { value: '' },
                        nonFailingIssues: { value: 'Success' }
                    },
                    timer: { getSeconds: () => 200 }
                },
                {
                    completed: true,
                    canceled: false,
                    elements: {
                        projectID: { value: 'ABC12345678' },
                        failingIssues: { value: 'Failed' },
                        nonFailingIssues: { value: '' }
                    },
                    timer: { getSeconds: () => 400 }
                }
            ];

            const callback = jest.fn();
            controller.addEventListener('projectStatsUpdated', callback);

            const result = controller.calculateProjectFailRates(mockNotes);

            expect(result['PROJECT123']).toEqual({
                total: 2,
                failed: 1,
                nonFailed: 1,
                totalTime: 500,
                failRate: 50.0,
                nonFailRate: 50.0,
                avgTimeSeconds: 250,
                avgTime: '00:04:10',
                displayID: 'CT123'
            });

            expect(result['ABC12345678']).toEqual({
                total: 1,
                failed: 1,
                nonFailed: 0,
                totalTime: 400,
                failRate: 100.0,
                nonFailRate: 0.0,
                avgTimeSeconds: 400,
                avgTime: '00:06:40',
                displayID: '45678'
            });

            expect(callback).toHaveBeenCalledWith({
                stats: result,
                date: '2024-01-15'
            });
        });

        it('should ignore canceled and incomplete notes', () => {
            const mockNotes = [
                {
                    completed: false,
                    canceled: false,
                    elements: {
                        projectID: { value: 'PROJECT123' },
                        failingIssues: { value: 'Should not count' },
                        nonFailingIssues: { value: '' }
                    },
                    timer: { getSeconds: () => 300 }
                },
                {
                    completed: true,
                    canceled: true,
                    elements: {
                        projectID: { value: 'PROJECT123' },
                        failingIssues: { value: 'Should not count' },
                        nonFailingIssues: { value: '' }
                    },
                    timer: { getSeconds: () => 200 }
                },
                {
                    completed: true,
                    canceled: false,
                    elements: {
                        projectID: { value: '   ' },
                        failingIssues: { value: 'Should not count' },
                        nonFailingIssues: { value: '' }
                    },
                    timer: { getSeconds: () => 100 }
                }
            ];

            const result = controller.calculateProjectFailRates(mockNotes);

            expect(Object.keys(result)).toHaveLength(0);
        });
    });

    describe('enhanceProjectStats', () => {
        it('should enhance project stats with calculated fields', () => {
            const projectStats = {
                'PROJECT123': {
                    total: 10,
                    failed: 3,
                    nonFailed: 5,
                    totalTime: 3600
                },
                'VERYLONGPROJECTID': {
                    total: 0,
                    failed: 0,
                    nonFailed: 0,
                    totalTime: 0
                }
            };

            const result = controller.enhanceProjectStats(projectStats);

            expect(result['PROJECT123']).toEqual({
                total: 10,
                failed: 3,
                nonFailed: 5,
                totalTime: 3600,
                failRate: 30.0,
                nonFailRate: 50.0,
                avgTimeSeconds: 360,
                avgTime: '00:06:00',
                displayID: 'CT123'
            });

            expect(result['VERYLONGPROJECTID']).toEqual({
                total: 0,
                failed: 0,
                nonFailed: 0,
                totalTime: 0,
                failRate: 0,
                nonFailRate: 0,
                avgTimeSeconds: 0,
                avgTime: '00:00:00',
                displayID: 'ECTID'
            });
        });
    });

    describe('calculateSearchStatistics', () => {
        it('should calculate statistics for search results', () => {
            const searchResults = [
                {
                    note: {
                        completed: true,
                        canceled: false,
                        failingIssues: 'Failed issue',
                        nonFailingIssues: ''
                    }
                },
                {
                    note: {
                        completed: true,
                        canceled: false,
                        failingIssues: '',
                        nonFailingIssues: 'Non-failing issue'
                    }
                },
                {
                    note: {
                        completed: true,
                        canceled: false,
                        failingIssues: '',
                        nonFailingIssues: ''
                    }
                },
                {
                    note: {
                        completed: false,
                        canceled: false,
                        failingIssues: 'Should not count',
                        nonFailingIssues: ''
                    }
                },
                {
                    note: {
                        completed: true,
                        canceled: true,
                        failingIssues: 'Should not count',
                        nonFailingIssues: ''
                    }
                }
            ];

            const result = controller.calculateSearchStatistics(searchResults);

            expect(result).toEqual({
                failedCount: 1,
                nonFailedCount: 1,
                noIssueCount: 1,
                totalResults: 5,
                totalCompleted: 3
            });
        });

        it('should handle undefined issue fields', () => {
            const searchResults = [
                {
                    note: {
                        completed: true,
                        canceled: false,
                        failingIssues: undefined,
                        nonFailingIssues: undefined
                    }
                }
            ];

            const result = controller.calculateSearchStatistics(searchResults);

            expect(result.noIssueCount).toBe(1);
        });
    });

    describe('calculateSearchProjectFailRates', () => {
        it('should calculate project fail rates from search results', () => {
            const searchResults = [
                {
                    note: {
                        completed: true,
                        canceled: false,
                        projectID: 'PROJECT123',
                        failingIssues: 'Failed',
                        nonFailingIssues: '',
                        startTimestamp: 1000000,
                        endTimestamp: 1300000,
                        additionalTime: 60
                    }
                },
                {
                    note: {
                        completed: true,
                        canceled: false,
                        projectID: 'PROJECT123',
                        failingIssues: '',
                        nonFailingIssues: 'Success',
                        startTimestamp: 2000000,
                        endTimestamp: 2200000
                    }
                }
            ];

            const result = controller.calculateSearchProjectFailRates(searchResults);

            expect(result['PROJECT123']).toEqual({
                total: 2,
                failed: 1,
                nonFailed: 1,
                totalTime: 560, // 300 + 200 + 60 (additional)
                failRate: 50.0,
                nonFailRate: 50.0,
                avgTimeSeconds: 280,
                avgTime: '00:04:40',
                displayID: 'CT123'
            });
        });

        it('should handle notes without timestamps', () => {
            const searchResults = [
                {
                    note: {
                        completed: true,
                        canceled: false,
                        projectID: 'PROJECT123',
                        failingIssues: 'Failed',
                        nonFailingIssues: ''
                    }
                }
            ];

            const result = controller.calculateSearchProjectFailRates(searchResults);

            expect(result['PROJECT123'].totalTime).toBe(0);
        });

        it('should ignore canceled notes and notes without projectID', () => {
            const searchResults = [
                {
                    note: {
                        completed: true,
                        canceled: true,
                        projectID: 'PROJECT123',
                        failingIssues: 'Should not count',
                        nonFailingIssues: ''
                    }
                },
                {
                    note: {
                        completed: true,
                        canceled: false,
                        projectID: '',
                        failingIssues: 'Should not count',
                        nonFailingIssues: ''
                    }
                }
            ];

            const result = controller.calculateSearchProjectFailRates(searchResults);

            expect(Object.keys(result)).toHaveLength(0);
        });
    });

    describe('getStatsData', () => {
        it('should format stats for display', () => {
            const stats = {
                failedCount: 5,
                nonFailedCount: 3,
                noIssueCount: 2
            };

            const result = controller.getStatsData(stats);

            expect(result).toEqual([
                { label: 'Fails', count: 5, accent: 'error' },
                { label: 'Non-fails', count: 3, accent: 'warning' },
                { label: 'No Issues', count: 2, accent: 'neutral' }
            ]);
        });
    });

    describe('event handling', () => {
        it('should add and remove event listeners', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            controller.addEventListener('statisticsUpdated', callback1);
            controller.addEventListener('statisticsUpdated', callback2);

            expect(controller.listeners.statisticsUpdated).toContain(callback1);
            expect(controller.listeners.statisticsUpdated).toContain(callback2);

            controller.removeEventListener('statisticsUpdated', callback1);

            expect(controller.listeners.statisticsUpdated).not.toContain(callback1);
            expect(controller.listeners.statisticsUpdated).toContain(callback2);
        });

        it('should handle invalid event types gracefully', () => {
            expect(() => {
                controller.addEventListener('invalidEvent', jest.fn());
            }).not.toThrow();

            expect(() => {
                controller.removeEventListener('invalidEvent', jest.fn());
            }).not.toThrow();
        });

        it('should notify listeners and handle errors gracefully', () => {
            const goodCallback = jest.fn();
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            controller.addEventListener('statisticsUpdated', goodCallback);
            controller.addEventListener('statisticsUpdated', errorCallback);

            const testData = { test: 'data' };
            controller.notifyListeners('statisticsUpdated', testData);

            expect(goodCallback).toHaveBeenCalledWith(testData);
            expect(errorCallback).toHaveBeenCalledWith(testData);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle notifying listeners for non-existent events', () => {
            expect(() => {
                controller.notifyListeners('nonExistentEvent', {});
            }).not.toThrow();
        });
    });
});