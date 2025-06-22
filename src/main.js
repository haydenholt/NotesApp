/**
 * Main entry point for the Timer Notes application
 */
import NoteApp from './app/NoteApp.js';
import DiffTool from './components/DiffTool.js';
import ViewManager from './components/ViewManager.js';
import NavigationManager from './components/NavigationManager.js';
import PayAnalysis from './app/PayAnalysis.js';
import HelpOverlay from './components/HelpOverlay.js';
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app components
    const app = new NoteApp();
    const diffTool = new DiffTool();
    const viewManager = new ViewManager();
    const navigationManager = new NavigationManager(viewManager);
    const payAnalysis = new PayAnalysis();
    const helpOverlay = new HelpOverlay();

    // Make components accessible for debugging if needed
    window.noteApp = app;
    window.diffTool = diffTool;
    window.viewManager = viewManager;
    window.navigationManager = navigationManager;
    window.payAnalysis = payAnalysis;
    window.helpOverlay = helpOverlay;
});