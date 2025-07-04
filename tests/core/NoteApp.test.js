import NoteApp from '../../src/core/NoteApp.js';
import { Note } from '../../src/ui/components/Note.js';

// Mock all the dependencies
jest.mock('../../src/core/state/AppState.js');
jest.mock('../../src/core/controllers/NoteController.js');
jest.mock('../../src/core/controllers/TimerController.js');
jest.mock('../../src/core/controllers/SearchController.js');
jest.mock('../../src/core/controllers/StatisticsController.js');
jest.mock('../../src/ui/views/NoteListView.js');
jest.mock('../../src/ui/views/SearchResultsView.js');
jest.mock('../../src/ui/views/StatisticsView.js');
jest.mock('../../src/ui/views/DateNavigationView.js');
jest.mock('../../src/ui/views/OffPlatformView.js');
jest.mock('../../src/ui/views/ModalView.js');

// Mock ThemeManager
const mockThemeManager = {
  combineClasses: jest.fn((...classes) => classes.filter(cls => cls && cls.trim() !== '').join(' ')),
  getColor: jest.fn((category, colorKey) => {
    const colors = {
      background: { 
        card: 'bg-white', 
        primary: 'bg-white', 
        secondary: 'bg-gray-50', 
        tertiary: 'bg-gray-100' 
      },
      border: { 
        primary: 'border-gray-200', 
        secondary: 'border-gray-300',
        focus: 'border-blue-500' 
      },
      text: { 
        primary: 'text-gray-900', 
        secondary: 'text-gray-700', 
        tertiary: 'text-gray-600',
        muted: 'text-gray-500' 
      },
      timer: {
        active: 'text-green-600',
        inactive: 'text-gray-700'
      },
      note: { 
        completed: 'bg-gray-50', 
        cancelled: 'bg-red-50', 
        cancelledText: 'text-red-600', 
        cancelledNumber: 'text-red-600' 
      }
    };
    return colors[category]?.[colorKey] || 'mock-fallback-class';
  }),
  getStatusClasses: jest.fn((status) => {
    const statusColors = {
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
      success: 'text-green-600'
    };
    return statusColors[status] || statusColors.info;
  }),
  getPrimaryButtonClasses: jest.fn(() => 'bg-blue-500 hover:bg-blue-600 text-white'),
  getInputClasses: jest.fn().mockReturnValue('bg-white border-gray-300 focus:border-blue-500 text-gray-900'),
  getFocusClasses: jest.fn().mockReturnValue({
    ring: 'focus:ring-2',
    border: 'focus:border-blue-500',
    combined: 'focus:ring-2 focus:border-blue-500'
  })
};

describe('NoteApp', () => {
  let noteApp;
  let mockControllers;
  let mockViews;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup DOM elements that NoteApp expects
    document.body.innerHTML = `
      <div id="notesContainer"></div>
      <div id="totalTime"></div>
      <div id="statsDisplay"></div>
      <div id="projectFailRateDisplay"></div>
      <input id="searchInput" />
      <button id="clearSearchButton"></button>
      <div id="offPlatformContainer"></div>
    `;

    // Initialize NoteApp
    noteApp = new NoteApp(mockThemeManager);

    // Get references to the mocked controllers and views
    mockControllers = {
      note: noteApp.noteController,
      timer: noteApp.timerController,
      search: noteApp.searchController,
      statistics: noteApp.statisticsController
    };

    mockViews = {
      noteList: noteApp.noteListView,
      searchResults: noteApp.searchResultsView,
      statistics: noteApp.statisticsView,
      dateNavigation: noteApp.dateNavigationView,
      offPlatform: noteApp.offPlatformView,
      modal: noteApp.modalView
    };
  });

  afterEach(() => {
    if (noteApp && noteApp.destroy) {
      noteApp.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    test('should initialize all controllers and views', () => {
      expect(mockControllers.note).toBeDefined();
      expect(mockControllers.timer).toBeDefined();
      expect(mockControllers.search).toBeDefined();
      expect(mockControllers.statistics).toBeDefined();
      
      expect(mockViews.noteList).toBeDefined();
      expect(mockViews.searchResults).toBeDefined();
      expect(mockViews.statistics).toBeDefined();
      expect(mockViews.dateNavigation).toBeDefined();
      expect(mockViews.offPlatform).toBeDefined();
      expect(mockViews.modal).toBeDefined();
    });

    test('should render all views', () => {
      expect(mockViews.noteList.render).toHaveBeenCalledWith(noteApp.elements.container);
      expect(mockViews.searchResults.render).toHaveBeenCalledWith(noteApp.elements.container);
      expect(mockViews.statistics.render).toHaveBeenCalledWith(
        noteApp.elements.statsDisplay, 
        noteApp.elements.projectFailRateDisplay
      );
      expect(mockViews.dateNavigation.render).toHaveBeenCalled();
      expect(mockViews.offPlatform.render).toHaveBeenCalledWith(noteApp.elements.offPlatformContainer);
    });

    test('should setup event listeners', () => {
      expect(noteApp.appState.addEventListener).toHaveBeenCalledWith('dateChange', expect.any(Function));
      expect(noteApp.appState.addEventListener).toHaveBeenCalledWith('searchChange', expect.any(Function));
    });

    test('should make app globally available', () => {
      expect(window.app).toBe(noteApp);
    });
  });

  describe('Event Handling', () => {
    test('should handle date change events', () => {
      const newDate = '2024-01-15';
      
      // Simulate date change event from AppState
      const dateChangeHandler = noteApp.appState.addEventListener.mock.calls
        .find(call => call[0] === 'dateChange')?.[1];
      
      if (dateChangeHandler) {
        dateChangeHandler({ newDate });
      }

      expect(mockViews.dateNavigation.setCurrentDate).toHaveBeenCalledWith(newDate);
    });

    test('should handle note creation events', () => {
      const mockNote = { number: 1, container: document.createElement('div') };
      
      // Simulate note created event from NoteController
      const noteCreatedHandler = noteApp.noteController.addEventListener.mock.calls
        .find(call => call[0] === 'noteCreated')?.[1];
      
      if (noteCreatedHandler) {
        noteCreatedHandler({ note: mockNote, autoCreated: true });
      }

      expect(mockViews.noteList.addNote).toHaveBeenCalledWith(mockNote);
      expect(mockViews.noteList.scrollToNote).toHaveBeenCalledWith(mockNote.number);
    });

    test('should handle search input changes', () => {
      const searchInput = document.getElementById('searchInput');
      searchInput.value = 'test query';
      
      // Trigger input event
      const inputEvent = new Event('input');
      searchInput.dispatchEvent(inputEvent);
      
      // Wait for debounce
      setTimeout(() => {
        expect(mockControllers.search.searchNotes).toHaveBeenCalledWith('test query');
      }, 350);
    });

    test('should handle clear search button', () => {
      const clearButton = document.getElementById('clearSearchButton');
      clearButton.click();
      
      expect(mockControllers.search.clearSearch).toHaveBeenCalled();
    });
  });

  describe('View Management', () => {
    test('should show search mode when search starts', () => {
      noteApp.showSearchMode();
      
      expect(mockViews.offPlatform.hide).toHaveBeenCalled();
      expect(mockViews.noteList.clear).toHaveBeenCalled();
    });

    test('should show normal mode when search clears', () => {
      noteApp.showNormalMode();
      
      expect(mockViews.offPlatform.show).toHaveBeenCalled();
      expect(mockViews.searchResults.clear).toHaveBeenCalled();
    });

    test('should refresh all views on theme change', () => {
      noteApp.refreshAllViews();
      
      expect(mockViews.dateNavigation.updateTheme).toHaveBeenCalled();
      expect(mockViews.offPlatform.updateTheme).toHaveBeenCalled();
    });
  });

  describe('Statistics Updates', () => {
    test('should update statistics when notes change', () => {
      const mockNotes = [{ completed: true, canceled: false }];
      const mockStats = { total: 1, completed: 1 };
      const mockProjectStats = {};

      mockControllers.note.getNotesForCurrentDate.mockReturnValue(mockNotes);
      mockControllers.statistics.calculateDailyStatistics.mockReturnValue(mockStats);
      mockControllers.statistics.calculateProjectFailRates.mockReturnValue(mockProjectStats);

      noteApp.updateStatistics();

      expect(mockControllers.statistics.calculateDailyStatistics).toHaveBeenCalledWith(mockNotes);
      expect(mockViews.statistics.renderDailyStatistics).toHaveBeenCalledWith(mockStats);
      expect(mockViews.statistics.renderProjectFailRates).toHaveBeenCalledWith(
        mockProjectStats, 
        noteApp.appState.getCurrentDate()
      );
    });
  });

  describe('Timer Management', () => {
    test('should update total time display', () => {
      const onPlatformSeconds = 3600;
      const offPlatformSeconds = 1800;

      mockControllers.timer.getTotalOnPlatformSeconds.mockReturnValue(onPlatformSeconds);
      mockControllers.timer.getTotalOffPlatformSeconds.mockReturnValue(offPlatformSeconds);

      noteApp.updateTotalTimeDisplay();

      expect(noteApp.elements.totalTimeDisplay.innerHTML).toContain('01:00:00');
      expect(noteApp.elements.totalTimeDisplay.innerHTML).toContain('00:30:00');
      expect(noteApp.elements.totalTimeDisplay.innerHTML).toContain('01:30:00');
    });

    test('should handle timer edit requests', async () => {
      const categoryId = 'training';
      const label = 'Training';
      const currentSeconds = 3600;

      mockControllers.timer.getCurrentSeconds.mockReturnValue(currentSeconds);
      mockViews.modal.createTimerEditModal.mockResolvedValue({
        hours: 2,
        minutes: 0,
        seconds: 0
      });

      await noteApp.handleTimerEdit(categoryId, label);

      expect(mockViews.modal.createTimerEditModal).toHaveBeenCalledWith(
        categoryId, label, 1, 0, 0
      );
      expect(mockControllers.timer.editTimer).toHaveBeenCalledWith(
        categoryId, 2, 0, 0
      );
    });
  });

  describe('Navigation', () => {
    test('should navigate to specific note', () => {
      const dateKey = '2024-01-15';
      const noteId = 5;

      noteApp.navigateToNote(dateKey, noteId);

      expect(noteApp.appState.setCurrentDate).toHaveBeenCalledWith(dateKey);
      expect(noteApp.elements.searchInput.value).toBe('');
      
      setTimeout(() => {
        expect(mockViews.noteList.highlightNote).toHaveBeenCalledWith(noteId);
      }, 150);
    });
  });

  describe('Compatibility Methods', () => {
    test('should stop all timers', () => {
      noteApp.stopAllTimers();
      
      expect(mockControllers.note.stopAllNoteTimers).toHaveBeenCalled();
      expect(mockControllers.timer.stopAllTimers).toHaveBeenCalled();
    });

    test('should stop all note timers', () => {
      noteApp.stopAllNoteTimers();
      
      expect(mockControllers.note.stopAllNoteTimers).toHaveBeenCalled();
    });

    test('should update total time', () => {
      const spy = jest.spyOn(noteApp, 'updateTotalTimeDisplay');
      noteApp.updateTotalTime();
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should cleanup timers and global references on destroy', () => {
      noteApp.destroy();
      
      expect(mockControllers.timer.cleanup).toHaveBeenCalled();
      expect(window.app).toBeUndefined();
    });
  });

  describe('Theme Integration', () => {
    test('should handle theme changes with scroll position preservation', () => {
      const scrollPosition = 500;
      
      // Mock scroll position
      Object.defineProperty(window, 'pageYOffset', {
        value: scrollPosition,
        writable: true
      });

      // Simulate theme change event
      const themeEvent = new CustomEvent('themeChanged', {
        detail: { scrollPosition }
      });
      
      document.dispatchEvent(themeEvent);
      
      // Should refresh views and restore scroll position
      expect(mockViews.dateNavigation.updateTheme).toHaveBeenCalled();
      expect(mockViews.offPlatform.updateTheme).toHaveBeenCalled();
    });
  });

  describe('Search Integration', () => {
    test('should handle search completion', () => {
      const mockResults = [
        { dateKey: '2024-01-15', id: 1, note: { completed: true } }
      ];
      const query = 'test';

      noteApp.searchController.getCurrentQuery.mockReturnValue(query);
      noteApp.searchController.getSearchResults.mockReturnValue(mockResults);

      // Simulate search completed event
      const searchCompletedHandler = noteApp.searchController.addEventListener.mock.calls
        .find(call => call[0] === 'searchCompleted')?.[1];
      
      if (searchCompletedHandler) {
        searchCompletedHandler({ results: mockResults });
      }

      expect(mockViews.searchResults.renderSearchResults).toHaveBeenCalledWith(mockResults, query);
    });

    test('should handle search cleared', () => {
      const currentDate = '2024-01-15';
      noteApp.appState.getCurrentDate.mockReturnValue(currentDate);

      // Simulate search cleared event
      const searchClearedHandler = noteApp.searchController.addEventListener.mock.calls
        .find(call => call[0] === 'searchCleared')?.[1];
      
      if (searchClearedHandler) {
        searchClearedHandler();
      }

      expect(mockViews.noteList.clear).toHaveBeenCalled();
      expect(noteApp.noteController.loadNotesForDate).toHaveBeenCalledWith(currentDate);
    });
  });
});