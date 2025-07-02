# Testing Guide for Timer Notes

This project uses Jest for unit and integration testing of JavaScript components.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode (automatically re-runs when files change):
```bash
npm run test:watch
```

Generate test coverage report:
```bash
npm run test:coverage
```

## Test Structure

Tests are organized in the `tests` directory and mirror the structure of the `src` directory:

```
tests/
├── core/                   # Business Logic & Data Tests
│   ├── controllers/        # Controller tests
│   ├── data/              # Repository and service tests
│   ├── state/             # State management tests
│   └── utils/             # Utility function tests
└── ui/                    # User Interface Tests
    ├── components/        # UI component tests
    └── views/            # View component tests
```

- Test files are named after the module they test, with `.test.js` suffix
- Integration tests may be placed at the appropriate directory level

## Writing Tests

### Test File Templates

#### UI Component Test
```javascript
import ComponentToTest from '../../../src/ui/components/ComponentToTest.js';

describe('ComponentToTest', () => {
  let container;
  let componentInstance;
  let mockThemeManager;
  
  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    // Mock ThemeManager if needed
    mockThemeManager = {
      getPrimaryButtonClasses: jest.fn(() => 'mock-button-classes'),
      getInputClasses: jest.fn(() => 'mock-input-classes')
    };
    
    // Create component instance
    componentInstance = new ComponentToTest('test-container', mockThemeManager);
  });
  
  afterEach(() => {
    // Cleanup DOM
    document.body.removeChild(container);
  });
  
  test('should render with theme classes', () => {
    expect(mockThemeManager.getPrimaryButtonClasses).toHaveBeenCalled();
  });
});
```

#### Controller Test
```javascript
import ControllerToTest from '../../../src/core/controllers/ControllerToTest.js';

describe('ControllerToTest', () => {
  let controller;
  let mockRepository;
  let mockState;
  
  beforeEach(() => {
    // Mock dependencies
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(() => ({}))
    };
    
    mockState = {
      update: jest.fn(),
      get: jest.fn()
    };
    
    // Create controller instance
    controller = new ControllerToTest(mockRepository, mockState);
  });
  
  test('should save data through repository', async () => {
    const testData = { id: 1, content: 'test' };
    await controller.save(testData);
    
    expect(mockRepository.save).toHaveBeenCalledWith(testData);
  });
});
```

#### Repository Test
```javascript
import RepositoryToTest from '../../../src/core/data/RepositoryToTest.js';

describe('RepositoryToTest', () => {
  let repository;
  
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Create repository instance
    repository = new RepositoryToTest();
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  test('should save and retrieve data from localStorage', () => {
    const testData = { id: 1, content: 'test note' };
    const key = '2024-01-15';
    
    repository.save(key, testData);
    const retrieved = repository.load(key);
    
    expect(retrieved).toEqual(testData);
  });
  
  test('should return null for non-existent key', () => {
    const result = repository.load('non-existent');
    expect(result).toBeNull();
  });
});
```

#### State Management Test
```javascript
import StateToTest from '../../../src/core/state/StateToTest.js';

describe('StateToTest', () => {
  let state;
  
  beforeEach(() => {
    state = new StateToTest();
  });
  
  test('should update state and notify listeners', () => {
    const mockListener = jest.fn();
    state.subscribe(mockListener);
    
    const newData = { key: 'value' };
    state.update(newData);
    
    expect(state.get()).toEqual(newData);
    expect(mockListener).toHaveBeenCalledWith(newData);
  });
  
  test('should unsubscribe listeners', () => {
    const mockListener = jest.fn();
    const unsubscribe = state.subscribe(mockListener);
    
    unsubscribe();
    state.update({ key: 'value' });
    
    expect(mockListener).not.toHaveBeenCalled();
  });
});
```

### Testing DOM Interactions

For DOM interaction tests, use the `@testing-library/dom` utilities:

```javascript
import { fireEvent } from '@testing-library/dom';
import Component from '../../../src/ui/components/Component.js';
import ThemeManager from '../../../src/ui/components/ThemeManager.js';

test('should respond to button click with themed styling', () => {
  // Setup DOM
  document.body.innerHTML = '<div id="container"></div>';
  
  // Create ThemeManager instance
  const themeManager = new ThemeManager();
  
  // Create component with theme
  const component = new Component('container', themeManager);
  component.render();
  
  // Find button with theme classes
  const button = document.querySelector(`.${themeManager.getPrimaryButtonClasses().split(' ')[0]}`);
  const mockCallback = jest.fn();
  button.addEventListener('click', mockCallback);
  
  // Trigger event
  fireEvent.click(button);
  
  // Verify callback was called
  expect(mockCallback).toHaveBeenCalled();
});

test('should update theme when theme changes', () => {
  document.body.innerHTML = '<div id="container"></div>';
  
  const themeManager = new ThemeManager();
  const component = new Component('container', themeManager);
  component.render();
  
  // Get initial theme classes
  const button = document.querySelector('button');
  const initialClasses = button.className;
  
  // Change theme
  themeManager.setTheme('dark');
  
  // Trigger theme change event
  document.dispatchEvent(new Event('themeChanged'));
  
  // Verify classes updated
  expect(button.className).not.toBe(initialClasses);
  expect(button.className).toContain(themeManager.getPrimaryButtonClasses());
});
```

## Test-Driven Development Workflow

1. **Write a failing test** for the functionality you want to implement
2. **Run the test** to make sure it fails
3. **Implement the minimum code** needed to make the test pass
4. **Run the test** to verify it passes
5. **Refactor** the code while keeping the test passing
6. **Repeat** for the next functionality

## Code Coverage

The coverage report helps identify untested parts of the codebase. The goal is to maintain high coverage:
- Aim for at least 80% line coverage
- Focus on critical business logic components

View the coverage report in your browser:
```bash
npm run test:coverage
```

On Linux/macOS:
```bash
open coverage/lcov-report/index.html
```

On Windows:
```bash
start coverage/lcov-report/index.html
```

## Continuous Integration

Tests are automatically run in GitHub Actions CI pipeline for:
- All pushes to the main branch
- All pull requests targeting the main branch

The workflow is defined in `.github/workflows/test.yml`. 