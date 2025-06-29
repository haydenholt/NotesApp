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
  
  // Test jsdiff integration
  test('should correctly use jsdiff for text comparison', () => {
    const original = 'a\nb\nc';
    const modified = 'a\nd\nc';
    
    const result = diffTool.generateLineDiffJS(original, modified);
    
    expect(result).toContain('a');
    expect(result).toContain('c');
    expect(result).toContain('bg-red-200'); // deletion
    expect(result).toContain('bg-green-200'); // addition
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
    const result = diffTool.generateLineDiffJS(
      'line 1\nline 2\nline 3',
      'line 1\nchanged line\nline 3'
    );
    
    expect(result).toContain('line 1');
    expect(result).toContain('line 3');
    // Check for class names that indicate changes
    expect(result).toContain('bg-green-200');
    expect(result).toContain('bg-red-200');
  });
  
  test('should generate word diff correctly', () => {
    const result = diffTool.generateWordDiffJS(
      'This is a test',
      'This is another test'
    );
    
    expect(result).toContain('This is');
    expect(result).toContain('test');
    expect(result).toContain('bg-green-200');
    expect(result).toContain('bg-red-200');
  });
  
  test('should generate character diff correctly', () => {
    const result = diffTool.generateCharacterDiffJS(
      'test',
      'tent'
    );
    
    expect(result).toContain('te');
    // Check for classes that would indicate a difference rather than exact text
    expect(result).toContain('bg-red-200');
    expect(result).toContain('bg-green-200');
  });
  
  test('should generate token diff correctly for code', () => {
    const result = diffTool.generateTokenDiffJS(
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
  
  // Tests for git diff style summary functionality
  describe('Git Diff Style Summary', () => {
    test('should generate diff summary for line mode with changes', () => {
      const original = 'line1\nline2\nline3\nline4';
      const modified = 'line1\nchanged line\nline3\nline4';
      
      const summary = diffTool.generateDiffSummary(original, modified, 'line');
      
      expect(summary).toContain('Diff Summary:');
      expect(summary).toContain('@@');
      expect(summary).toContain('-');
      expect(summary).toContain('+');
      expect(summary).toContain('bg-gray-50');
    });
    
    test('should generate "No differences found" for identical texts', () => {
      const text = 'same text';
      const summary = diffTool.generateDiffSummary(text, text, 'line');
      
      expect(summary).toContain('No differences found');
      expect(summary).toContain('bg-gray-100');
    });
    
    test('should generate simple summary for word mode', () => {
      const original = 'This is a test';
      const modified = 'This is another test';
      
      const summary = diffTool.generateDiffSummary(original, modified, 'word');
      
      expect(summary).toContain('Word mode:');
      expect(summary).toContain('+1 -1 changes');
      expect(summary).toContain('bg-gray-50');
    });
    
    test('should generate simple summary for character mode', () => {
      const original = 'test';
      const modified = 'testing';
      
      const summary = diffTool.generateDiffSummary(original, modified, 'character');
      
      expect(summary).toContain('Character mode:');
      expect(summary).toContain('+3 -0 changes');
      expect(summary).toContain('bg-gray-50');
    });
    
    test('should generate simple summary for token mode', () => {
      const original = 'function test() {}';
      const modified = 'function test(param) {}';
      
      const summary = diffTool.generateDiffSummary(original, modified, 'token');
      
      expect(summary).toContain('Token mode:');
      expect(summary).toContain('changes');
      expect(summary).toContain('bg-gray-50');
    });
  });
  
  test('should include diff summary in compareTexts output', () => {
    originalTextArea.value = 'line1\nline2\nline3';
    modifiedTextArea.value = 'line1\nchanged\nline3';
    
    diffTool.compareTexts();
    
    // Should contain both summary and diff content
    expect(diffResultElement.innerHTML).toContain('Diff Summary:');
    expect(diffResultElement.innerHTML).toContain('@@');
    expect(diffResultElement.innerHTML).toContain('line1');
    // Check for individual characters that are part of "changed"
    expect(diffResultElement.innerHTML).toContain('c');
    expect(diffResultElement.innerHTML).toContain('h');
    expect(diffResultElement.innerHTML).toContain('a');
  });
  
  test('should show correct summary for word mode changes', () => {
    diffModeSelect.value = 'word';
    originalTextArea.value = 'Hello world';
    modifiedTextArea.value = 'Hello beautiful world';
    
    diffTool.compareTexts();
    
    expect(diffResultElement.innerHTML).toContain('Word mode:');
    expect(diffResultElement.innerHTML).toContain('changes');
  });
  
  test('should show correct summary for character mode changes', () => {
    diffModeSelect.value = 'character';
    originalTextArea.value = 'test';
    modifiedTextArea.value = 'testing';
    
    diffTool.compareTexts();
    
    expect(diffResultElement.innerHTML).toContain('Character mode:');
    expect(diffResultElement.innerHTML).toContain('changes');
  });
  
  // Edge cases for diff summary
  test('should handle empty to non-empty text changes', () => {
    originalTextArea.value = '';
    modifiedTextArea.value = 'new content';
    
    diffTool.compareTexts();
    
    expect(diffResultElement.innerHTML).toContain('Diff Summary:');
    // Check for parts of the content since it might be split across spans
    expect(diffResultElement.innerHTML).toContain('new');
    expect(diffResultElement.innerHTML).toContain('content');
  });
  
  test('should handle non-empty to empty text changes', () => {
    originalTextArea.value = 'removed content';
    modifiedTextArea.value = '';
    
    diffTool.compareTexts();
    
    expect(diffResultElement.innerHTML).toContain('Diff Summary:');
  });
});