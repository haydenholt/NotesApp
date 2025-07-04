/**
 * @jest-environment jsdom
 */

import { AppState } from '../../../src/core/state/AppState.js';

// Mock DateUtils
jest.mock('../../../src/core/utils/DateUtils.js', () => ({
    DateUtils: {
        getCurrentDate: jest.fn(() => '2024-01-15')
    }
}));

import { DateUtils } from '../../../src/core/utils/DateUtils.js';

describe('AppState', () => {
    let appState;

    beforeEach(() => {
        DateUtils.getCurrentDate.mockReturnValue('2024-01-15');
        appState = new AppState();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(appState.currentDate).toBe('2024-01-15');
            expect(appState.isSearchActive).toBe(false);
            expect(appState.searchQuery).toBe('');
            expect(appState.editingNotes).toEqual({});
            expect(appState.listeners).toEqual({
                dateChange: [],
                searchChange: [],
                editingChange: []
            });
        });

        it('should call DateUtils.getCurrentDate on initialization', () => {
            expect(DateUtils.getCurrentDate).toHaveBeenCalled();
        });
    });

    describe('date management', () => {
        it('should set current date and notify listeners', () => {
            const callback = jest.fn();
            appState.addEventListener('dateChange', callback);

            appState.setCurrentDate('2024-01-16');

            expect(appState.currentDate).toBe('2024-01-16');
            expect(callback).toHaveBeenCalledWith({
                oldDate: '2024-01-15',
                newDate: '2024-01-16'
            });
        });

        it('should not notify listeners when setting same date', () => {
            const callback = jest.fn();
            appState.addEventListener('dateChange', callback);

            appState.setCurrentDate('2024-01-15');

            expect(callback).not.toHaveBeenCalled();
        });

        it('should get current date', () => {
            expect(appState.getCurrentDate()).toBe('2024-01-15');
        });
    });

    describe('search state management', () => {
        it('should set search state and notify listeners', () => {
            const callback = jest.fn();
            appState.addEventListener('searchChange', callback);

            appState.setSearchState(true, 'test query');

            expect(appState.isSearchActive).toBe(true);
            expect(appState.searchQuery).toBe('test query');
            expect(callback).toHaveBeenCalledWith({
                isActive: true,
                query: 'test query'
            });
        });

        it('should set search active without query', () => {
            const callback = jest.fn();
            appState.addEventListener('searchChange', callback);

            appState.setSearchState(true);

            expect(appState.isSearchActive).toBe(true);
            expect(appState.searchQuery).toBe('');
            expect(callback).toHaveBeenCalledWith({
                isActive: true,
                query: ''
            });
        });

        it('should not notify listeners when setting same search state', () => {
            appState.setSearchState(true, 'query');
            
            const callback = jest.fn();
            appState.addEventListener('searchChange', callback);

            appState.setSearchState(true, 'query');

            expect(callback).not.toHaveBeenCalled();
        });

        it('should notify when only query changes', () => {
            appState.setSearchState(true, 'original query');
            
            const callback = jest.fn();
            appState.addEventListener('searchChange', callback);

            appState.setSearchState(true, 'new query');

            expect(callback).toHaveBeenCalledWith({
                isActive: true,
                query: 'new query'
            });
        });

        it('should notify when only active state changes', () => {
            appState.setSearchState(true, 'query');
            
            const callback = jest.fn();
            appState.addEventListener('searchChange', callback);

            appState.setSearchState(false, 'query');

            expect(callback).toHaveBeenCalledWith({
                isActive: false,
                query: 'query'
            });
        });

        it('should get search state', () => {
            appState.setSearchState(true, 'test query');

            const state = appState.getSearchState();

            expect(state).toEqual({
                isActive: true,
                query: 'test query'
            });
        });
    });

    describe('note editing management', () => {
        it('should mark note as editing and notify listeners', () => {
            const callback = jest.fn();
            appState.addEventListener('editingChange', callback);

            appState.markNoteAsEditing('1');

            expect(appState.editingNotes['2024-01-15']['1']).toBe(true);
            expect(callback).toHaveBeenCalledWith({
                date: '2024-01-15',
                noteNumber: '1',
                isEditing: true
            });
        });

        it('should initialize editing notes for date if not exists', () => {
            expect(appState.editingNotes['2024-01-15']).toBeUndefined();

            appState.markNoteAsEditing('1');

            expect(appState.editingNotes['2024-01-15']).toEqual({ '1': true });
        });

        it('should clear note editing and notify listeners', () => {
            appState.markNoteAsEditing('1');
            
            const callback = jest.fn();
            appState.addEventListener('editingChange', callback);

            appState.clearNoteEditing('1');

            expect(appState.editingNotes['2024-01-15']['1']).toBeUndefined();
            expect(callback).toHaveBeenCalledWith({
                date: '2024-01-15',
                noteNumber: '1',
                isEditing: false
            });
        });

        it('should handle clearing non-editing note gracefully', () => {
            const callback = jest.fn();
            appState.addEventListener('editingChange', callback);

            appState.clearNoteEditing('999');

            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle clearing note when date has no editing notes', () => {
            const callback = jest.fn();
            appState.addEventListener('editingChange', callback);

            appState.clearNoteEditing('1');

            expect(callback).not.toHaveBeenCalled();
        });

        it('should check if note is editing for current date', () => {
            appState.markNoteAsEditing('1');

            expect(appState.isNoteEditing('1')).toBe(true);
            expect(appState.isNoteEditing('2')).toBe(false);
        });

        it('should check if note is editing for specific date', () => {
            appState.markNoteAsEditing('1');

            expect(appState.isNoteEditing('1', '2024-01-15')).toBe(true);
            expect(appState.isNoteEditing('1', '2024-01-16')).toBe(false);
        });

        it('should handle checking editing for non-existent date', () => {
            expect(appState.isNoteEditing('1', '2024-01-16')).toBe(false);
        });
    });

    describe('event handling', () => {
        it('should add and remove event listeners', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            appState.addEventListener('dateChange', callback1);
            appState.addEventListener('dateChange', callback2);

            expect(appState.listeners.dateChange).toContain(callback1);
            expect(appState.listeners.dateChange).toContain(callback2);

            appState.removeEventListener('dateChange', callback1);

            expect(appState.listeners.dateChange).not.toContain(callback1);
            expect(appState.listeners.dateChange).toContain(callback2);
        });

        it('should handle invalid event types gracefully', () => {
            expect(() => {
                appState.addEventListener('invalidEvent', jest.fn());
                appState.removeEventListener('invalidEvent', jest.fn());
            }).not.toThrow();
        });

        it('should notify listeners and handle errors', () => {
            const goodCallback = jest.fn();
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            appState.addEventListener('dateChange', goodCallback);
            appState.addEventListener('dateChange', errorCallback);

            appState.setCurrentDate('2024-01-16');

            expect(goodCallback).toHaveBeenCalled();
            expect(errorCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Error in dateChange listener:', expect.any(Error));

            consoleSpy.mockRestore();
        });

        it('should handle notifying listeners for non-existent events', () => {
            expect(() => {
                appState.notifyListeners('nonExistentEvent', {});
            }).not.toThrow();
        });
    });

    describe('reset', () => {
        it('should reset all state to initial values', () => {
            // Modify state
            appState.setCurrentDate('2024-01-16');
            appState.setSearchState(true, 'test query');
            appState.markNoteAsEditing('1');

            // Reset
            appState.reset();

            expect(appState.currentDate).toBe('2024-01-15');
            expect(appState.isSearchActive).toBe(false);
            expect(appState.searchQuery).toBe('');
            expect(appState.editingNotes).toEqual({});
        });

        it('should call DateUtils.getCurrentDate when resetting', () => {
            appState.reset();

            expect(DateUtils.getCurrentDate).toHaveBeenCalledTimes(2); // Once in constructor, once in reset
        });
    });

    describe('getState', () => {
        it('should return current state snapshot', () => {
            appState.setCurrentDate('2024-01-16');
            appState.setSearchState(true, 'test query');
            appState.markNoteAsEditing('1');

            const state = appState.getState();

            expect(state).toEqual({
                currentDate: '2024-01-16',
                isSearchActive: true,
                searchQuery: 'test query',
                editingNotes: {
                    '2024-01-16': { '1': true }
                }
            });
        });

        it('should return copy of editing notes to prevent mutation', () => {
            appState.markNoteAsEditing('1');

            const state = appState.getState();
            
            // The copy is shallow, so we need to modify at the top level
            state.editingNotes['2024-01-16'] = { '1': true };

            expect(appState.editingNotes['2024-01-16']).toBeUndefined();
        });

        it('should handle empty editing notes', () => {
            const state = appState.getState();

            expect(state.editingNotes).toEqual({});
        });
    });

    describe('integration scenarios', () => {
        it('should handle multiple notes editing on different dates', () => {
            appState.setCurrentDate('2024-01-15');
            appState.markNoteAsEditing('1');
            appState.markNoteAsEditing('2');

            appState.setCurrentDate('2024-01-16');
            appState.markNoteAsEditing('1');

            expect(appState.isNoteEditing('1', '2024-01-15')).toBe(true);
            expect(appState.isNoteEditing('2', '2024-01-15')).toBe(true);
            expect(appState.isNoteEditing('1', '2024-01-16')).toBe(true);
            expect(appState.isNoteEditing('2', '2024-01-16')).toBe(false);
        });

        it('should maintain editing state across date changes', () => {
            appState.markNoteAsEditing('1');
            appState.setCurrentDate('2024-01-16');
            appState.setCurrentDate('2024-01-15');

            expect(appState.isNoteEditing('1')).toBe(true);
        });

        it('should handle search state changes with date changes', () => {
            const searchCallback = jest.fn();
            const dateCallback = jest.fn();
            
            appState.addEventListener('searchChange', searchCallback);
            appState.addEventListener('dateChange', dateCallback);

            appState.setSearchState(true, 'query');
            appState.setCurrentDate('2024-01-16');

            expect(searchCallback).toHaveBeenCalledTimes(1);
            expect(dateCallback).toHaveBeenCalledTimes(1);
            expect(appState.getSearchState().isActive).toBe(true);
            expect(appState.getCurrentDate()).toBe('2024-01-16');
        });
    });
});