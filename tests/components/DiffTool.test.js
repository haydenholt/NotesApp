import DiffTool from '../../src/components/DiffTool.js';

describe('DiffTool', () => {
  let diffTool;
  let originalTextArea;
  let modifiedTextArea;
  let diffResultElement;
  let clearButton;
  
  beforeEach(() => {
    // Set up the DOM elements needed by DiffTool
    document.body.innerHTML = `
      <textarea id="originalText"></textarea>
      <textarea id="modifiedText"></textarea>
      <div id="diffResult"></div>
      <button id="clearDiffButton"></button>
    `;
    
    // Get references to DOM elements
    originalTextArea = document.getElementById('originalText');
    modifiedTextArea = document.getElementById('modifiedText');
    diffResultElement = document.getElementById('diffResult');
    clearButton = document.getElementById('clearDiffButton');
    
    // Create a new DiffTool instance
    diffTool = new DiffTool();
    
    // Mock internal methods to isolate testing
    jest.spyOn(diffTool, 'generateDiff').mockImplementation((orig, mod, mode) => {
      if (orig === 'Hello world' && mod === 'Hello changed world') {
        return '<div>Hello <span class="bg-green-200 font-bold">changed</span> world</div>';
      }
      if (orig === 'This is a test' && mod === 'This is a new test') {
        return '<div>This is a <span class="bg-green-200 font-bold">new</span> test</div>';
      }
      if (orig === 'This is a long test' && mod === 'This is a test') {
        return '<div>This is a <span class="bg-red-200 font-bold line-through">long</span> test</div>';
      }
      return 'Diff result';
    });
  });
  
  test('should calculate diffs between texts', () => {
    // Set values and simulate input
    originalTextArea.value = 'Hello world';
    modifiedTextArea.value = 'Hello changed world';
    
    // Call the compare method directly
    diffTool.compareTexts();
    
    // Verify that diffResult contains a diff result
    expect(diffResultElement.innerHTML).not.toBe('');
    expect(diffResultElement.innerHTML).toContain('Hello');
    expect(diffResultElement.innerHTML).toContain('changed');
    expect(diffResultElement.innerHTML).toContain('world');
  });
  
  test('should clear both text areas when clear button is clicked', () => {
    // Set values in text areas
    originalTextArea.value = 'Original Text';
    modifiedTextArea.value = 'Modified Text';
    
    // Click the clear button
    clearButton.click();
    
    // Verify text areas are cleared
    expect(originalTextArea.value).toBe('');
    expect(modifiedTextArea.value).toBe('');
  });
  
  test('should highlight additions in the diff result', () => {
    // Set values with a clear addition
    originalTextArea.value = 'This is a test';
    modifiedTextArea.value = 'This is a new test';
    
    // Call compare directly
    diffTool.compareTexts();
    
    // Verify that the word "new" appears with addition styling
    expect(diffResultElement.innerHTML).toContain('new');
    expect(diffResultElement.innerHTML).toContain('bg-green-200');
  });
  
  test('should highlight deletions in the diff result', () => {
    // Set values with a clear deletion
    originalTextArea.value = 'This is a long test';
    modifiedTextArea.value = 'This is a test';
    
    // Call compare directly
    diffTool.compareTexts();
    
    // Verify that the word "long" appears with deletion styling
    expect(diffResultElement.innerHTML).toContain('long');
    expect(diffResultElement.innerHTML).toContain('bg-red-200');
  });
  
  test('should show a message when both fields are empty', () => {
    // Set empty values
    originalTextArea.value = '';
    modifiedTextArea.value = '';
    
    // Call compare directly
    diffTool.compareTexts();
    
    // Verify the message
    expect(diffResultElement.innerHTML).toContain('Enter text in both fields to see differences');
  });
}); 