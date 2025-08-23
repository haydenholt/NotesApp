import ViewManager from '../../../src/ui/components/ViewManager.js';
import { PlatformUtils } from '../../../src/core/utils/PlatformUtils.js';

describe('ViewManager', () => {
  let viewManager;
  
  // Setup DOM environment
  beforeEach(() => {
    // Clean up the DOM
    document.body.innerHTML = `
      <div id="notesView"></div>
      <div id="diffView" class="hidden"></div>
      <div id="systemPromptView" class="hidden"></div>
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
    // Mock the keyboard event with proper modifier key
    const modifierKey = PlatformUtils.getModifierKey();
    const event = new KeyboardEvent('keydown', {
      key: 'd',
      [modifierKey]: true,
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
    const modifierKey = PlatformUtils.getModifierKey();
    // First toggle to diff view
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'd',
      [modifierKey]: true,
    }));
    
    // Then toggle back to notes view
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'd',
      [modifierKey]: true,
    }));
    
    // Check if views are toggled correctly
    const notesView = document.getElementById('notesView');
    const diffView = document.getElementById('diffView');
    
    expect(notesView.classList.contains('hidden')).toBe(false);
    expect(diffView.classList.contains('hidden')).toBe(true);
  });
}); 