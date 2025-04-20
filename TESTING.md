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

Tests are organized in the `js/__tests__` directory and follow these naming conventions:
- Test files are named after the module they test, with `.test.js` suffix
- Each component has its own test file

## Writing Tests

### Test File Template

```javascript
import ComponentToTest from '../ComponentToTest.js';

describe('ComponentToTest', () => {
  let componentInstance;
  
  beforeEach(() => {
    // Setup for each test
    componentInstance = new ComponentToTest();
  });
  
  afterEach(() => {
    // Cleanup after each test
  });
  
  test('should do something specific', () => {
    // Test specific functionality
    expect(componentInstance.someMethod()).toBe(expectedValue);
  });
});
```

### Testing DOM Interactions

For DOM interaction tests, use the `@testing-library/dom` utilities:

```javascript
import { fireEvent } from '@testing-library/dom';

test('should respond to button click', () => {
  // Setup DOM
  document.body.innerHTML = `<button id="testButton">Click Me</button>`;
  
  // Setup event listener
  const button = document.getElementById('testButton');
  const mockCallback = jest.fn();
  button.addEventListener('click', mockCallback);
  
  // Trigger event
  fireEvent.click(button);
  
  // Verify callback was called
  expect(mockCallback).toHaveBeenCalled();
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
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests are automatically run in GitHub Actions CI pipeline for:
- All pushes to the main branch
- All pull requests targeting the main branch

The workflow is defined in `.github/workflows/test.yml`. 