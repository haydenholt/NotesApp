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

This is a vanilla JavaScript web application with a **clean, modular architecture** centered around note-taking with time tracking capabilities. The application follows a clear separation of concerns with business logic, state management, and UI components properly organized.

### Project Structure

```
src/
├── core/              # 🧠 Business Logic & Data
│   ├── NoteApp.js          # Main application orchestrator
│   ├── controllers/        # Business logic controllers
│   ├── data/              # Data repositories and services
│   ├── state/             # State management
│   └── utils/             # Core utilities
├── ui/                # 🎨 User Interface
│   ├── components/         # Reusable UI components
│   └── views/             # Specialized view components
└── main.js            # 🚀 Application entry point
```

### Core Application Structure

**Main Entry Point (`src/main.js`):**
- Initializes all major components: NoteApp, DiffTool, ViewManager, PayAnalysis
- Makes components globally accessible for debugging (window.noteApp, etc.)

**View Management System:**
- `ViewManager` handles switching between different application views via keyboard shortcuts
- Four main views: Notes (default), Diff Tool (Ctrl+D), System Prompt Generator (Ctrl+P), Pay Analysis (Ctrl+Y)
- Views are hidden/shown using CSS classes, not routing

### Business Logic Layer (`src/core/`)

**Main Controller (`src/core/NoteApp.js`):**
- Orchestrates all business logic controllers and views
- Event-driven architecture with clean separation of concerns

**Controllers (`src/core/controllers/`):**
- `NoteController.js` - Note CRUD operations and business logic
- `TimerController.js` - Timer management across notes and off-platform
- `SearchController.js` - Search functionality and result management
- `StatisticsController.js` - Analytics, fail rates, and data aggregation

**Data Layer (`src/core/data/`):**
- `NotesRepository.js` - localStorage abstraction for notes
- `TimerRepository.js` - localStorage abstraction for timers
- `ExportService.js` - CSV export and data transformation

**State Management (`src/core/state/`):**
- `AppState.js` - Application-level state (current date, search mode)
- `NotesState.js` - In-memory note state management
- `TimerState.js` - Timer state with live updates

**Utilities (`src/core/utils/`):**
- `TimeFormatter.js` - Time formatting and duration calculations
- `DateUtils.js` - Date manipulation and validation
- `DOMHelpers.js` - DOM utilities and common operations

### User Interface Layer (`src/ui/`)

**Components (`src/ui/components/`):**
- `Note.js` - Individual note component with auto-theming
- `Timer.js` - Individual note timers that start when content is entered
- `OffPlatformTimer.js` - Tracks time for training, sheetwork, blocked time
- `ThemeManager.js` - Centralized theme management
- `DiffTool.js` - Text comparison with token-based diff highlighting
- `PayAnalysis.js` - Weekly earnings calculator with calendar interface
- `SystemPromptView.js` - LLM prompt generators
- `ViewManager.js` - View switching logic
- `HelpOverlay.js` - Help system
- `NavigationManager.js` - Keyboard navigation

**Views (`src/ui/views/`):**
- `NoteListView.js` - Daily note list rendering and interaction
- `SearchResultsView.js` - Search results display
- `StatisticsView.js` - Stats panels and project fail rates
- `DateNavigationView.js` - Date picker and navigation buttons
- `OffPlatformView.js` - Off-platform timer cards and sticky display
- `ModalView.js` - Generic modal dialog system

### Data Persistence

- **localStorage** is the primary data store
- Notes are stored per date with keys like `notes_2024-01-15`
- Timer states stored separately with date-specific keys
- No backend or database - fully client-side application

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

## Theme Management

**ThemeManager** (`src/ui/components/ThemeManager.js`) provides centralized theming with light/dark modes.

### Key Rules
- **Always** use ThemeManager methods for colors: `this.themeManager.getPrimaryButtonClasses()`
- **Never** hardcode color classes: ~~`bg-blue-500`~~, ~~`text-gray-600`~~
- Components accept `themeManager` in constructor and provide fallbacks when null
- **Auto-theming**: All UI components automatically update when theme changes via event listeners

### Common Methods
- Buttons: `getPrimaryButtonClasses()`, `getSecondaryButtonClasses()`
- Forms: `getInputClasses()`, `getTextareaClasses()`, `getSelectClasses()`
- Layout: `getCardClasses()`, `getTableClasses()`, `getStatusClasses(status)`
- Utilities: `combineClasses()`, `getColor(category, key)`

### Integration Pattern
```javascript
constructor(containerId, themeManager = null) {
    this.themeManager = themeManager;
    // Use: this.themeManager?.getPrimaryButtonClasses() || 'fallback-classes'
    
    // For auto-theming components, add theme change listener:
    document.addEventListener('themeChanged', () => {
        this.updateTheme();
    });
}
```

### Event-Driven Theme Updates
- All components listen for `themeChanged` events
- Views automatically re-render with new theme
- Individual notes update styling without page reload
- Scroll position preserved during theme changes

## Refactored Architecture Benefits

### Clean Separation of Concerns
- **Business Logic** (`src/core/`) - Pure JavaScript logic, no DOM dependencies
- **User Interface** (`src/ui/`) - All DOM manipulation and styling
- **Testable**: Controllers can be unit tested without DOM setup
- **Maintainable**: Changes isolated to specific domains

### Event-Driven Communication
- Controllers communicate via events, not direct method calls
- Views listen for data changes and re-render automatically
- Loose coupling between components allows easy extension

### Modular Design
- Each component has a single responsibility
- Easy to add new controllers, views, or features
- Clear dependency graph makes debugging simpler

### Performance Optimizations
- Notes only update theme elements that changed
- Views clear properly to prevent memory leaks
- Event listeners are cleaned up when components are destroyed

## File Location Guide

### When Adding New Features

**Business Logic Changes:**
- Controllers: `src/core/controllers/`
- Data access: `src/core/data/`
- State management: `src/core/state/`
- Utilities: `src/core/utils/`

**UI Changes:**
- Reusable components: `src/ui/components/`
- Specialized displays: `src/ui/views/`
- Theme-related: Use ThemeManager methods

**Testing:**
- Tests mirror the src structure in `tests/`
- Update test imports to match new file locations

### Common File Paths
- Main app controller: `src/core/NoteApp.js`
- Note management: `src/core/controllers/NoteController.js`
- Individual notes: `src/ui/components/Note.js`
- Theme system: `src/ui/components/ThemeManager.js`
- Time utilities: `src/core/utils/TimeFormatter.js`