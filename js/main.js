/**
 * Main entry point for the Timer Notes application
 */
import NoteApp from './NoteApp.js';
import DiffTool from './DiffTool.js';
import ViewManager from './ViewManager.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app components
    const app = new NoteApp();
    const diffTool = new DiffTool();
    const viewManager = new ViewManager();

    // Make components accessible for debugging if needed
    window.noteApp = app;
    window.diffTool = diffTool;
    window.viewManager = viewManager;
});