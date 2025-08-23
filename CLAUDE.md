# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**QC Notes** is a Progressive Web App (PWA) for secure note-taking with time tracking capabilities.

- **PWA Features:** Installable, works offline, persistent storage, service worker caching
- **Production Deployment:** Hosted on Vercel for end users
- **Data Persistence:** Uses browser persistent storage API + PWA for maximum data retention

## Development Commands

**Testing:**
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

**Local Development:**
- `npm start:claude` - Start local server at http://localhost:8002
- No build or compilation needed - vanilla JavaScript application

**Security:**
- Application uses AES-GCM 256-bit encryption via Web Crypto API
- All localStorage data is transparently encrypted/decrypted via SecureStorage

## Architecture Overview

This is a vanilla JavaScript web application with a **clean, modular architecture** centered around note-taking with time tracking capabilities. The application follows a clear separation of concerns with business logic, state management, and UI components properly organized.

### Project Structure

```
src/
├── core/              # 🧠 Business Logic & Data
│   ├── NoteApp.js          # Main application orchestrator
│   ├── controllers/        # Business logic controllers
│   ├── data/              # Data repositories and services
│   │   ├── SecureStorage.js      # Encrypted localStorage wrapper
│   │   ├── NotesRepository.js    # Notes data access
│   │   ├── TimerRepository.js    # Timer data access (legacy)
│   │   ├── TimerEntryRepository.js # Timer entries (new format)
│   │   ├── CustomTemplateManager.js # System prompt templates
│   │   ├── ImportExportService.js # Import/export functionality
│   │   └── ExportService.js      # CSV export service
│   ├── state/             # State management
│   └── utils/             # Core utilities
│       └── SecurityUtils.js      # Security & sanitization
├── ui/                # 🎨 User Interface
│   ├── components/         # Reusable UI components
│   │   ├── OffPlatformEntry.js   # Individual timer entry
│   │   └── OffPlatformEntryList.js # Timer entry management
│   └── views/             # Specialized view components
└── main.js            # 🚀 Application entry point
```

### Core Application Structure

**Main Entry Point (`src/main.js`):**
- **IMPORTANT**: Initializes SecureStorage first (required for all data operations)
- Initializes all major components: NoteApp, DiffTool, ViewManager, NavigationManager, PayAnalysis, HelpOverlay
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
- `SecureStorage.js` - **NEW**: Encrypted localStorage wrapper with AES-GCM 256-bit encryption
- `NotesRepository.js` - Notes data access (now uses SecureStorage)
- `TimerRepository.js` - Legacy timer data access
- `TimerEntryRepository.js` - **NEW**: Entry-based timer system with migration from legacy format
- `CustomTemplateManager.js` - **NEW**: Manages system prompt templates with versioning
- `ImportExportService.js` - **NEW**: Manual import/export with encryption support
- `ExportService.js` - CSV export and data transformation

**State Management (`src/core/state/`):**
- `AppState.js` - Application-level state (current date, search mode)
- `NotesState.js` - In-memory note state management
- `TimerState.js` - Timer state with live updates

**Utilities (`src/core/utils/`):**
- `TimeFormatter.js` - Time formatting and duration calculations
- `DateUtils.js` - Date manipulation and validation
- `DOMHelpers.js` - DOM utilities and common operations
- `SecurityUtils.js` - **NEW**: Data sanitization and security utilities

### User Interface Layer (`src/ui/`)

**Components (`src/ui/components/`):**
- `Note.js` - Individual note component with auto-theming
- `Timer.js` - Individual note timers that start when content is entered
- `OffPlatformTimer.js` - Off-platform timer management (uses new entry system)
- `OffPlatformEntry.js` - **NEW**: Individual timer entry component
- `OffPlatformEntryList.js` - **NEW**: Manages list of timer entries
- `ThemeManager.js` - Centralized theme management
- `DiffTool.js` - Text comparison with token-based diff highlighting
- `PayAnalysis.js` - Weekly earnings calculator with calendar interface
- `SystemPromptView.js` - LLM prompt generators with custom templates
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

- **SecureStorage** wraps localStorage with transparent AES-GCM 256-bit encryption
- All data is encrypted at rest with keys stored in localStorage
- Notes are stored per date with keys like `2024-01-15`
- Off-platform timer entries stored with keys like `offPlatform_entries_2024-01-15` (new format)
- Legacy timer format `offPlatform_2024-01-15` automatically migrated to entry format
- No backend or database - fully client-side application

#### Official localStorage Format

**Note Storage:**
```javascript
// Key: "2025-01-01" (ISO date format)
{
  "1": {                              // Note ID (sequential numbers)
    "discussion": "Note content text",
    "startTimestamp": 1740514138715,   // Unix timestamp in milliseconds
    "endTimestamp": 1740514141826,
    "completed": true,                 // Boolean completion status
    "projectID": "optional_project",   // Optional project identifier
    "attemptID": "optional_attempt",   // Optional attempt identifier  
    "operationID": "optional_op",      // Optional operation identifier
    "additionalTime": 0,               // Additional time in seconds
    "hasStarted": true,                // Boolean if note has been started
    "canceled": false,                 // Boolean cancellation status
    "failingIssues": "text",          // Optional failing issues
    "nonFailingIssues": "text",       // Optional non-failing issues
    "seconds": 226                     // Duration in seconds (legacy field)
  }
}
```

**Off-Platform Timer Storage (New Entry Format):**
```javascript
// Key: "offPlatform_entries_2025-01-01" (offPlatform_entries_ + ISO date)
[
  {
    "id": "unique_id_string",        // Unique identifier for entry
    "title": "Entry title",           // User-defined title
    "type": "training",               // Type: training, sheetwork, blocked, other
    "startTime": 1740514138715,       // Unix timestamp when started
    "endTime": 1740514141826,         // Unix timestamp when ended (null if running)
    "totalSeconds": 226,              // Total accumulated seconds
    "isRunning": false                // Current running state
  }
]

// Legacy format (auto-migrated): "offPlatform_2025-01-01"
// Active timers tracked in: "offPlatform_activeTimers"
```

**Theme Storage:**
```javascript
// Key: "app_theme"
// Value: "light" | "dark"
```

**System Prompt Templates:**
```javascript
// Key: "systemPromptTemplates"
{
  "templates": [
    {
      "id": "unique_id",
      "name": "Template Name",
      "content": "Template content...",
      "variables": ["var1", "var2"],
      "isDefault": false,
      "category": "custom"
    }
  ]
}
// Version tracked in: "systemPromptTemplatesVersion"
```

**Encryption Keys:**
```javascript
// Key: "_secure_storage_key" - Exported CryptoKey for AES-GCM
// Key: "_secure_storage_salt" - Salt for key derivation
// Encrypted data prefix: "_encrypted_" + original key
```

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