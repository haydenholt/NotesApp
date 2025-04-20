/**
 * Test for main.js
 * 
 * We need to use a different approach since the main.js module directly imports the components.
 * We'll have to mock the modules at the system level.
 */

// Set up mocks before we require anything
const mockNoteApp = jest.fn();
const mockDiffTool = jest.fn();
const mockViewManager = jest.fn();

// Mock the components at the module system level
jest.mock('../src/app/NoteApp.js', () => {
  return mockNoteApp;
});

jest.mock('../src/components/DiffTool.js', () => {
  return mockDiffTool;
});

jest.mock('../src/components/ViewManager.js', () => {
  return mockViewManager;
});

describe('Main Module', () => {
  let realAddEventListener;
  let domContentLoadedCallback;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock window properties
    delete window.noteApp;
    delete window.diffTool;
    delete window.viewManager;
    
    // Mock document.addEventListener to capture the callback
    realAddEventListener = document.addEventListener;
    domContentLoadedCallback = null;
    
    document.addEventListener = jest.fn((event, callback) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });
    
    // Set up mock returns
    mockNoteApp.mockReturnValue({ name: 'mockNoteApp' });
    mockDiffTool.mockReturnValue({ name: 'mockDiffTool' });
    mockViewManager.mockReturnValue({ name: 'mockViewManager' });
  });
  
  afterEach(() => {
    // Restore original addEventListener
    document.addEventListener = realAddEventListener;
    
    // Reset modules so we can re-require for each test
    jest.resetModules();
  });
  
  test('should register DOMContentLoaded event listener', () => {
    // Import the main module
    require('../src/main.js');
    
    // Verify addEventListener was called correctly
    expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
  });
  
  test('should initialize app components when DOM is loaded', () => {
    // Import the main module
    require('../src/main.js');
    
    // Verify addEventListener was called
    expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    
    // Simulate the DOMContentLoaded event by calling the callback
    expect(domContentLoadedCallback).not.toBeNull();
    domContentLoadedCallback();
    
    // Verify that components were initialized
    expect(mockNoteApp).toHaveBeenCalledTimes(1);
    expect(mockDiffTool).toHaveBeenCalledTimes(1);
    expect(mockViewManager).toHaveBeenCalledTimes(1);
  });
  
  test('should expose components on window object for debugging', () => {
    // Import the main module
    require('../src/main.js');
    
    // Simulate the DOMContentLoaded event
    expect(domContentLoadedCallback).not.toBeNull();
    domContentLoadedCallback();
    
    // Verify window properties are set
    expect(window.noteApp).toEqual({ name: 'mockNoteApp' });
    expect(window.diffTool).toEqual({ name: 'mockDiffTool' });
    expect(window.viewManager).toEqual({ name: 'mockViewManager' });
  });
}); 