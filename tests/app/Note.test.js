import Note from '../../src/app/Note.js';

describe('Note class', () => {
  describe('getFormattedText', () => {
    test('formats all sections when all fields are populated', () => {
      const note = Object.create(Note.prototype);
      note.elements = {
        failingIssues: { value: 'Test failing issues' },
        nonFailingIssues: { value: 'Test non-failing issues' },
        discussion: { value: 'Test discussion' }
      };
      expect(note.getFormattedText()).toBe(
        'Failing issues:\nTest failing issues\n\n' +
        'Non-failing issues:\nTest non-failing issues\n\n' +
        'Discussion:\nTest discussion'
      );
    });

    test('omits empty sections', () => {
      const note = Object.create(Note.prototype);
      note.elements = {
        failingIssues: { value: 'Failing only' },
        nonFailingIssues: { value: '' },
        discussion: { value: 'Some discussion' }
      };
      expect(note.getFormattedText()).toBe(
        'Failing issues:\nFailing only\n\n' +
        'Discussion:\nSome discussion'
      );
    });

    test('returns empty string when all sections empty', () => {
      const note = Object.create(Note.prototype);
      note.elements = {
        failingIssues: { value: '' },
        nonFailingIssues: { value: '' },
        discussion: { value: '' }
      };
      expect(note.getFormattedText()).toBe('');
    });
  });

  describe('getFormattedIDs', () => {
    test('formats IDs correctly when populated', () => {
      const note = Object.create(Note.prototype);
      note.elements = {
        projectID: { value: 'PROJ-1' },
        operationID: { value: 'OP-2' },
        attemptID: { value: 'ATT-3' }
      };
      expect(note.getFormattedIDs()).toBe(
        '• Project Name/ID: PROJ-1\n' +
        '• Op ID: OP-2\n' +
        '• Reason: \n' +
        '• Task/Attempt ID(s): ATT-3'
      );
    });

    test('formats IDs with empty values', () => {
      const note = Object.create(Note.prototype);
      note.elements = {
        projectID: { value: '' },
        operationID: { value: '' },
        attemptID: { value: '' }
      };
      expect(note.getFormattedIDs()).toBe(
        '• Project Name/ID: \n' +
        '• Op ID: \n' +
        '• Reason: \n' +
        '• Task/Attempt ID(s): '
      );
    });
  });
}); 