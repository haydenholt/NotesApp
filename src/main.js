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
import { BackupService } from './core/utils/BackupService.js';
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
    
    // Initialize backup service
    const backupService = new BackupService();
    backupService.initialize();

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
    window.backupService = backupService;
});