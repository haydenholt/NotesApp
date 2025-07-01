/**
 * @jest-environment jsdom
 */

import { NotesRepository } from '../../../src/core/data/NotesRepository.js';

describe('NotesRepository', () => {
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
            key: jest.fn((index) => {
                const keys = Object.keys(mockStorage);
                return keys[index] || null;
            }),
            get length() { return Object.keys(mockStorage).length; }
        };
        
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });
        
        jest.clearAllMocks();
    });

    describe('getNotesForDate', () => {
        it('should return empty object for non-existent date', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            
            const result = NotesRepository.getNotesForDate('2024-01-15');
            expect(result).toEqual({});
        });

        it('should return parsed notes for existing date', () => {
            const testNotes = {
                1: { failingIssues: 'Test issue', completed: false },
                2: { failingIssues: 'Another issue', completed: true }
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testNotes));

            const result = NotesRepository.getNotesForDate('2024-01-15');
            expect(result).toEqual(testNotes);
        });

        it('should handle corrupted JSON data gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockLocalStorage.getItem.mockReturnValue('invalid json');

            const result = NotesRepository.getNotesForDate('2024-01-15');
            
            expect(result).toEqual({});
            expect(consoleSpy).toHaveBeenCalledWith('Error loading notes for date:', '2024-01-15', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('saveNotesForDate', () => {
        it('should save notes successfully', () => {
            const testNotes = {
                1: { failingIssues: 'Test issue', completed: false }
            };

            const result = NotesRepository.saveNotesForDate('2024-01-15', testNotes);
            
            expect(result).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('2024-01-15', JSON.stringify(testNotes));
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

            const result = NotesRepository.saveNotesForDate('2024-01-15', {});
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('Error saving notes for date:', '2024-01-15', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('saveNote', () => {
        it('should save individual note to existing notes', () => {
            const existingNotes = {
                1: { failingIssues: 'Existing note', completed: false }
            };
            mockStorage['2024-01-15'] = JSON.stringify(existingNotes);

            const newNote = { failingIssues: 'New note', completed: true };
            const result = NotesRepository.saveNote('2024-01-15', '2', newNote);

            expect(result).toBe(true);
            
            const savedNotes = JSON.parse(mockStorage['2024-01-15']);
            expect(savedNotes).toEqual({
                1: { failingIssues: 'Existing note', completed: false },
                2: { failingIssues: 'New note', completed: true }
            });
        });

        it('should save note to empty notes object', () => {
            const newNote = { failingIssues: 'First note', completed: false };
            const result = NotesRepository.saveNote('2024-01-15', '1', newNote);

            expect(result).toBe(true);
            
            const savedNotes = JSON.parse(mockStorage['2024-01-15']);
            expect(savedNotes).toEqual({
                1: { failingIssues: 'First note', completed: false }
            });
        });

        it('should overwrite existing note with same ID', () => {
            const existingNotes = {
                1: { failingIssues: 'Original note', completed: false }
            };
            mockStorage['2024-01-15'] = JSON.stringify(existingNotes);

            const updatedNote = { failingIssues: 'Updated note', completed: true };
            const result = NotesRepository.saveNote('2024-01-15', '1', updatedNote);

            expect(result).toBe(true);
            
            const savedNotes = JSON.parse(mockStorage['2024-01-15']);
            expect(savedNotes).toEqual({
                1: { failingIssues: 'Updated note', completed: true }
            });
        });
    });

    describe('deleteNote', () => {
        it('should delete existing note', () => {
            const existingNotes = {
                1: { failingIssues: 'Note 1', completed: false },
                2: { failingIssues: 'Note 2', completed: true }
            };
            mockStorage['2024-01-15'] = JSON.stringify(existingNotes);

            const result = NotesRepository.deleteNote('2024-01-15', '1');

            expect(result).toBe(true);
            
            const savedNotes = JSON.parse(mockStorage['2024-01-15']);
            expect(savedNotes).toEqual({
                2: { failingIssues: 'Note 2', completed: true }
            });
        });

        it('should handle deleting non-existent note gracefully', () => {
            const existingNotes = {
                1: { failingIssues: 'Note 1', completed: false }
            };
            mockStorage['2024-01-15'] = JSON.stringify(existingNotes);

            const result = NotesRepository.deleteNote('2024-01-15', '99');

            expect(result).toBe(true);
            
            const savedNotes = JSON.parse(mockStorage['2024-01-15']);
            expect(savedNotes).toEqual(existingNotes);
        });
    });

    describe('getNextNoteNumber', () => {
        it('should return 1 for empty notes', () => {
            const result = NotesRepository.getNextNoteNumber('2024-01-15');
            expect(result).toBe(1);
        });

        it('should return next sequential number', () => {
            const existingNotes = {
                1: { failingIssues: 'Note 1' },
                2: { failingIssues: 'Note 2' },
                3: { failingIssues: 'Note 3' }
            };
            mockStorage['2024-01-15'] = JSON.stringify(existingNotes);

            const result = NotesRepository.getNextNoteNumber('2024-01-15');
            expect(result).toBe(4);
        });

        it('should fill gaps in numbering', () => {
            const existingNotes = {
                1: { failingIssues: 'Note 1' },
                3: { failingIssues: 'Note 3' },
                4: { failingIssues: 'Note 4' }
            };
            mockStorage['2024-01-15'] = JSON.stringify(existingNotes);

            const result = NotesRepository.getNextNoteNumber('2024-01-15');
            expect(result).toBe(2);
        });
    });

    describe('renumberNotes', () => {
        it('should renumber notes sequentially', () => {
            const existingNotes = {
                1: { failingIssues: 'Note 1' },
                3: { failingIssues: 'Note 3' },
                5: { failingIssues: 'Note 5' },
                2: { failingIssues: 'Note 2' }
            };
            mockStorage['2024-01-15'] = JSON.stringify(existingNotes);

            const result = NotesRepository.renumberNotes('2024-01-15');

            expect(result).toBe(true);
            
            const savedNotes = JSON.parse(localStorage.getItem('2024-01-15'));
            expect(savedNotes).toEqual({
                1: { failingIssues: 'Note 1' },
                2: { failingIssues: 'Note 2' },
                3: { failingIssues: 'Note 3' },
                4: { failingIssues: 'Note 5' }
            });
        });

        it('should handle empty notes', () => {
            const result = NotesRepository.renumberNotes('2024-01-15');
            expect(result).toBe(true);
        });

        it('should preserve order when renumbering', () => {
            const existingNotes = {
                10: { failingIssues: 'Note 10' },
                5: { failingIssues: 'Note 5' },
                1: { failingIssues: 'Note 1' }
            };
            mockStorage['2024-01-15'] = JSON.stringify(existingNotes);

            const result = NotesRepository.renumberNotes('2024-01-15');

            expect(result).toBe(true);
            
            const savedNotes = JSON.parse(localStorage.getItem('2024-01-15'));
            expect(savedNotes).toEqual({
                1: { failingIssues: 'Note 1' },
                2: { failingIssues: 'Note 5' },
                3: { failingIssues: 'Note 10' }
            });
        });
    });

    describe('cleanupCorruptNotes', () => {
        it('should remove corrupt notes and keep valid ones', () => {
            const notesWithCorruption = {
                1: { failingIssues: 'Valid note' },
                2: null,
                3: { failingIssues: 'Another valid note' },
                4: 'invalid string',
                5: undefined
            };
            localStorage.setItem('2024-01-15', JSON.stringify(notesWithCorruption));

            const result = NotesRepository.cleanupCorruptNotes('2024-01-15');

            expect(result).toEqual({
                1: { failingIssues: 'Valid note' },
                3: { failingIssues: 'Another valid note' }
            });

            const savedNotes = JSON.parse(localStorage.getItem('2024-01-15'));
            expect(savedNotes).toEqual({
                1: { failingIssues: 'Valid note' },
                3: { failingIssues: 'Another valid note' }
            });
        });

        it('should handle all valid notes without changes', () => {
            const validNotes = {
                1: { failingIssues: 'Note 1' },
                2: { failingIssues: 'Note 2' }
            };
            localStorage.setItem('2024-01-15', JSON.stringify(validNotes));

            const result = NotesRepository.cleanupCorruptNotes('2024-01-15');

            expect(result).toEqual(validNotes);
            
            const savedNotes = JSON.parse(localStorage.getItem('2024-01-15'));
            expect(savedNotes).toEqual(validNotes);
        });

        it('should handle empty notes', () => {
            const result = NotesRepository.cleanupCorruptNotes('2024-01-15');
            expect(result).toEqual({});
        });
    });

    describe('searchNotes', () => {
        beforeEach(() => {
            // Set up test data across multiple dates
            const notes1 = {
                1: { projectID: 'PROJECT123', attemptID: 'ATT456', operationID: 'OP789' },
                2: { projectID: 'DIFFERENT', attemptID: 'ATT999', operationID: 'OP000' }
            };
            const notes2 = {
                1: { projectID: 'PROJECT456', attemptID: 'ATT123', operationID: 'OP789' }
            };
            localStorage.setItem('2024-01-15', JSON.stringify(notes1));
            localStorage.setItem('2024-01-16', JSON.stringify(notes2));
            localStorage.setItem('invalid-key', JSON.stringify({ 1: { test: 'should not appear' } }));
        });

        it('should find notes by project ID', () => {
            const results = NotesRepository.searchNotes('PROJECT123');

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                dateKey: '2024-01-15',
                id: '1',
                note: { projectID: 'PROJECT123', attemptID: 'ATT456', operationID: 'OP789' },
                matchesProjectID: true
            });
        });

        it('should find notes by operation ID', () => {
            const results = NotesRepository.searchNotes('OP789');

            expect(results).toHaveLength(2);
            expect(results.map(r => r.dateKey)).toContain('2024-01-15');
            expect(results.map(r => r.dateKey)).toContain('2024-01-16');
        });

        it('should find notes by attempt ID', () => {
            const results = NotesRepository.searchNotes('ATT456');

            expect(results).toHaveLength(1);
            expect(results[0].dateKey).toBe('2024-01-15');
            expect(results[0].id).toBe('1');
        });

        it('should perform case-insensitive search', () => {
            const results = NotesRepository.searchNotes('project123');

            expect(results).toHaveLength(1);
            expect(results[0].note.projectID).toBe('PROJECT123');
        });

        it('should handle partial matches', () => {
            const results = NotesRepository.searchNotes('PROJECT');

            expect(results).toHaveLength(2);
            expect(results.map(r => r.note.projectID)).toContain('PROJECT123');
            expect(results.map(r => r.note.projectID)).toContain('PROJECT456');
        });

        it('should return empty array for no matches', () => {
            const results = NotesRepository.searchNotes('NONEXISTENT');

            expect(results).toEqual([]);
        });

        it('should handle empty query', () => {
            const results = NotesRepository.searchNotes('');

            // Empty query should match all notes (since everything contains empty string)
            expect(results.length).toBeGreaterThan(0);
        });

        it('should sort notes by ID in descending order within each date', () => {
            const testNotes = {
                1: { projectID: 'TEST', attemptID: '', operationID: '' },
                3: { projectID: 'TEST', attemptID: '', operationID: '' },
                2: { projectID: 'TEST', attemptID: '', operationID: '' }
            };
            localStorage.setItem('2024-01-17', JSON.stringify(testNotes));

            const results = NotesRepository.searchNotes('TEST');
            const testDateResults = results.filter(r => r.dateKey === '2024-01-17');

            expect(testDateResults.map(r => r.id)).toEqual(['3', '2', '1']);
        });

        it('should handle missing ID fields gracefully', () => {
            const testNotes = {
                1: { projectID: null, attemptID: undefined },
                2: { operationID: 'OP123' }
            };
            localStorage.setItem('2024-01-18', JSON.stringify(testNotes));

            const results = NotesRepository.searchNotes('OP123');

            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('2');
        });
    });

    describe('getAllCompletedNotes', () => {
        beforeEach(() => {
            // Set up test data with mix of completed and incomplete notes
            const notes1 = {
                1: { failingIssues: 'Issue 1', completed: true },
                2: { failingIssues: 'Issue 2', completed: false },
                3: { failingIssues: 'Issue 3', completed: true, canceled: true }
            };
            const notes2 = {
                1: { failingIssues: 'Issue 4', completed: true },
                2: { failingIssues: 'Issue 5', completed: false }
            };
            localStorage.setItem('2024-01-15', JSON.stringify(notes1));
            localStorage.setItem('2024-01-16', JSON.stringify(notes2));
            localStorage.setItem('invalid-key', JSON.stringify({ 1: { test: 'should not appear' } }));
        });

        it('should return all completed notes across all dates', () => {
            const results = NotesRepository.getAllCompletedNotes();

            expect(results).toHaveLength(3);
            
            const dateKeys = results.map(r => r.dateKey);
            expect(dateKeys).toContain('2024-01-15');
            expect(dateKeys).toContain('2024-01-16');
            
            const completedNotes = results.map(r => r.note);
            expect(completedNotes.every(note => note.completed)).toBe(true);
        });

        it('should include canceled notes if they are completed', () => {
            const results = NotesRepository.getAllCompletedNotes();
            
            const canceledNote = results.find(r => r.note.canceled);
            expect(canceledNote).toBeDefined();
            expect(canceledNote.note.completed).toBe(true);
        });

        it('should exclude incomplete notes', () => {
            const results = NotesRepository.getAllCompletedNotes();
            
            const incompleteNotes = results.filter(r => !r.note.completed);
            expect(incompleteNotes).toHaveLength(0);
        });

        it('should return empty array when no completed notes exist', () => {
            localStorage.clear();
            
            const testNotes = {
                1: { failingIssues: 'Issue 1', completed: false },
                2: { failingIssues: 'Issue 2', completed: false }
            };
            localStorage.setItem('2024-01-15', JSON.stringify(testNotes));

            const results = NotesRepository.getAllCompletedNotes();

            expect(results).toEqual([]);
        });

        it('should handle empty localStorage', () => {
            localStorage.clear();

            const results = NotesRepository.getAllCompletedNotes();

            expect(results).toEqual([]);
        });

        it('should include correct structure for each result', () => {
            const results = NotesRepository.getAllCompletedNotes();

            expect(results.length).toBeGreaterThan(0);
            results.forEach(result => {
                expect(result).toHaveProperty('dateKey');
                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('note');
                expect(typeof result.dateKey).toBe('string');
                expect(typeof result.id).toBe('string');
                expect(typeof result.note).toBe('object');
            });
        });
    });
});