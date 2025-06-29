/**
 * Main entry point for the Timer Notes application
 */
import NoteApp from './app/NoteApp.js';
import DiffTool from './components/DiffTool.js';
import ViewManager from './components/ViewManager.js';
import NavigationManager from './components/NavigationManager.js';
import PayAnalysis from './app/PayAnalysis.js';
import HelpOverlay from './components/HelpOverlay.js';
import ThemeManager from './components/ThemeManager.js';
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager first
    const themeManager = new ThemeManager();
    
    // Initialize app components
    const app = new NoteApp(themeManager);
    const diffTool = new DiffTool(themeManager);
    const viewManager = new ViewManager(themeManager);
    const navigationManager = new NavigationManager(viewManager);
    const payAnalysis = new PayAnalysis(themeManager);
    const helpOverlay = new HelpOverlay(themeManager);

    // Set up theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            themeManager.toggleTheme();
            updateThemeToggleIcon();
        });
    }
    
    // Update theme toggle icon based on current theme
    function updateThemeToggleIcon() {
        if (themeToggle) {
            themeToggle.textContent = themeManager.currentTheme === 'dark' ? '☀️' : '🌙';
            themeToggle.title = themeManager.currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        }
    }
    
    // Initial icon update
    updateThemeToggleIcon();
    
    // Listen for theme changes to update icon
    document.addEventListener('themeChanged', updateThemeToggleIcon);

    // Make components accessible for debugging if needed
    window.themeManager = themeManager;
    window.noteApp = app;
    window.diffTool = diffTool;
    window.viewManager = viewManager;
    window.navigationManager = navigationManager;
    window.payAnalysis = payAnalysis;
    window.helpOverlay = helpOverlay;
});