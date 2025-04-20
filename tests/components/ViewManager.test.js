import ViewManager from '../../src/components/ViewManager.js';

describe('ViewManager', () => {
  let viewManager;
  
  // Setup DOM environment
  beforeEach(() => {
    // Clean up the DOM
    document.body.innerHTML = `
      <div id="notesView"></div>
      <div id="diffView" class="hidden"></div>
    `;
    
    // Create a new ViewManager instance
    viewManager = new ViewManager();
  });
  
  test('should initialize with notes view visible', () => {
    const notesView = document.getElementById('notesView');
    const diffView = document.getElementById('diffView');
    
    expect(notesView.classList.contains('hidden')).toBe(false);
    expect(diffView.classList.contains('hidden')).toBe(true);
  });
  
  test('should toggle to diff view', () => {
    // Mock the keyboard event
    const event = new KeyboardEvent('keydown', {
      key: 'd',
      ctrlKey: true,
    });
    
    // Dispatch the event
    document.dispatchEvent(event);
    
    // Check if views are toggled correctly
    const notesView = document.getElementById('notesView');
    const diffView = document.getElementById('diffView');
    
    expect(notesView.classList.contains('hidden')).toBe(true);
    expect(diffView.classList.contains('hidden')).toBe(false);
  });
  
  test('should toggle back to notes view', () => {
    // First toggle to diff view
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'd',
      ctrlKey: true,
    }));
    
    // Then toggle back to notes view
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'd',
      ctrlKey: true,
    }));
    
    // Check if views are toggled correctly
    const notesView = document.getElementById('notesView');
    const diffView = document.getElementById('diffView');
    
    expect(notesView.classList.contains('hidden')).toBe(false);
    expect(diffView.classList.contains('hidden')).toBe(true);
  });
}); 