import { SearchController } from '../../../src/core/controllers/SearchController.js';

// Mock dependencies
jest.mock('../../../src/core/state/AppState.js');
jest.mock('../../../src/core/data/NotesRepository.js', () => ({
  NotesRepository: {
    searchNotes: jest.fn(),
    getNotesForDate: jest.fn(),
    getAllNotes: jest.fn()
  }
}));
jest.mock('../../../src/core/utils/DateUtils.js', () => ({
  DateUtils: {
    formatDate: jest.fn((dateStr) => {
      if (dateStr === '2024-01-15') return 'Jan 15, 2024';
      return 'Invalid Date';
    })
  }
}));

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

describe('SearchController', () => {
  let searchController;
  let mockAppState;
  let NotesRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Create mock AppState
    mockAppState = {
      setSearchState: jest.fn(),
      getSearchState: jest.fn().mockReturnValue({ isActive: false, query: '' }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    // Get the mocked NotesRepository
    NotesRepository = require('../../../src/core/data/NotesRepository.js').NotesRepository;
    
    // Setup default mock return values
    NotesRepository.searchNotes.mockReturnValue([
      {
        dateKey: '2024-01-15',
        id: '1',
        note: {
          failingIssues: 'test failing issues',
          nonFailingIssues: 'test non-failing',
          discussion: 'test discussion',
          projectID: 'proj-123',
          attemptID: 'att-456',
          operationID: 'op-789',
          completed: true,
          canceled: false
        }
      }
    ]);

    NotesRepository.getNotesForDate.mockReturnValue({
      '1': { completed: true, canceled: false }
    });

    searchController = new SearchController(mockAppState, null);
  });

  describe('Search Functionality', () => {
    test('should search notes by content', () => {
      const query = 'failing';
      
      searchController.searchNotes(query);

      expect(mockAppState.setSearchState).toHaveBeenCalledWith(true, query);
      expect(NotesRepository.searchNotes).toHaveBeenCalledWith(query);
      expect(searchController.searchResults).toHaveLength(1);
      expect(searchController.searchResults[0].note.failingIssues).toContain('failing');
    });

    test('should call NotesRepository with search query', () => {
      const query = 'test-query';
      
      searchController.searchNotes(query);

      expect(NotesRepository.searchNotes).toHaveBeenCalledWith(query);
      expect(mockAppState.setSearchState).toHaveBeenCalledWith(true, query);
    });

    test('should return empty results when query is empty', () => {
      const result = searchController.searchNotes('');

      expect(result).toEqual([]);
      expect(searchController.searchResults).toHaveLength(0);
    });

    test('should return empty results for no matches', () => {
      NotesRepository.searchNotes.mockReturnValue([]);
      
      searchController.searchNotes('nonexistent');

      expect(searchController.searchResults).toHaveLength(0);
    });

    test('should enhance results with formatted date and display index', () => {
      searchController.searchNotes('test');

      expect(searchController.searchResults).toHaveLength(1);
      expect(searchController.searchResults[0].formattedDate).toBe('Jan 15, 2024');
      expect(searchController.searchResults[0].displayIndex).toBeDefined();
    });
  });

  describe('Search State Management', () => {
    test('should clear search', () => {
      searchController.searchResults = [{ note: {}, dateKey: '2024-01-15' }];
      
      searchController.clearSearch();

      expect(mockAppState.setSearchState).toHaveBeenCalledWith(false, '');
      expect(searchController.searchResults).toHaveLength(0);
    });

    test('should check if search is active', () => {
      mockAppState.getSearchState.mockReturnValue({ isActive: true, query: 'test' });
      
      const result = searchController.isSearchActive();

      expect(result).toBe(true);
      expect(mockAppState.getSearchState).toHaveBeenCalled();
    });

    test('should get current query', () => {
      mockAppState.getSearchState.mockReturnValue({ isActive: true, query: 'test query' });
      
      const result = searchController.getCurrentQuery();

      expect(result).toBe('test query');
    });

    test('should get search results', () => {
      const mockResults = [{ note: {}, dateKey: '2024-01-15' }];
      searchController.searchResults = mockResults;
      
      const result = searchController.getSearchResults();

      expect(result).toBe(mockResults);
    });
  });

  describe('Navigation', () => {
    test('should navigate to search result', () => {
      const dateKey = '2024-01-15';
      const noteId = 5;
      const listener = jest.fn();
      
      // Add navigateToResult to listeners
      searchController.listeners.navigateToResult = [];
      searchController.addEventListener('navigateToResult', listener);
      searchController.navigateToResult(dateKey, noteId);

      expect(listener).toHaveBeenCalledWith({
        dateKey,
        noteId,
        shouldHighlight: true
      });
    });
  });

  describe('Event Handling', () => {
    test('should notify listeners of search events', () => {
      const listener = jest.fn();
      searchController.addEventListener('searchCompleted', listener);

      searchController.searchNotes('test');

      expect(listener).toHaveBeenCalledWith({
        query: 'test',
        results: searchController.searchResults,
        count: 1
      });
    });

    test('should notify listeners of search cleared', () => {
      const listener = jest.fn();
      searchController.addEventListener('searchCleared', listener);

      searchController.clearSearch();

      expect(listener).toHaveBeenCalledWith({});
    });
  });

  describe('Error Handling', () => {
    test('should handle empty results gracefully', () => {
      NotesRepository.searchNotes.mockReturnValue([]);
      
      searchController.searchNotes('test');

      expect(searchController.searchResults).toHaveLength(0);
    });

    test('should handle repository errors gracefully', () => {
      NotesRepository.searchNotes.mockImplementation(() => {
        throw new Error('Repository error');
      });
      
      expect(() => searchController.searchNotes('test')).toThrow();
    });
  });
});