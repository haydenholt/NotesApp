import DiffTool from '../../src/components/DiffTool.js';

describe('DiffTool', () => {
  let diffTool;
  let originalTextArea;
  let modifiedTextArea;
  let diffResultElement;
  let clearButton;
  let diffModeSelect;
  
  beforeEach(() => {
    // Set up the DOM elements needed by DiffTool
    document.body.innerHTML = `
      <textarea id="originalText"></textarea>
      <textarea id="modifiedText"></textarea>
      <div id="diffResult"></div>
      <button id="clearDiffButton"></button>
      <select id="diffMode">
        <option value="line">Line Mode</option>
        <option value="word">Word Mode</option>
        <option value="character">Character Mode</option>
        <option value="token">Code Token Mode</option>
      </select>
    `;
    
    // Get references to DOM elements
    originalTextArea = document.getElementById('originalText');
    modifiedTextArea = document.getElementById('modifiedText');
    diffResultElement = document.getElementById('diffResult');
    clearButton = document.getElementById('clearDiffButton');
    diffModeSelect = document.getElementById('diffMode');
    
    // Create a new DiffTool instance
    diffTool = new DiffTool();
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
    
    // Verify that additions are highlighted
    expect(diffResultElement.innerHTML).toContain('new');
  });
  
  test('should highlight deletions in the diff result', () => {
    // Set values with a clear deletion
    originalTextArea.value = 'This is a long test';
    modifiedTextArea.value = 'This is a test';
    
    // Call compare directly
    diffTool.compareTexts();
    
    // Verify that deletions are highlighted
    expect(diffResultElement.innerHTML).toContain('long');
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
  
  // Test for createDiffModeSelect method
  test('should create diffModeSelect if it does not exist', () => {
    // Remove the diffModeSelect element
    document.body.innerHTML = `
      <textarea id="originalText"></textarea>
      <textarea id="modifiedText"></textarea>
      <div id="diffResult"></div>
      <button id="clearDiffButton"></button>
    `;
    
    // Create a new DiffTool instance
    const newDiffTool = new DiffTool();
    
    // Check if diffModeSelect was created
    const createdSelect = document.getElementById('diffMode');
    expect(createdSelect).not.toBeNull();
    expect(createdSelect.options.length).toBe(4);
    expect(createdSelect.options[0].value).toBe('line');
    expect(createdSelect.options[1].value).toBe('word');
    expect(createdSelect.options[2].value).toBe('character');
    expect(createdSelect.options[3].value).toBe('token');
  });
  
  // Test for myersDiff algorithm
  test('should correctly compute diff using myersDiff algorithm', () => {
    const original = ['a', 'b', 'c'];
    const modified = ['a', 'd', 'c'];
    
    const result = diffTool.myersDiff(original, modified);
    
    expect(result.length).toBeGreaterThan(0);
    // Find if there's an operation that indicates b->d change
    const hasChange = result.some(edit => {
      if (edit.operation === 'replace') return true;
      if (edit.operation === 'delete' && original[edit.originalIndex] === 'b') return true;
      if (edit.operation === 'insert' && modified[edit.modifiedIndex] === 'd') return true;
      return false;
    });
    expect(hasChange).toBeTruthy();
  });
  
  // Test for escapeHtml method
  test('should escape HTML special characters', () => {
    const input = '<div>This & that</div>';
    const escaped = diffTool.escapeHtml(input);
    
    expect(escaped).toContain('&lt;div&gt;');
    expect(escaped).toContain('This &amp; that');
    expect(escaped).toContain('&lt;/div&gt;');
  });
  
  // Tests for different diff modes
  test('should generate line diff correctly', () => {
    const result = diffTool.generateLineDiff(
      'line 1\nline 2\nline 3',
      'line 1\nchanged line\nline 3'
    );
    
    expect(result).toContain('line 1');
    expect(result).toContain('line 3');
    // Check for class names that indicate changes
    expect(result).toContain('bg-yellow-100');
    // Look for parts of "changed" split into spans
    expect(result).toContain('bg-green-200');
    expect(result).toContain('bg-red-200');
  });
  
  test('should generate word diff correctly', () => {
    const result = diffTool.generateWordDiff(
      'This is a test',
      'This is another test'
    );
    
    expect(result).toContain('This is');
    expect(result).toContain('test');
    // Check for the "n" which is part of "another"
    expect(result).toContain('<span class="bg-green-200 font-bold">');
    expect(result).toContain('bg-green-200');
  });
  
  test('should generate character diff correctly', () => {
    const result = diffTool.generateCharacterDiff(
      'test',
      'tent'
    );
    
    expect(result).toContain('te');
    // Check for classes that would indicate a difference rather than exact text
    expect(result).toContain('bg-red-200');
    expect(result).toContain('bg-green-200');
  });
  
  test('should generate token diff correctly for code', () => {
    const result = diffTool.generateTokenDiff(
      'function test() { return true; }',
      'function test() { return false; }'
    );
    
    expect(result).toContain('function');
    expect(result).toContain('test');
    expect(result).toContain('return');
    // Look for parts of true/false with highlighting classes
    expect(result).toContain('bg-red-200');
    expect(result).toContain('bg-green-200');
  });
  
  // Test for tokenizeText method
  test('should tokenize text correctly in word mode', () => {
    const text = 'Hello, world!';
    const tokens = diffTool.tokenizeText(text, 'word');
    
    // Check that the tokens array contains parts of the input text
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some(token => token.includes('Hello'))).toBeTruthy();
    expect(tokens.some(token => token.includes('world'))).toBeTruthy();
  });
  
  // Test for tokenizeCode method
  test('should tokenize code correctly', () => {
    const code = 'function test() { return true; }';
    const tokens = diffTool.tokenizeCode(code);
    
    // Check for the existence of tokens
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some(token => token.includes('function'))).toBeTruthy();
    expect(tokens.some(token => token.includes('test'))).toBeTruthy();
    expect(tokens.some(token => token.includes('return'))).toBeTruthy();
    expect(tokens.some(token => token.includes('true'))).toBeTruthy();
  });
  
  // Test for compareWords method
  test('should compare words correctly', () => {
    const originalLine = 'This is a test';
    const modifiedLine = 'This is an example';
    
    const result = diffTool.compareWords(originalLine, modifiedLine);
    
    expect(result.hasAdditions).toBeTruthy();
    expect(result.hasRemovals).toBeTruthy();
    expect(result.html).toContain('This is');
    // Check for highlighting classes which indicate differences
    expect(result.html).toContain('bg-red-200');
    expect(result.html).toContain('bg-green-200');
  });
  
  // Test diffMode select change
  test('should use different diff mode when mode is changed', () => {
    // Directly test the generateDiff method to verify it uses the correct mode
    const generateDiffSpy = jest.spyOn(diffTool, 'generateDiff');
    
    // Set the diff mode to character
    diffModeSelect.value = 'character';
    
    // Set text values
    originalTextArea.value = 'test';
    modifiedTextArea.value = 'test2';
    
    // Call compareTexts 
    diffTool.compareTexts();
    
    // Verify generateDiff was called with the character mode
    expect(generateDiffSpy).toHaveBeenCalledWith('test', 'test2', 'character');
  });
  
  test('should display identical text correctly without differences', () => {
    // Set identical text in both areas
    const testText = 'This is identical text';
    originalTextArea.value = testText;
    modifiedTextArea.value = testText;
    
    // Call compare directly
    diffTool.compareTexts();
    
    // Verify that the result contains the text but no highlighting for additions/deletions
    expect(diffResultElement.innerHTML).toContain(testText);
    expect(diffResultElement.innerHTML).not.toContain('bg-green-200'); // No additions
    expect(diffResultElement.innerHTML).not.toContain('bg-red-200');   // No deletions
  });
}); 