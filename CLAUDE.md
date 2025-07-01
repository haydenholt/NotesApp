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

## Theme Management

**ThemeManager** (`src/components/ThemeManager.js`) provides centralized theming with light/dark modes.

### Key Rules
- **Always** use ThemeManager methods for colors: `this.themeManager.getPrimaryButtonClasses()`
- **Never** hardcode color classes: ~~`bg-blue-500`~~, ~~`text-gray-600`~~
- Components accept `themeManager` in constructor and provide fallbacks when null

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
}
```

# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini --model gemini-2.5-flash -p ` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini --model gemini-2.5-flash -p  "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini --model gemini-2.5-flash -p  "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini --model gemini-2.5-flash -p  "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini --model gemini-2.5-flash -p  "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini --model gemini-2.5-flash -p  "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini --model gemini-2.5-flash -p  "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini --model gemini-2.5-flash -p  "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini --model gemini-2.5-flash -p  "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini --model gemini-2.5-flash -p  "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini --model gemini-2.5-flash -p  "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini --model gemini-2.5-flash -p  "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini --model gemini-2.5-flash -p  "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini --model gemini-2.5-flash -p  "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini --model gemini-2.5-flash -p  when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more 1000 lines.
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results
- This model is not as intelligent as you are. It should be used for specific subtasks that require ingesting large amounts of code where the answer can be easily verified.