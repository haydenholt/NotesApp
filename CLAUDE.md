# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Testing:**
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

**Local Development:**
- `python3 -m http.server 8001` - Start local server at http://localhost:8001
- No build or compilation needed - vanilla JavaScript application

## Architecture Overview

This is a vanilla JavaScript web application with a modular component-based architecture centered around note-taking with time tracking capabilities.

### Core Application Structure

**Main Entry Point (`src/main.js`):**
- Initializes all major components: NoteApp, DiffTool, ViewManager, PayAnalysis
- Makes components globally accessible for debugging (window.noteApp, etc.)

**View Management System:**
- `ViewManager` handles switching between different application views via keyboard shortcuts
- Four main views: Notes (default), Diff Tool (Ctrl+D), System Prompt Generator (Ctrl+P), Pay Analysis (Ctrl+Y)
- Views are hidden/shown using CSS classes, not routing

**Core Components:**

1. **NoteApp** (`src/app/NoteApp.js`):
   - Main note-taking interface with time tracking
   - Manages notes per date with localStorage persistence
   - Integrates Timer and OffPlatformTimer components
   - Handles search functionality and date filtering

2. **Timer/Time Tracking System**:
   - `Timer.js` - Individual note timers that start when content is entered
   - `OffPlatformTimer.js` - Tracks time for training, sheetwork, blocked time
   - Date-specific timer state management

3. **PayAnalysis** (`src/app/PayAnalysis.js`):
   - Weekly earnings calculator with calendar interface
   - Aggregates both on-platform (notes) and off-platform time
   - Fixed rate of $60/hour

4. **DiffTool** (`src/components/DiffTool.js`):
   - Text comparison with token-based diff highlighting
   - Debounced auto-comparison on text changes
   - Multiple diff modes for different comparison granularities

5. **SystemPromptView** (`src/components/SystemPromptView.js`):
   - LLM prompt generators for code setup and prompt/response evaluation
   - Template-based prompt generation with clipboard integration

### Data Persistence

- **localStorage** is the primary data store
- Notes are stored per date with keys like `notes_2024-01-15`
- Timer states stored separately with date-specific keys
- No backend or database - fully client-side application

### Key Features & Integrations

- **Keyboard Shortcuts**: Extensive keyboard controls (Ctrl+Enter, Ctrl+X, F1, etc.)
- **Writing Tool Integration**: Designed to work with Quillbot and Grammarly browser extensions
- **Progressive Web App**: Can be installed as standalone app via Edge "Install as app" feature

### Testing Structure

- Jest with jsdom environment for DOM testing
- Tests mirror src structure in `tests/` directory
- `@testing-library/dom` for DOM interaction testing
- Coverage target: 80%+ line coverage

### Important Implementation Notes

- All components use ES6 class syntax with constructor-based initialization
- DOM manipulation using vanilla JavaScript (no frameworks)
- Event-driven architecture with extensive keyboard shortcut handling
- Date handling uses 'sv-SE' locale format (YYYY-MM-DD)
- Timer display follows you as you scroll (sticky positioning)

## Theme Management System

This application uses a centralized theme management system for consistent styling and easy theme switching.

### Architecture

**ThemeManager** (`src/components/ThemeManager.js`) is the single source of truth for all application colors and styling. It provides:
- Light and dark theme definitions
- Semantic color methods for consistent UI elements
- CSS custom property management
- Theme persistence in localStorage

### Theming Best Practices

**✅ DO - Use ThemeManager Methods:**
```javascript
// Constructor should accept themeManager
constructor(containerId, themeManager) {
    this.themeManager = themeManager;
}

// Use semantic methods for styling
button.className = this.themeManager.getPrimaryButtonClasses();
input.className = this.themeManager.getInputClasses();
textarea.className = this.themeManager.getTextareaClasses('code');

// For complex styling, combine with utility classes
const classes = this.themeManager.combineClasses(
    'w-full h-64 mb-4', // Layout/utility classes
    this.themeManager.getTextareaClasses() // Theme-aware classes
);

// Get individual color properties when needed
const borderColor = this.themeManager.getColor('border', 'primary');
const focusClasses = this.themeManager.getFocusClasses().combined;
```

**❌ DON'T - Use Hardcoded Color Classes:**
```javascript
// Never use hardcoded color classes
button.className = 'bg-blue-500 hover:bg-blue-600 text-white';
input.className = 'focus:ring-blue-500 border-gray-300';
div.className = 'text-gray-700 bg-gray-100';
```

### Available ThemeManager Methods

**Button Styling:**
- `getPrimaryButtonClasses(size)` - Primary action buttons
- `getSecondaryButtonClasses(size)` - Secondary buttons  
- `getButtonClasses(type, size)` - Generic button method

**Form Elements:**
- `getInputClasses(variant)` - Text inputs
- `getTextareaClasses(variant)` - Textareas with variants (default, large, code)
- `getSelectClasses()` - Select dropdowns
- `getFocusClasses()` - Focus states (ring, border, combined)

**Layout Components:**
- `getCardClasses(variant)` - Cards and containers
- `getStatCardClasses(accentColor)` - Statistics cards with accent borders
- `getTableClasses()` - Table styling
- `getCalendarClasses()` - Calendar components
- `getProgressBarClasses()` - Progress indicators

**Navigation & Status:**
- `getNavButtonClasses(isActive)` - Navigation buttons
- `getStatusClasses(status)` - Status indicators (info, success, warning, error)
- `getDiffClasses()` - Code diff highlighting

**Utility Methods:**
- `getColor(category, colorKey)` - Individual color properties
- `getColors(category)` - Color category objects
- `combineClasses(...classes)` - Safely combine class strings

### Theme Integration Pattern

**Component Structure:**
```javascript
export class MyComponent {
    constructor(containerId, themeManager = null) {
        this.themeManager = themeManager;
        this.container = document.getElementById(containerId);
        this.render();
    }
    
    render() {
        // Get theme classes upfront for template literals
        const buttonClasses = this.themeManager?.getPrimaryButtonClasses() || 'bg-gray-600 hover:bg-gray-700';
        const inputClasses = this.themeManager?.getInputClasses() || 'border-gray-300';
        
        this.container.innerHTML = `
            <button class="${buttonClasses}">Save</button>
            <input class="${inputClasses}" type="text">
        `;
    }
}
```

**Initialization in main.js:**
```javascript
const themeManager = new ThemeManager();
const myComponent = new MyComponent('containerId', themeManager);
```

### CSS Custom Properties

For HTML elements, theme-aware CSS custom properties are available:
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border-primary`, `--border-focus`
- `--btn-primary-bg`, `--btn-primary-text`

### Theme Switching

Theme changes automatically propagate to all components through:
1. CSS custom property updates
2. ThemeManager event dispatch (`themeChanged`)
3. Components re-render or update styling as needed

### Adding New Themed Components

1. Accept `themeManager` in constructor
2. Use semantic ThemeManager methods for all styling
3. Provide fallback classes for when themeManager is null
4. Never use hardcoded color classes like `bg-blue-500` or `text-gray-600`
5. Test both light and dark themes

This architecture ensures theme changes only require updating ThemeManager configuration, and all components automatically inherit new styling.