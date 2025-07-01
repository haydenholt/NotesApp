/**
 * @jest-environment jsdom
 */

import { NotesState } from '../../../src/core/state/NotesState.js';

describe('NotesState', () => {
    let notesState;

    const createMockNote = (date, number, options = {}) => ({
        date,
        number,
        completed: options.completed || false,
        canceled: options.canceled || false,
        elements: {
            failingIssues: { value: options.failingIssues || '' },
            nonFailingIssues: { value: options.nonFailingIssues || '' },
            discussion: { value: options.discussion || '' },
            projectID: { value: options.projectID || '' },
            attemptID: { value: options.attemptID || '' }
        }
    });

    beforeEach(() => {
        notesState = new NotesState();
    });

    describe('constructor', () => {
        it('should initialize with empty maps and listeners', () => {
            expect(notesState.notes).toBeInstanceOf(Map);
            expect(notesState.notesByDate).toBeInstanceOf(Map);
            expect(notesState.notes.size).toBe(0);
            expect(notesState.notesByDate.size).toBe(0);
            expect(notesState.listeners).toEqual({
                noteAdded: [],
                noteRemoved: [],
                noteUpdated: [],
                notesCleared: []
            });
        });
    });

    describe('note management', () => {

        describe('addNote', () => {
            it('should add note and notify listeners', () => {
                const callback = jest.fn();
                notesState.addEventListener('noteAdded', callback);

                const note = createMockNote('2024-01-15', 1);
                notesState.addNote(note);

                const noteId = '2024-01-15_1';
                expect(notesState.notes.get(noteId)).toBe(note);
                expect(notesState.notesByDate.get('2024-01-15')).toEqual(new Set([noteId]));
                expect(callback).toHaveBeenCalledWith({ note, noteId });
            });

            it('should handle multiple notes for same date', () => {
                const note1 = createMockNote('2024-01-15', 1);
                const note2 = createMockNote('2024-01-15', 2);

                notesState.addNote(note1);
                notesState.addNote(note2);

                expect(notesState.notesByDate.get('2024-01-15')).toEqual(
                    new Set(['2024-01-15_1', '2024-01-15_2'])
                );
            });

            it('should handle notes for different dates', () => {
                const note1 = createMockNote('2024-01-15', 1);
                const note2 = createMockNote('2024-01-16', 1);

                notesState.addNote(note1);
                notesState.addNote(note2);

                expect(notesState.notesByDate.get('2024-01-15')).toEqual(new Set(['2024-01-15_1']));
                expect(notesState.notesByDate.get('2024-01-16')).toEqual(new Set(['2024-01-16_1']));
            });
        });

        describe('removeNote', () => {
            beforeEach(() => {
                const note1 = createMockNote('2024-01-15', 1);
                const note2 = createMockNote('2024-01-15', 2);
                notesState.addNote(note1);
                notesState.addNote(note2);
            });

            it('should remove note and notify listeners', () => {
                const callback = jest.fn();
                notesState.addEventListener('noteRemoved', callback);

                const result = notesState.removeNote('2024-01-15', 1);

                expect(result).toBe(true);
                expect(notesState.notes.has('2024-01-15_1')).toBe(false);
                expect(notesState.notesByDate.get('2024-01-15')).toEqual(new Set(['2024-01-15_2']));
                expect(callback).toHaveBeenCalledWith({
                    note: expect.any(Object),
                    noteId: '2024-01-15_1'
                });
            });

            it('should remove date entry when last note is removed', () => {
                notesState.removeNote('2024-01-15', 1);
                notesState.removeNote('2024-01-15', 2);

                expect(notesState.notesByDate.has('2024-01-15')).toBe(false);
            });

            it('should return false for non-existent note', () => {
                const result = notesState.removeNote('2024-01-15', 999);

                expect(result).toBe(false);
            });

            it('should handle removing note from non-existent date', () => {
                const result = notesState.removeNote('2024-01-20', 1);

                expect(result).toBe(false);
            });
        });

        describe('updateNote', () => {
            it('should update existing note and notify listeners', () => {
                const originalNote = createMockNote('2024-01-15', 1);
                notesState.addNote(originalNote);

                const callback = jest.fn();
                notesState.addEventListener('noteUpdated', callback);

                const updatedNote = createMockNote('2024-01-15', 1, { completed: true });
                notesState.updateNote(updatedNote);

                expect(notesState.notes.get('2024-01-15_1')).toBe(updatedNote);
                expect(callback).toHaveBeenCalledWith({
                    note: updatedNote,
                    noteId: '2024-01-15_1'
                });
            });

            it('should do nothing for non-existent note', () => {
                const callback = jest.fn();
                notesState.addEventListener('noteUpdated', callback);

                const note = createMockNote('2024-01-15', 999);
                notesState.updateNote(note);

                expect(callback).not.toHaveBeenCalled();
            });
        });

        describe('getNote', () => {
            it('should return note by date and number', () => {
                const note = createMockNote('2024-01-15', 1);
                notesState.addNote(note);

                const retrieved = notesState.getNote('2024-01-15', 1);

                expect(retrieved).toBe(note);
            });

            it('should return undefined for non-existent note', () => {
                const retrieved = notesState.getNote('2024-01-15', 999);

                expect(retrieved).toBeUndefined();
            });
        });

        describe('getNotesForDate', () => {
            it('should return notes sorted by number', () => {
                const note3 = createMockNote('2024-01-15', 3);
                const note1 = createMockNote('2024-01-15', 1);
                const note2 = createMockNote('2024-01-15', 2);

                notesState.addNote(note3);
                notesState.addNote(note1);
                notesState.addNote(note2);

                const notes = notesState.getNotesForDate('2024-01-15');

                expect(notes).toEqual([note1, note2, note3]);
            });

            it('should return empty array for non-existent date', () => {
                const notes = notesState.getNotesForDate('2024-01-20');

                expect(notes).toEqual([]);
            });

            it('should filter out undefined notes', () => {
                const note = createMockNote('2024-01-15', 1);
                notesState.addNote(note);

                // Manually corrupt the state to test filtering
                notesState.notes.delete('2024-01-15_1');

                const notes = notesState.getNotesForDate('2024-01-15');

                expect(notes).toEqual([]);
            });
        });

        describe('getAllNotes', () => {
            it('should return all notes across all dates', () => {
                const note1 = createMockNote('2024-01-15', 1);
                const note2 = createMockNote('2024-01-16', 1);

                notesState.addNote(note1);
                notesState.addNote(note2);

                const allNotes = notesState.getAllNotes();

                expect(allNotes).toContain(note1);
                expect(allNotes).toContain(note2);
                expect(allNotes).toHaveLength(2);
            });

            it('should return empty array when no notes exist', () => {
                const allNotes = notesState.getAllNotes();

                expect(allNotes).toEqual([]);
            });
        });
    });

    describe('bulk operations', () => {
        beforeEach(() => {
            const note1 = createMockNote('2024-01-15', 1);
            const note2 = createMockNote('2024-01-15', 2);
            const note3 = createMockNote('2024-01-16', 1);

            notesState.addNote(note1);
            notesState.addNote(note2);
            notesState.addNote(note3);
        });

        describe('clearNotesForDate', () => {
            it('should clear all notes for specific date and notify listeners', () => {
                const callback = jest.fn();
                notesState.addEventListener('notesCleared', callback);

                notesState.clearNotesForDate('2024-01-15');

                expect(notesState.getNotesForDate('2024-01-15')).toEqual([]);
                expect(notesState.getNotesForDate('2024-01-16')).toHaveLength(1);
                expect(notesState.notesByDate.has('2024-01-15')).toBe(false);
                expect(callback).toHaveBeenCalledWith({ date: '2024-01-15' });
            });

            it('should handle clearing non-existent date', () => {
                const callback = jest.fn();
                notesState.addEventListener('notesCleared', callback);

                notesState.clearNotesForDate('2024-01-20');

                expect(callback).toHaveBeenCalledWith({ date: '2024-01-20' });
            });
        });

        describe('clearAllNotes', () => {
            it('should clear all notes and notify listeners', () => {
                const callback = jest.fn();
                notesState.addEventListener('notesCleared', callback);

                notesState.clearAllNotes();

                expect(notesState.notes.size).toBe(0);
                expect(notesState.notesByDate.size).toBe(0);
                expect(notesState.getAllNotes()).toEqual([]);
                expect(callback).toHaveBeenCalledWith({ date: null });
            });
        });
    });

    describe('note state queries', () => {
        describe('hasEmptyNoteForDate', () => {
            it('should return true when empty incomplete note exists', () => {
                const emptyNote = createMockNote('2024-01-15', 1);
                notesState.addNote(emptyNote);

                expect(notesState.hasEmptyNoteForDate('2024-01-15')).toBe(true);
            });

            it('should return false when all notes have content', () => {
                const noteWithContent = createMockNote('2024-01-15', 1, { failingIssues: 'Some issue' });
                notesState.addNote(noteWithContent);

                expect(notesState.hasEmptyNoteForDate('2024-01-15')).toBe(false);
            });

            it('should return false when only completed notes exist', () => {
                const completedNote = createMockNote('2024-01-15', 1, { completed: true });
                notesState.addNote(completedNote);

                expect(notesState.hasEmptyNoteForDate('2024-01-15')).toBe(false);
            });

            it('should return false for non-existent date', () => {
                expect(notesState.hasEmptyNoteForDate('2024-01-20')).toBe(false);
            });
        });

        describe('hasInProgressNoteForDate', () => {
            it('should return true when incomplete note with content exists', () => {
                const inProgressNote = createMockNote('2024-01-15', 1, { failingIssues: 'Issue' });
                notesState.addNote(inProgressNote);

                expect(notesState.hasInProgressNoteForDate('2024-01-15')).toBe(true);
            });

            it('should return false when only empty incomplete notes exist', () => {
                const emptyNote = createMockNote('2024-01-15', 1);
                notesState.addNote(emptyNote);

                expect(notesState.hasInProgressNoteForDate('2024-01-15')).toBe(false);
            });

            it('should return false when only completed notes exist', () => {
                const completedNote = createMockNote('2024-01-15', 1, { 
                    completed: true, 
                    failingIssues: 'Issue' 
                });
                notesState.addNote(completedNote);

                expect(notesState.hasInProgressNoteForDate('2024-01-15')).toBe(false);
            });

            it('should check all content fields', () => {
                const noteWithProject = createMockNote('2024-01-15', 1, { projectID: 'PROJECT123' });
                notesState.addNote(noteWithProject);

                expect(notesState.hasInProgressNoteForDate('2024-01-15')).toBe(true);
            });
        });

        describe('getCompletedNotesForDate', () => {
            it('should return only completed notes', () => {
                const completedNote = createMockNote('2024-01-15', 1, { completed: true });
                const incompleteNote = createMockNote('2024-01-15', 2);

                notesState.addNote(completedNote);
                notesState.addNote(incompleteNote);

                const completed = notesState.getCompletedNotesForDate('2024-01-15');

                expect(completed).toEqual([completedNote]);
            });
        });

        describe('getIncompleteNotesForDate', () => {
            it('should return only incomplete notes', () => {
                const completedNote = createMockNote('2024-01-15', 1, { completed: true });
                const incompleteNote = createMockNote('2024-01-15', 2);

                notesState.addNote(completedNote);
                notesState.addNote(incompleteNote);

                const incomplete = notesState.getIncompleteNotesForDate('2024-01-15');

                expect(incomplete).toEqual([incompleteNote]);
            });
        });
    });

    describe('utility methods', () => {
        describe('generateNoteKey', () => {
            it('should generate correct note key', () => {
                const key = notesState.generateNoteKey('2024-01-15', 1);
                expect(key).toBe('2024-01-15_1');
            });

            it('should handle different date and number formats', () => {
                expect(notesState.generateNoteKey('2024-12-31', 99)).toBe('2024-12-31_99');
                expect(notesState.generateNoteKey('2024-01-01', 1)).toBe('2024-01-01_1');
            });
        });

        describe('getStats', () => {
            beforeEach(() => {
                const failedNote = createMockNote('2024-01-15', 1, { 
                    completed: true, 
                    failingIssues: 'Failed issue' 
                });
                const nonFailedNote = createMockNote('2024-01-15', 2, { 
                    completed: true, 
                    nonFailingIssues: 'Non-failing issue' 
                });
                const noIssueNote = createMockNote('2024-01-15', 3, { 
                    completed: true 
                });
                const incompleteNote = createMockNote('2024-01-15', 4);
                const canceledNote = createMockNote('2024-01-15', 5, { 
                    completed: true, 
                    canceled: true 
                });

                notesState.addNote(failedNote);
                notesState.addNote(nonFailedNote);
                notesState.addNote(noIssueNote);
                notesState.addNote(incompleteNote);
                notesState.addNote(canceledNote);
            });

            it('should calculate correct statistics', () => {
                const stats = notesState.getStats('2024-01-15');

                expect(stats).toEqual({
                    total: 5,
                    completed: 3, // Completed and not canceled
                    incomplete: 1,
                    canceled: 1,
                    failed: 1,
                    nonFailed: 1,
                    noIssue: 1
                });
            });

            it('should handle empty date', () => {
                const stats = notesState.getStats('2024-01-20');

                expect(stats).toEqual({
                    total: 0,
                    completed: 0,
                    incomplete: 0,
                    canceled: 0,
                    failed: 0,
                    nonFailed: 0,
                    noIssue: 0
                });
            });

            it('should prioritize failing issues over non-failing', () => {
                const mixedNote = createMockNote('2024-01-16', 1, { 
                    completed: true, 
                    failingIssues: 'Failed',
                    nonFailingIssues: 'Non-failed' 
                });
                notesState.addNote(mixedNote);

                const stats = notesState.getStats('2024-01-16');

                expect(stats.failed).toBe(1);
                expect(stats.nonFailed).toBe(0);
                expect(stats.noIssue).toBe(0);
            });
        });
    });

    describe('event handling', () => {
        it('should add and remove event listeners', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            notesState.addEventListener('noteAdded', callback1);
            notesState.addEventListener('noteAdded', callback2);

            expect(notesState.listeners.noteAdded).toContain(callback1);
            expect(notesState.listeners.noteAdded).toContain(callback2);

            notesState.removeEventListener('noteAdded', callback1);

            expect(notesState.listeners.noteAdded).not.toContain(callback1);
            expect(notesState.listeners.noteAdded).toContain(callback2);
        });

        it('should handle invalid event types gracefully', () => {
            expect(() => {
                notesState.addEventListener('invalidEvent', jest.fn());
                notesState.removeEventListener('invalidEvent', jest.fn());
            }).not.toThrow();
        });

        it('should notify listeners and handle errors', () => {
            const goodCallback = jest.fn();
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            notesState.addEventListener('noteAdded', goodCallback);
            notesState.addEventListener('noteAdded', errorCallback);

            const note = createMockNote('2024-01-15', 1);
            notesState.addNote(note);

            expect(goodCallback).toHaveBeenCalled();
            expect(errorCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Error in noteAdded listener:', expect.any(Error));

            consoleSpy.mockRestore();
        });

        it('should handle notifying listeners for non-existent events', () => {
            expect(() => {
                notesState.notifyListeners('nonExistentEvent', {});
            }).not.toThrow();
        });
    });
});