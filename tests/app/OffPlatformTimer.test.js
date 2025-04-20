import { OffPlatformTimer } from '../../src/app/OffPlatformTimer.js';

describe('OffPlatformTimer', () => {
  let timer;
  let mockLocalStorage;
  
  beforeEach(() => {
    // Create a mock localStorage object
    mockLocalStorage = {
      store: {},
      getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
      setItem: jest.fn((key, value) => {
        mockLocalStorage.store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        mockLocalStorage.store = {};
      })
    };
    
    // Replace the global localStorage with our mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Use fake timers for better control
    jest.useFakeTimers();
    
    // Create a new timer for each test
    timer = new OffPlatformTimer();
  });
  
  afterEach(() => {
    // Restore real timers
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  
  test('should initialize with default values', () => {
    expect(timer.timers.projectTraining.startTime).toBeNull();
    expect(timer.timers.projectTraining.totalSeconds).toBe(0);
    expect(timer.timers.sheetwork.startTime).toBeNull();
    expect(timer.timers.sheetwork.totalSeconds).toBe(0);
    expect(timer.timers.blocked.startTime).toBeNull();
    expect(timer.timers.blocked.totalSeconds).toBe(0);
    expect(timer.currentDate).toBeNull();
  });
  
  test('should track time for the current date only', () => {
    // Set up dates
    const date1 = '2023-01-01';
    const date2 = '2023-01-02';
    
    // Start timer for date 1
    timer.currentDate = date1;
    timer.startTimer('projectTraining');
    
    // Advance time
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // Check that timer is running for date 1
    expect(timer.getSeconds('projectTraining')).toBe(5);
    
    // Switch to date 2 and verify no timer is running there
    timer.saveTimerState(); // Save state for date 1
    timer.currentDate = date2;
    timer.loadTimerState(); // Load state for date 2
    
    // Verify that date 2 has no time accumulated
    expect(timer.getSeconds('projectTraining')).toBe(0);
    
    // Start a timer for date 2
    timer.startTimer('sheetwork');
    
    // Advance time
    jest.advanceTimersByTime(3000); // 3 seconds
    
    // Check that timer is running for date 2
    expect(timer.getSeconds('sheetwork')).toBe(3);
    
    // Switch back to date 1
    timer.saveTimerState(); // Save state for date 2
    timer.currentDate = date1;
    timer.loadTimerState(); // Load state for date 1
    
    // Advance time after loading state for date1
    jest.advanceTimersByTime(2000); // 2 more seconds
    
    // Verify date 1's timer continued accumulating time (5 sec initially + 2 sec now = 7 sec)
    expect(timer.getSeconds('projectTraining')).toBe(7);
    expect(timer.getSeconds('sheetwork')).toBe(0); // sheetwork timer wasn't started for date 1
  });
  
  test('should stop running timer when another timer is started', () => {
    // Set the current date
    timer.currentDate = '2023-01-01';
    
    // Start projectTraining timer
    timer.startTimer('projectTraining');
    
    // Advance time
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // Start sheetwork timer, which should stop projectTraining timer
    timer.startTimer('sheetwork');
    
    // Verify projectTraining timer was stopped and accumulated time
    expect(timer.timers.projectTraining.startTime).toBeNull();
    expect(timer.timers.projectTraining.totalSeconds).toBe(5);
    
    // Verify sheetwork timer is running
    expect(timer.timers.sheetwork.startTime).not.toBeNull();
    
    // Advance time
    jest.advanceTimersByTime(3000); // 3 seconds
    
    // Verify sheetwork timer accumulated time
    expect(timer.getSeconds('sheetwork')).toBe(3);
    
    // Start blocked timer, which should stop sheetwork timer
    timer.startTimer('blocked');
    
    // Verify sheetwork timer was stopped and accumulated time
    expect(timer.timers.sheetwork.startTime).toBeNull();
    expect(timer.timers.sheetwork.totalSeconds).toBe(3);
    
    // Verify blocked timer is running
    expect(timer.timers.blocked.startTime).not.toBeNull();
  });
  
  test('should keep running when changing dates and return to original state', () => {
    // Set initial date
    const date1 = '2023-01-01';
    timer.currentDate = date1;
    
    // Start a timer
    timer.startTimer('projectTraining');
    
    // Advance time
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // Save state before changing date
    timer.saveTimerState();
    
    // Change date
    const date2 = '2023-01-02';
    timer.currentDate = date2;
    timer.loadTimerState();
    
    // Verify no timers are running for the new date
    expect(timer.timers.projectTraining.startTime).toBeNull();
    expect(timer.timers.projectTraining.totalSeconds).toBe(0);
    
    // Start a different timer for date2
    timer.startTimer('sheetwork');
    
    // Advance time
    jest.advanceTimersByTime(3000); // 3 seconds
    
    // Save state before changing back
    timer.saveTimerState();
    
    // Change back to original date
    timer.currentDate = date1;
    timer.loadTimerState();
    
    // Verify the original timer automatically restarted
    expect(timer.timers.projectTraining.startTime).not.toBeNull();
    
    // Advance time some more
    jest.advanceTimersByTime(2000); // 2 more seconds
    
    // Verify total time accumulated (5 sec initially + 2 sec now = 7 sec)
    expect(timer.getSeconds('projectTraining')).toBe(7);
  });
  
  test('should save timer state between reloads', () => {
    // Set date and start timer
    timer.currentDate = '2023-01-01';
    timer.startTimer('projectTraining');
    
    // Advance time
    jest.advanceTimersByTime(10000); // 10 seconds
    
    // Save state (simulates page unload)
    timer.saveTimerState();
    
    // Verify localStorage was called with correct data
    expect(localStorage.setItem).toHaveBeenCalled();
    
    // Get the saved data
    const key = timer.getStorageKey();
    const savedDataString = mockLocalStorage.store[key];
    const savedData = JSON.parse(savedDataString);
    
    // Verify the timer was marked as shouldBeRunning
    expect(savedData.timers.projectTraining.shouldBeRunning).toBe(true);
    expect(savedData.timers.projectTraining.totalSeconds).toBe(10);
    
    // Create a new timer instance (simulates page reload)
    const newTimer = new OffPlatformTimer();
    newTimer.currentDate = '2023-01-01';
    
    // Load state
    newTimer.loadTimerState();
    
    // Verify the timer was restarted
    expect(newTimer.timers.projectTraining.startTime).not.toBeNull();
    expect(newTimer.timers.projectTraining.totalSeconds).toBe(10);
    
    // Advance time
    jest.advanceTimersByTime(5000); // 5 more seconds
    
    // Verify total time accumulated (10 sec saved + 5 sec now = 15 sec)
    expect(newTimer.getSeconds('projectTraining')).toBe(15);
  });
  
  test('should edit timer value correctly', () => {
    // Set date
    timer.currentDate = '2023-01-01';
    
    // Start timer and accumulate some time
    timer.startTimer('projectTraining');
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // Edit the timer to a specific value (1 hour, 30 minutes, 45 seconds)
    const hours = 1;
    const minutes = 30;
    const seconds = 45;
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    
    timer.editTimer('projectTraining', hours, minutes, seconds);
    
    // Verify the timer value was updated
    expect(timer.timers.projectTraining.totalSeconds).toBe(totalSeconds);
    
    // Verify the timer is still running
    expect(timer.timers.projectTraining.startTime).not.toBeNull();
    
    // Edit a non-running timer
    timer.editTimer('sheetwork', 0, 15, 30);
    
    // Verify the timer value was updated but timer is not running
    expect(timer.timers.sheetwork.totalSeconds).toBe(930); // 15*60 + 30
    expect(timer.timers.sheetwork.startTime).toBeNull();
  });
  
  test('should handle UI callback registrations correctly', () => {
    // Create mock callback functions
    const mockStartCallback = jest.fn();
    const mockStopCallback = jest.fn();
    const mockEditCallback = jest.fn();
    
    // Register callbacks
    timer.onStart('projectTraining', mockStartCallback);
    timer.onStop('projectTraining', mockStopCallback);
    timer.onEdit('projectTraining', mockEditCallback);
    
    // Set date
    timer.currentDate = '2023-01-01';
    
    // Start timer (should trigger start callback)
    timer.startTimer('projectTraining');
    expect(mockStartCallback).toHaveBeenCalledTimes(1);
    
    // Stop timer (should trigger stop callback)
    timer.stopTimer('projectTraining');
    expect(mockStopCallback).toHaveBeenCalledTimes(1);
    
    // Edit timer (should trigger edit callback)
    timer.editTimer('projectTraining', 1, 0, 0);
    expect(mockEditCallback).toHaveBeenCalledTimes(1);
  });
}); 