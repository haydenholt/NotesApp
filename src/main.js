/**
 * Main entry point for the Timer Notes application
 */
import NoteApp from './core/NoteApp.js';
import DiffTool from './ui/components/DiffTool.js';
import ViewManager from './ui/components/ViewManager.js';
import NavigationManager from './ui/components/NavigationManager.js';
import PayAnalysis from './ui/components/PayAnalysis.js';
import HelpOverlay from './ui/components/HelpOverlay.js';
import ThemeManager from './ui/components/ThemeManager.js';
import { SecureStorage } from './core/data/SecureStorage.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize secure storage first
    try {
        await SecureStorage.initialize();
        console.log('SecureStorage initialized successfully');
    } catch (error) {
        console.error('Failed to initialize SecureStorage:', error);
        alert('Failed to initialize secure storage. The application may not work correctly.');
        return;
    }
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