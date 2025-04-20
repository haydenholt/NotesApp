// Import jest-dom additions for DOM element assertions
import '@testing-library/jest-dom';

// Mock localStorage for tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock window.alert
window.alert = jest.fn(); 