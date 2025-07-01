import { NoteController } from '../../../src/core/controllers/NoteController.js';
import { Note } from '../../../src/ui/components/Note.js';

// Mock dependencies
jest.mock('../../../src/core/state/AppState.js');
jest.mock('../../../src/core/state/NotesState.js');
jest.mock('../../../src/core/data/NotesRepository.js', () => ({
  NotesRepository: {
    cleanupCorruptNotes: jest.fn(),
    getNextNoteNumber: jest.fn(),
    saveNote: jest.fn(),
    deleteNote: jest.fn(),
    renumberNotes: jest.fn()
  }
}));
jest.mock('../../../src/ui/components/Note.js');

// Mock ThemeManager
const mockThemeManager = {
  combineClasses: jest.fn((...classes) => classes.filter(cls => cls && cls.trim() !== '').join(' ')),
  getColor: jest.fn(() => 'mock-color-class'),
  getStatusClasses: jest.fn(() => 'mock-status-class'),
  getPrimaryButtonClasses: jest.fn(() => 'mock-button-class')
};

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  })
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('NoteController', () => {
  let noteController;
  let mockAppState;
  let mockNotesState;
  let NotesRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Create mock NotesState
    mockNotesState = {
      addNote: jest.fn(),
      removeNote: jest.fn(),
      updateNote: jest.fn(),
      getNote: jest.fn(),
      getNotesForDate: jest.fn().mockReturnValue([]),
      clearNotesForDate: jest.fn(),
      hasEmptyNoteForDate: jest.fn().mockReturnValue(false),
      hasInProgressNoteForDate: jest.fn().mockReturnValue(false),
      getAllNotes: jest.fn().mockReturnValue([]),
      getStats: jest.fn().mockReturnValue({ total: 0, completed: 0 })
    };

    // Mock NotesState constructor
    const { NotesState } = require('../../../src/core/state/NotesState.js');
    NotesState.mockImplementation(() => mockNotesState);

    // Create mock AppState
    mockAppState = {
      getCurrentDate: jest.fn().mockReturnValue('2024-01-15'),
      getSearchState: jest.fn().mockReturnValue({ isActive: false, query: '' }),
      markNoteAsEditing: jest.fn(),
      clearNoteEditing: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    // Get mocked NotesRepository
    NotesRepository = require('../../../src/core/data/NotesRepository.js').NotesRepository;
    NotesRepository.cleanupCorruptNotes.mockReturnValue({});
    NotesRepository.getNextNoteNumber.mockReturnValue(1);

    noteController = new NoteController(mockAppState, mockThemeManager);
  });

  describe('Initialization', () => {
    test('should initialize with app state and theme manager', () => {
      expect(noteController.appState).toBe(mockAppState);
      expect(noteController.themeManager).toBe(mockThemeManager);
      expect(noteController.notesState).toBeDefined();
    });

    test('should setup event listeners', () => {
      expect(mockAppState.addEventListener).toHaveBeenCalledWith('dateChange', expect.any(Function));
    });
  });

  describe('Note Creation', () => {
    test('should create a new note', () => {
      const mockNote = {
        number: 1,
        date: '2024-01-15',
        container: document.createElement('div'),
        timer: { stop: jest.fn() },
        elements: {
          projectID: { value: '' },
          attemptID: { value: '' },
          operationID: { value: '' },
          failingIssues: { value: '' },
          nonFailingIssues: { value: '' },
          discussion: { value: '' }
        }
      };
      
      Note.mockImplementation(() => mockNote);
      mockNotesState.getNotesForDate.mockReturnValue([]);

      const result = noteController.createNewNote(1, '2024-01-15');

      expect(Note).toHaveBeenCalledWith(
        1,
        '2024-01-15',
        1, // display index
        expect.objectContaining({
          enableEditing: expect.any(Function),
          completeEditing: expect.any(Function),
          deleteNote: expect.any(Function),
          markEditing: expect.any(Function)
        }),
        mockThemeManager
      );
      expect(result).toBe(mockNote);
      expect(mockNotesState.addNote).toHaveBeenCalledWith(mockNote);
    });

    test('should auto-create note when loading empty date', async () => {
      NotesRepository.cleanupCorruptNotes.mockReturnValue({});
      
      const mockNote = {
        number: 1,
        container: document.createElement('div'),
        timer: { stop: jest.fn() }
      };
      
      Note.mockImplementation(() => mockNote);

      await noteController.loadNotesForDate('2024-01-15');

      expect(Note).toHaveBeenCalled();
      expect(mockNotesState.clearNotesForDate).toHaveBeenCalledWith('2024-01-15');
    });

    test('should create new note when all existing notes are completed', async () => {
      NotesRepository.cleanupCorruptNotes.mockReturnValue({
        '1': { completed: true },
        '2': { completed: true }
      });
      NotesRepository.getNextNoteNumber.mockReturnValue(3);
      
      const mockNote = { number: 1, timer: { stop: jest.fn() } };
      Note.mockImplementation(() => mockNote);

      await noteController.loadNotesForDate('2024-01-15');

      // Should create notes for existing IDs plus one new one
      expect(Note).toHaveBeenCalledTimes(3); // 1, 2, and the new 3
    });
  });

  describe('Note Management', () => {
    test('should complete note editing', () => {
      const mockNote = {
        number: 1,
        date: '2024-01-15',
        timer: {
          stop: jest.fn(),
          hasStarted: true,
          startTimestamp: Date.now() - 1000,
          endTimestamp: null,
          completed: false,
          additionalTime: 0
        },
        updateToCompletedState: jest.fn(),
        completed: false,
        canceled: false,
        elements: {
          projectID: { value: 'proj-123' },
          attemptID: { value: 'att-456' },
          operationID: { value: 'op-789' },
          failingIssues: { value: 'failing issue' },
          nonFailingIssues: { value: 'non-failing issue' },
          discussion: { value: 'discussion text' }
        }
      };

      mockNotesState.getNote.mockReturnValue(mockNote);

      noteController.completeNoteEditing(1);

      expect(mockNote.updateToCompletedState).toHaveBeenCalledWith(false);
      expect(mockNote.timer.stop).toHaveBeenCalled();
      expect(mockNote.completed).toBe(true);
      expect(mockNotesState.updateNote).toHaveBeenCalledWith(mockNote);
      expect(NotesRepository.saveNote).toHaveBeenCalled();
    });

    test('should complete note editing with cancellation', () => {
      const mockNote = {
        number: 1,
        date: '2024-01-15',
        timer: {
          stop: jest.fn(),
          hasStarted: true,
          completed: false,
          additionalTime: 0
        },
        updateToCompletedState: jest.fn(),
        completed: false,
        canceled: false,
        elements: {
          projectID: { value: '' },
          attemptID: { value: '' },
          operationID: { value: '' },
          failingIssues: { value: '' },
          nonFailingIssues: { value: '' },
          discussion: { value: '' }
        }
      };

      mockNotesState.getNote.mockReturnValue(mockNote);

      noteController.completeNoteEditing(1, true);

      expect(mockNote.updateToCompletedState).toHaveBeenCalledWith(true);
      expect(mockNote.canceled).toBe(true);
    });

    test('should enable note editing', () => {
      const mockNote = {
        number: 1,
        date: '2024-01-15',
        timer: {
          restart: jest.fn(),
          completed: true,
          hasStarted: false
        },
        updateToEditingState: jest.fn(),
        completed: true,
        elements: {
          projectID: { value: '' },
          attemptID: { value: '' },
          operationID: { value: '' },
          failingIssues: { value: '' },
          nonFailingIssues: { value: '' },
          discussion: { value: '' }
        }
      };

      mockNotesState.getNote.mockReturnValue(mockNote);

      noteController.enableNoteEditing(1);

      expect(mockNote.timer.restart).toHaveBeenCalled();
      expect(mockNote.updateToEditingState).toHaveBeenCalled();
      expect(mockNote.completed).toBe(false);
      expect(mockAppState.markNoteAsEditing).toHaveBeenCalledWith(1);
    });

    test('should delete note', () => {
      const mockNote = {
        number: 1,
        date: '2024-01-15',
        timer: { stop: jest.fn() }
      };

      mockNotesState.getNote.mockReturnValue(mockNote);

      const result = noteController.deleteNote(1);

      expect(NotesRepository.deleteNote).toHaveBeenCalledWith('2024-01-15', 1);
      expect(NotesRepository.renumberNotes).toHaveBeenCalledWith('2024-01-15');
      expect(mockNotesState.removeNote).toHaveBeenCalledWith('2024-01-15', 1);
      expect(result).toBe(true);
    });

    test('should handle deleting non-existent note', () => {
      mockNotesState.getNote.mockReturnValue(null);

      const result = noteController.deleteNote(999);

      expect(result).toBe(false);
      expect(NotesRepository.deleteNote).not.toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    test('should load notes from repository', async () => {
      const savedData = {
        '1': { completed: false, failingIssues: 'test' },
        '2': { completed: true, discussion: 'done' }
      };

      NotesRepository.cleanupCorruptNotes.mockReturnValue(savedData);
      
      const mockNote = { number: 1, timer: { stop: jest.fn() } };
      Note.mockImplementation(() => mockNote);

      const result = await noteController.loadNotesForDate('2024-01-15');

      expect(NotesRepository.cleanupCorruptNotes).toHaveBeenCalledWith('2024-01-15');
      expect(mockNotesState.clearNotesForDate).toHaveBeenCalledWith('2024-01-15');
      expect(Note).toHaveBeenCalledTimes(2); // One for each existing note
      expect(result).toBeDefined();
    });

    test('should handle corrupt data gracefully', async () => {
      NotesRepository.cleanupCorruptNotes.mockReturnValue({});
      
      const mockNote = { number: 1, timer: { stop: jest.fn() } };
      Note.mockImplementation(() => mockNote);

      await noteController.loadNotesForDate('2024-01-15');

      // Should create auto note
      expect(Note).toHaveBeenCalled();
    });
  });

  describe('Timer Management', () => {
    test('should stop all note timers', () => {
      const mockNote1 = { timer: { stop: jest.fn() } };
      const mockNote2 = { timer: { stop: jest.fn() } };

      mockNotesState.getNotesForDate.mockReturnValue([mockNote1, mockNote2]);

      noteController.stopAllNoteTimers();

      expect(mockNote1.timer.stop).toHaveBeenCalled();
      expect(mockNote2.timer.stop).toHaveBeenCalled();
    });

    test('should handle notes without timers', () => {
      const mockNote1 = { timer: { stop: jest.fn() } };
      const mockNote2 = {}; // No timer

      mockNotesState.getNotesForDate.mockReturnValue([mockNote1, mockNote2]);

      // Should not throw error
      noteController.stopAllNoteTimers();

      expect(mockNote1.timer.stop).toHaveBeenCalled();
    });
  });

  describe('Statistics and Queries', () => {
    test('should get notes for current date', () => {
      const mockNotes = [
        { completed: true, canceled: false },
        { completed: false, canceled: false }
      ];

      mockNotesState.getNotesForDate.mockReturnValue(mockNotes);

      const result = noteController.getNotesForCurrentDate();

      expect(mockNotesState.getNotesForDate).toHaveBeenCalledWith('2024-01-15');
      expect(result).toBe(mockNotes);
    });

    test('should get all notes', () => {
      const mockNotes = [{ id: 1 }, { id: 2 }];
      mockNotesState.getAllNotes.mockReturnValue(mockNotes);

      const result = noteController.getAllNotes();

      expect(result).toBe(mockNotes);
    });

    test('should get specific note', () => {
      const mockNote = { number: 5, completed: true };
      mockNotesState.getNote.mockReturnValue(mockNote);

      const result = noteController.getNote(5);

      expect(mockNotesState.getNote).toHaveBeenCalledWith('2024-01-15', 5);
      expect(result).toBe(mockNote);
    });

    test('should get notes stats', () => {
      const mockStats = { total: 5, completed: 3, failed: 1 };
      mockNotesState.getStats.mockReturnValue(mockStats);

      const result = noteController.getNotesStats();

      expect(mockNotesState.getStats).toHaveBeenCalledWith('2024-01-15');
      expect(result).toBe(mockStats);
    });
  });

  describe('Display Index Calculation', () => {
    test('should calculate display index correctly', () => {
      const mockNotes = [
        { number: 1, canceled: false },
        { number: 2, canceled: true }, // Cancelled, doesn't count
        { number: 3, canceled: false }
      ];
      
      mockNotesState.getNotesForDate.mockReturnValue(mockNotes);

      const result = noteController.calculateDisplayIndex('2024-01-15', 4);

      // Should be 3 (two non-cancelled notes before it)
      expect(result).toBe(3);
    });
  });

  describe('Event Handling', () => {
    test('should notify listeners of note events', () => {
      const listener = jest.fn();
      noteController.addEventListener('noteCreated', listener);

      const mockNote = {
        number: 1,
        container: document.createElement('div'),
        timer: { stop: jest.fn() }
      };
      
      Note.mockImplementation(() => mockNote);

      noteController.createNewNote(1, '2024-01-15');

      expect(listener).toHaveBeenCalledWith({
        note: mockNote,
        date: '2024-01-15'
      });
    });

    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const goodListener = jest.fn();
      
      noteController.addEventListener('noteCreated', errorListener);
      noteController.addEventListener('noteCreated', goodListener);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockNote = { number: 1, timer: { stop: jest.fn() } };
      Note.mockImplementation(() => mockNote);

      noteController.createNewNote(1, '2024-01-15');

      expect(consoleSpy).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should remove event listeners', () => {
      const listener = jest.fn();
      noteController.addEventListener('noteCreated', listener);
      noteController.removeEventListener('noteCreated', listener);

      const mockNote = { number: 1, timer: { stop: jest.fn() } };
      Note.mockImplementation(() => mockNote);

      noteController.createNewNote(1, '2024-01-15');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Auto Note Creation Logic', () => {
    test('should create new note when no empty or in-progress notes exist', () => {
      mockNotesState.hasEmptyNoteForDate.mockReturnValue(false);
      mockNotesState.hasInProgressNoteForDate.mockReturnValue(false);
      NotesRepository.getNextNoteNumber.mockReturnValue(5);

      const listener = jest.fn();
      noteController.addEventListener('noteCreated', listener);

      const mockNote = { number: 5, timer: { stop: jest.fn() } };
      Note.mockImplementation(() => mockNote);

      noteController.checkAndCreateNewNote('2024-01-15');

      expect(listener).toHaveBeenCalledWith({
        note: mockNote,
        date: '2024-01-15',
        autoCreated: true
      });
    });

    test('should not create new note when empty note exists', () => {
      mockNotesState.hasEmptyNoteForDate.mockReturnValue(true);
      mockNotesState.hasInProgressNoteForDate.mockReturnValue(false);

      const listener = jest.fn();
      noteController.addEventListener('noteCreated', listener);

      noteController.checkAndCreateNewNote('2024-01-15');

      expect(listener).not.toHaveBeenCalled();
    });

    test('should not create new note when in-progress note exists', () => {
      mockNotesState.hasEmptyNoteForDate.mockReturnValue(false);
      mockNotesState.hasInProgressNoteForDate.mockReturnValue(true);

      const listener = jest.fn();
      noteController.addEventListener('noteCreated', listener);

      noteController.checkAndCreateNewNote('2024-01-15');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Note Deletion Behavior', () => {
    let mockNote1, mockNote2, mockNote3;
    
    beforeEach(() => {
      // Set up mock DOM environment
      global.document = {
        createElement: jest.fn(() => ({
          querySelector: jest.fn(() => ({ 
            textContent: '',
            className: ''
          }))
        })),
        querySelector: jest.fn()
      };

      mockNote1 = {
        number: 1,
        date: '2024-01-15',
        container: { querySelector: jest.fn(() => ({ textContent: '1', className: 'font-bold mb-2' })) },
        timer: { stop: jest.fn() },
        canceled: false
      };
      
      mockNote2 = {
        number: 2,
        date: '2024-01-15',
        container: { querySelector: jest.fn(() => ({ textContent: '2', className: 'font-bold mb-2' })) },
        timer: { stop: jest.fn() },
        canceled: false
      };
      
      mockNote3 = {
        number: 3,
        date: '2024-01-15',
        container: { querySelector: jest.fn(() => ({ textContent: '3', className: 'font-bold mb-2' })) },
        timer: { stop: jest.fn() },
        canceled: false
      };
    });

    test('should properly handle note deletion without duplication', () => {
      // Setup: 3 notes exist
      mockNotesState.getNote.mockReturnValue(mockNote2); // Note being deleted
      
      const noteDeletedListener = jest.fn();
      const notesClearingListener = jest.fn();
      
      noteController.addEventListener('noteDeleted', noteDeletedListener);
      noteController.addEventListener('notesClearing', notesClearingListener);

      // Delete note 2
      const result = noteController.deleteNote(2);

      // Verify deletion process
      expect(result).toBe(true);
      expect(NotesRepository.deleteNote).toHaveBeenCalledWith('2024-01-15', 2);
      expect(NotesRepository.renumberNotes).toHaveBeenCalledWith('2024-01-15');
      expect(mockNotesState.removeNote).toHaveBeenCalledWith('2024-01-15', 2);
      
      // Verify events are fired in correct order
      expect(noteDeletedListener).toHaveBeenCalledWith({
        note: mockNote2,
        date: '2024-01-15',
        number: 2
      });
      expect(notesClearingListener).toHaveBeenCalledWith({ date: '2024-01-15' });
      
      // Verify reload is triggered
      expect(mockNotesState.clearNotesForDate).toHaveBeenCalledWith('2024-01-15');
    });

    test('should return false when deleting non-existent note', () => {
      mockNotesState.getNote.mockReturnValue(null);

      const result = noteController.deleteNote(999);

      expect(result).toBe(false);
      expect(NotesRepository.deleteNote).not.toHaveBeenCalled();
      expect(NotesRepository.renumberNotes).not.toHaveBeenCalled();
    });

    test('should properly call reloadNotesForDate after deletion', () => {
      mockNotesState.getNote.mockReturnValue(mockNote1);
      
      // Spy on the method
      const reloadSpy = jest.spyOn(noteController, 'reloadNotesForDate');

      noteController.deleteNote(1);

      expect(reloadSpy).toHaveBeenCalledWith('2024-01-15');
    });
  });

  describe('Note Cancellation and Display Index Updates', () => {
    let mockNote1, mockNote2, mockNote3;
    
    beforeEach(() => {
      // Mock DOM elements for number display
      const mockNumberDisplay1 = { textContent: '1', className: 'font-bold mb-2' };
      const mockNumberDisplay2 = { textContent: '2', className: 'font-bold mb-2' };
      const mockNumberDisplay3 = { textContent: '3', className: 'font-bold mb-2' };

      mockNote1 = {
        number: 1,
        date: '2024-01-15',
        canceled: false,
        completed: false,
        container: { querySelector: jest.fn(() => mockNumberDisplay1) },
        timer: { stop: jest.fn(), hasStarted: true, endTimestamp: null, completed: false, additionalTime: 0 },
        updateToCompletedState: jest.fn(),
        elements: {
          projectID: { value: '' },
          attemptID: { value: '' },
          operationID: { value: '' },
          failingIssues: { value: '' },
          nonFailingIssues: { value: '' },
          discussion: { value: '' }
        }
      };
      
      mockNote2 = {
        number: 2,
        date: '2024-01-15',
        canceled: false,
        completed: false,
        container: { querySelector: jest.fn(() => mockNumberDisplay2) },
        timer: { stop: jest.fn(), hasStarted: true, endTimestamp: null, completed: false, additionalTime: 0 },
        updateToCompletedState: jest.fn(),
        elements: {
          projectID: { value: '' },
          attemptID: { value: '' },
          operationID: { value: '' },
          failingIssues: { value: '' },
          nonFailingIssues: { value: '' },
          discussion: { value: '' }
        }
      };
      
      mockNote3 = {
        number: 3,
        date: '2024-01-15',
        canceled: false,
        completed: false,
        container: { querySelector: jest.fn(() => mockNumberDisplay3) },
        timer: { stop: jest.fn(), hasStarted: true, endTimestamp: null, completed: false, additionalTime: 0 },
        updateToCompletedState: jest.fn(),
        elements: {
          projectID: { value: '' },
          attemptID: { value: '' },
          operationID: { value: '' },
          failingIssues: { value: '' },
          nonFailingIssues: { value: '' },
          discussion: { value: '' }
        }
      };
    });

    test('should refresh display indices when note is canceled', () => {
      // Setup: Note 2 will be canceled
      mockNotesState.getNote.mockReturnValue(mockNote2);
      mockNotesState.getNotesForDate.mockReturnValue([mockNote1, mockNote2, mockNote3]);
      
      // Spy on refreshDisplayIndices
      const refreshSpy = jest.spyOn(noteController, 'refreshDisplayIndices');

      // Cancel note 2
      noteController.completeNoteEditing(2, true);

      // Verify that refresh was called when note was canceled
      expect(refreshSpy).toHaveBeenCalledWith('2024-01-15');
      expect(mockNote2.updateToCompletedState).toHaveBeenCalledWith(true);
      expect(mockNote2.canceled).toBe(true);
    });

    test('should not refresh display indices when note is completed normally', () => {
      mockNotesState.getNote.mockReturnValue(mockNote1);
      
      const refreshSpy = jest.spyOn(noteController, 'refreshDisplayIndices');

      // Complete note normally (not canceled)
      noteController.completeNoteEditing(1, false);

      // Verify that refresh was NOT called for normal completion
      expect(refreshSpy).not.toHaveBeenCalled();
      expect(mockNote1.updateToCompletedState).toHaveBeenCalledWith(false);
      expect(mockNote1.canceled).toBe(false);
    });

    test('should update note number displays correctly during refresh', () => {
      // Setup notes where note 2 is canceled
      mockNote2.canceled = true;
      mockNotesState.getNotesForDate.mockReturnValue([mockNote1, mockNote2, mockNote3]);

      const numberDisplay1 = mockNote1.container.querySelector();
      const numberDisplay2 = mockNote2.container.querySelector();
      const numberDisplay3 = mockNote3.container.querySelector();

      // Call refreshDisplayIndices
      noteController.refreshDisplayIndices('2024-01-15');

      // Verify display numbers are updated correctly
      // Note 1: display index 1
      expect(numberDisplay1.textContent).toBe('1');
      expect(numberDisplay1.className).toContain('mock-color-class');
      
      // Note 2: should show "Cancelled"
      expect(numberDisplay2.textContent).toBe('Cancelled');
      expect(numberDisplay2.className).toContain('mock-color-class');
      
      // Note 3: display index 2 (since note 2 is canceled)
      expect(numberDisplay3.textContent).toBe('2');
      expect(numberDisplay3.className).toContain('mock-color-class');
    });

    test('should calculate display index excluding canceled notes', () => {
      // Setup: Note 2 is canceled
      const notes = [
        { number: 1, canceled: false },
        { number: 2, canceled: true },  // This one is canceled
        { number: 3, canceled: false }
      ];
      
      mockNotesState.getNotesForDate.mockReturnValue(notes);

      // Calculate display index for note 4
      const result = noteController.calculateDisplayIndex('2024-01-15', 4);
      
      // Should be 3: note 1 (index 1) + note 3 (index 2) + new note 4 (index 3)
      expect(result).toBe(3);
    });

    test('should handle updateNoteDisplayNumber with null display index for canceled notes', () => {
      const mockNumberDisplay = { textContent: '', className: '' };
      mockNote1.container.querySelector.mockReturnValue(mockNumberDisplay);
      mockNote1.canceled = true;

      noteController.updateNoteDisplayNumber(mockNote1, null);

      expect(mockNumberDisplay.textContent).toBe('Cancelled');
      expect(mockNumberDisplay.className).toContain('mock-color-class');
    });

    test('should handle updateNoteDisplayNumber with valid display index', () => {
      const mockNumberDisplay = { textContent: '', className: '' };
      mockNote1.container.querySelector.mockReturnValue(mockNumberDisplay);

      noteController.updateNoteDisplayNumber(mockNote1, 5);

      expect(mockNumberDisplay.textContent).toBe('5');
      expect(mockNumberDisplay.className).toContain('mock-color-class');
    });

    test('should handle notes without container in updateNoteDisplayNumber', () => {
      const noteWithoutContainer = { ...mockNote1, container: null };

      // Should not throw error
      expect(() => {
        noteController.updateNoteDisplayNumber(noteWithoutContainer, 1);
      }).not.toThrow();
    });

    test('should handle refreshDisplayIndices with empty notes array', () => {
      mockNotesState.getNotesForDate.mockReturnValue([]);

      // Should not throw error
      expect(() => {
        noteController.refreshDisplayIndices('2024-01-15');
      }).not.toThrow();
    });
  });
});