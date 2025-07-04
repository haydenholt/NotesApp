import { NoteListView } from '../../../src/ui/views/NoteListView.js';

// Mock DOMHelpers
jest.mock('../../../src/core/utils/DOMHelpers.js', () => ({
  DOMHelpers: {
    scrollToElement: jest.fn(),
    addHighlight: jest.fn()
  }
}));

// Mock ThemeManager
const mockThemeManager = {
  getColor: jest.fn(() => 'mock-color-class'),
  combineClasses: jest.fn((...classes) => classes.filter(cls => cls && cls.trim() !== '').join(' '))
};

describe('NoteListView', () => {
  let noteListView;
  let container;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup DOM
    document.body.innerHTML = '<div id="notes-container"></div>';
    container = document.getElementById('notes-container');
    
    noteListView = new NoteListView(mockThemeManager);
    noteListView.render(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize with theme manager', () => {
      expect(noteListView.themeManager).toBe(mockThemeManager);
      expect(noteListView.container).toBe(container);
    });

    test('should have empty listeners initially', () => {
      expect(noteListView.listeners.noteHighlighted).toHaveLength(0);
    });
  });

  describe('Note Management', () => {
    test('should add note to container', () => {
      const mockNote = {
        container: document.createElement('div')
      };
      mockNote.container.textContent = 'Test note';

      noteListView.addNote(mockNote);

      expect(container.contains(mockNote.container)).toBe(true);
      expect(container.children).toHaveLength(1);
    });

    test('should remove note from container', () => {
      const mockNote = {
        container: document.createElement('div')
      };
      container.appendChild(mockNote.container);

      noteListView.removeNote(mockNote);

      expect(container.contains(mockNote.container)).toBe(false);
      expect(container.children).toHaveLength(0);
    });

    test('should handle removing note not in container', () => {
      const mockNote = {
        container: document.createElement('div')
      };

      // Should not throw error
      noteListView.removeNote(mockNote);

      expect(container.children).toHaveLength(0);
    });

    test('should handle adding note without container', () => {
      const mockNote = {};

      // Should not throw error
      noteListView.addNote(mockNote);

      expect(container.children).toHaveLength(0);
    });
  });

  describe('Clear Functionality', () => {
    test('should clear container and destroy note instances', () => {
      const mockNote1 = document.createElement('div');
      const mockNote2 = document.createElement('div');
      
      mockNote1.dataset.noteId = '1';
      mockNote2.dataset.noteId = '2';
      
      const mockInstance1 = { destroy: jest.fn() };
      const mockInstance2 = { destroy: jest.fn() };
      
      mockNote1._noteInstance = mockInstance1;
      mockNote2._noteInstance = mockInstance2;
      
      container.appendChild(mockNote1);
      container.appendChild(mockNote2);

      noteListView.clear();

      expect(mockInstance1.destroy).toHaveBeenCalled();
      expect(mockInstance2.destroy).toHaveBeenCalled();
      expect(container.innerHTML).toBe('');
    });

    test('should clear container without note instances', () => {
      const div = document.createElement('div');
      container.appendChild(div);

      noteListView.clear();

      expect(container.innerHTML).toBe('');
    });

    test('should handle clear when no container', () => {
      noteListView.container = null;

      // Should not throw error
      noteListView.clear();
    });
  });

  describe('Note Navigation', () => {
    test('should highlight note', () => {
      const noteElement = document.createElement('div');
      noteElement.dataset.noteId = '5';
      container.appendChild(noteElement);

      const listener = jest.fn();
      noteListView.addEventListener('noteHighlighted', listener);

      noteListView.highlightNote('5', 3000);

      expect(listener).toHaveBeenCalledWith({
        noteId: '5',
        element: noteElement
      });
    });

    test('should scroll to note', () => {
      const { DOMHelpers } = require('../../../src/core/utils/DOMHelpers.js');
      
      const noteElement = document.createElement('div');
      noteElement.dataset.noteId = '3';
      container.appendChild(noteElement);

      noteListView.scrollToNote('3', 'instant');

      expect(DOMHelpers.scrollToElement).toHaveBeenCalledWith(noteElement, 'instant', 'start');
    });

    test('should scroll to bottom', () => {
      const { DOMHelpers } = require('../../../src/core/utils/DOMHelpers.js');
      
      const noteElement1 = document.createElement('div');
      const noteElement2 = document.createElement('div');
      container.appendChild(noteElement1);
      container.appendChild(noteElement2);

      noteListView.scrollToBottom('smooth');

      expect(DOMHelpers.scrollToElement).toHaveBeenCalledWith(noteElement2, 'smooth', 'start');
    });

    test('should scroll to top', () => {
      const scrollToSpy = jest.fn();
      window.scrollTo = scrollToSpy;

      noteListView.scrollToTop();

      expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('Note Queries', () => {
    test('should get note elements', () => {
      const noteElement1 = document.createElement('div');
      const noteElement2 = document.createElement('div');
      const regularDiv = document.createElement('div');
      
      noteElement1.dataset.noteId = '1';
      noteElement2.dataset.noteId = '2';
      
      container.appendChild(noteElement1);
      container.appendChild(regularDiv);
      container.appendChild(noteElement2);

      const noteElements = noteListView.getNoteElements();

      expect(noteElements).toHaveLength(2);
      expect(noteElements[0]).toBe(noteElement1);
      expect(noteElements[1]).toBe(noteElement2);
    });

    test('should get visible notes', () => {
      const noteElement1 = document.createElement('div');
      const noteElement2 = document.createElement('div');
      
      noteElement1.dataset.noteId = '1';
      noteElement2.dataset.noteId = '2';
      
      // Mock getBoundingClientRect for visibility testing
      noteElement1.getBoundingClientRect = jest.fn().mockReturnValue({
        top: 100,
        bottom: 200
      });
      noteElement2.getBoundingClientRect = jest.fn().mockReturnValue({
        top: 2000,
        bottom: 2100
      });
      
      container.appendChild(noteElement1);
      container.appendChild(noteElement2);

      // Mock window height
      Object.defineProperty(window, 'innerHeight', {
        value: 1000,
        writable: true
      });

      const visibleNotes = noteListView.getVisibleNotes();

      expect(visibleNotes).toHaveLength(1);
      expect(visibleNotes[0]).toBe(noteElement1);
    });

    test('should focus first textarea', () => {
      const textarea = document.createElement('textarea');
      const focusSpy = jest.fn();
      textarea.focus = focusSpy;
      
      container.appendChild(textarea);

      noteListView.focusFirstTextarea();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('Theme Updates', () => {
    test('should handle theme updates', () => {
      // Theme updates are handled by individual Note components
      // This method exists for consistency
      noteListView.updateTheme();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    test('should add and remove event listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      noteListView.addEventListener('noteHighlighted', listener1);
      noteListView.addEventListener('noteHighlighted', listener2);

      expect(noteListView.listeners.noteHighlighted).toHaveLength(2);

      noteListView.removeEventListener('noteHighlighted', listener1);

      expect(noteListView.listeners.noteHighlighted).toHaveLength(1);
      expect(noteListView.listeners.noteHighlighted[0]).toBe(listener2);
    });

    test('should notify listeners', () => {
      const listener = jest.fn();
      noteListView.addEventListener('noteHighlighted', listener);

      const data = { noteId: '5', element: document.createElement('div') };
      noteListView.notifyListeners('noteHighlighted', data);

      expect(listener).toHaveBeenCalledWith(data);
    });

    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const goodListener = jest.fn();
      
      noteListView.addEventListener('noteHighlighted', errorListener);
      noteListView.addEventListener('noteHighlighted', goodListener);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      noteListView.notifyListeners('noteHighlighted', {});

      expect(consoleSpy).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});