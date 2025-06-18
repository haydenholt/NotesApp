/**
 * Main entry point for the Timer Notes application
 */
import NoteApp from './app/NoteApp.js';
import DiffTool from './components/DiffTool.js';
import ViewManager from './components/ViewManager.js';
import PayAnalysis from './app/PayAnalysis.js';
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app components
    const app = new NoteApp();
    const diffTool = new DiffTool();
    const viewManager = new ViewManager();
    const payAnalysis = new PayAnalysis();

    // Make components accessible for debugging if needed
    window.noteApp = app;
    window.diffTool = diffTool;
    window.viewManager = viewManager;
    window.payAnalysis = payAnalysis;
});