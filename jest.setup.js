import { TextEncoder, TextDecoder } from 'util';

// Add polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock the global Diff object for tests
global.Diff = {
  diffLines: jest.fn((original, modified) => {
    // Simple mock implementation for testing
    if (original === modified) {
      return [{ value: original }];
    }
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const changes = [];
    
    for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
      if (i >= originalLines.length) {
        changes.push({ added: true, value: modifiedLines[i] + '\n', count: 1 });
      } else if (i >= modifiedLines.length) {
        changes.push({ removed: true, value: originalLines[i] + '\n', count: 1 });
      } else if (originalLines[i] !== modifiedLines[i]) {
        changes.push({ removed: true, value: originalLines[i] + '\n', count: 1 });
        changes.push({ added: true, value: modifiedLines[i] + '\n', count: 1 });
      } else {
        changes.push({ value: originalLines[i] + '\n', count: 1 });
      }
    }
    return changes;
  }),
  
  diffWords: jest.fn((original, modified) => {
    if (original === modified) {
      return [{ value: original }];
    }
    const originalWords = original.split(/(\s+)/);
    const modifiedWords = modified.split(/(\s+)/);
    const changes = [];
    
    for (let i = 0; i < Math.max(originalWords.length, modifiedWords.length); i++) {
      if (i >= originalWords.length) {
        changes.push({ added: true, value: modifiedWords[i], count: 1 });
      } else if (i >= modifiedWords.length) {
        changes.push({ removed: true, value: originalWords[i], count: 1 });
      } else if (originalWords[i] !== modifiedWords[i]) {
        changes.push({ removed: true, value: originalWords[i], count: 1 });
        changes.push({ added: true, value: modifiedWords[i], count: 1 });
      } else {
        changes.push({ value: originalWords[i], count: 1 });
      }
    }
    return changes;
  }),
  
  diffChars: jest.fn((original, modified) => {
    if (original === modified) {
      return [{ value: original }];
    }
    const changes = [];
    const maxLength = Math.max(original.length, modified.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i >= original.length) {
        changes.push({ added: true, value: modified[i], count: 1 });
      } else if (i >= modified.length) {
        changes.push({ removed: true, value: original[i], count: 1 });
      } else if (original[i] !== modified[i]) {
        changes.push({ removed: true, value: original[i], count: 1 });
        changes.push({ added: true, value: modified[i], count: 1 });
      } else {
        changes.push({ value: original[i], count: 1 });
      }
    }
    return changes;
  }),
  
  diffWordsWithSpace: jest.fn((original, modified) => {
    // Use the same logic as diffWords for simplicity
    return global.Diff.diffWords(original, modified);
  })
};