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