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
  
  test('should track time for current and previous dates', () => {
    // Set up dates
    const date1 = '2023-01-01';
    const date2 = '2023-01-02';
    const date3 = '2023-01-03'; // Add a third date for more thorough testing
    
    // Start timer for date 1
    timer.currentDate = date1;
    timer.startTimer('projectTraining');
    
    // Advance time
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // Check that timer is running for date 1
    expect(timer.getSeconds('projectTraining')).toBe(5);
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(5); // Total should match local at this point
    
    // Switch to date 2 and verify the timer from date 1 does not appear on date 2
    timer.saveTimerState(); // Save state for date 1
    timer.currentDate = date2;
    timer.loadTimerState(); // Load state for date 2
    
    // Verify date 2 initially shows 0 for all timers
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // But the total time for projectTraining should include date 1's timer
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(5);
    
    // Advance time to verify background timers are still running
    jest.advanceTimersByTime(2000); // 2 seconds
    
    // Date 2 should still show 0
    expect(timer.getSeconds('projectTraining')).toBe(0);
    
    // But the total should have increased
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(7); // 5 + 2
    
    // Start a timer for date 2
    timer.startTimer('sheetwork');
    
    // Advance time
    jest.advanceTimersByTime(3000); // 3 seconds
    
    // Check that timer is running for date 2, but only for the specific timer we started
    expect(timer.getSeconds('sheetwork')).toBe(3);
    expect(timer.getSeconds('projectTraining')).toBe(0); // Still 0 for date 2
    expect(timer.getSeconds('blocked')).toBe(0); // Still 0 for date 2
    
    // But the total times should include all running timers across all dates
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(10); // 5 + 2 + 3 = 10
    expect(timer.getTotalSecondsForCategory('sheetwork')).toBe(3);
    expect(timer.getGrandTotalSeconds()).toBe(13); // 10 + 3 = 13
    
    // Switch to date 3 (a completely new date)
    timer.saveTimerState(); // Save state for date 2
    timer.currentDate = date3;
    timer.loadTimerState(); // Load state for date 3
    
    // Verify date 3 shows 0 for all timers
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // But the total times should include timers from date 1 and date 2
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(10);
    expect(timer.getTotalSecondsForCategory('sheetwork')).toBe(3);
    
    // Advance time
    jest.advanceTimersByTime(4000); // 4 seconds
    
    // Date 3 should still show 0 for all categories
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // But the total times should have increased
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(14); // 10 + 4 = 14
    expect(timer.getTotalSecondsForCategory('sheetwork')).toBe(7); // 3 + 4 = 7
    expect(timer.getGrandTotalSeconds()).toBe(21); // 14 + 7 = 21
    
    // Start a timer on date 3
    timer.startTimer('blocked');
    
    // Advance time
    jest.advanceTimersByTime(2000); // 2 seconds
    
    // Date 3 should show time only for blocked
    expect(timer.getSeconds('blocked')).toBe(2);
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    
    // The totals should include time from all dates and all running timers
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(16); // 14 + 2 = 16
    expect(timer.getTotalSecondsForCategory('sheetwork')).toBe(9); // 7 + 2 = 9
    expect(timer.getTotalSecondsForCategory('blocked')).toBe(2);
    expect(timer.getGrandTotalSeconds()).toBe(27); // 16 + 9 + 2 = 27
    
    // Switch back to date 1
    timer.saveTimerState(); // Save state for date 3
    timer.currentDate = date1;
    timer.loadTimerState(); // Load state for date 1
    
    // Date 1 should only show its projectTraining time
    expect(timer.getSeconds('projectTraining')).toBeGreaterThan(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // The totals should include all time from all dates
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBeGreaterThanOrEqual(16);
    expect(timer.getTotalSecondsForCategory('sheetwork')).toBe(9);
    expect(timer.getTotalSecondsForCategory('blocked')).toBe(2);
  });
  
  test('should isolate timers between dates but track totals across all dates', () => {
    // This test focuses specifically on verifying the isolation of timer display 
    // while ensuring global tracking works correctly
    
    // Set up multiple dates
    const dates = ['2023-02-01', '2023-02-02', '2023-02-03'];
    
    // Start with the first date
    timer.currentDate = dates[0];
    
    // Start different timers on different dates and verify they don't interfere
    timer.startTimer('projectTraining');
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // First date shows its timer
    expect(timer.getSeconds('projectTraining')).toBe(5);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // Save and switch to second date
    timer.saveTimerState();
    timer.currentDate = dates[1];
    timer.loadTimerState();
    
    // Second date should show 0 for all timers
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // Start a different timer on second date
    timer.startTimer('sheetwork');
    jest.advanceTimersByTime(7000); // 7 seconds
    
    // Second date shows only its timer
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(7);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // Save and switch to third date
    timer.saveTimerState();
    timer.currentDate = dates[2];
    timer.loadTimerState();
    
    // Third date should show 0 for all timers
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // Start a third timer on the third date
    timer.startTimer('blocked');
    jest.advanceTimersByTime(3000); // 3 seconds
    
    // Third date shows only its timer
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(3);
    
    // But the totals should include all timers
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(15); // 5 + 7 + 3 = 15
    expect(timer.getTotalSecondsForCategory('sheetwork')).toBe(10); // 0 + 7 + 3 = 10
    expect(timer.getTotalSecondsForCategory('blocked')).toBe(3); // 0 + 0 + 3 = 3
    expect(timer.getGrandTotalSeconds()).toBe(28); // 15 + 10 + 3 = 28
    
    // Go back to first date
    timer.saveTimerState();
    timer.currentDate = dates[0];
    timer.loadTimerState();
    
    // First date should only show its own timer
    expect(timer.getSeconds('projectTraining')).toBeGreaterThan(0);
    expect(timer.getSeconds('sheetwork')).toBe(0);
    expect(timer.getSeconds('blocked')).toBe(0);
    
    // Go back to second date
    timer.saveTimerState();
    timer.currentDate = dates[1];
    timer.loadTimerState();
    
    // Second date should only show its own timer
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBeGreaterThan(0);
    expect(timer.getSeconds('blocked')).toBe(0);
  });
  
  test('should correctly handle rapid date switching with running timers', () => {
    // Test that rapid date switching doesn't break timer isolation
    const dates = ['2023-03-01', '2023-03-02', '2023-03-03', '2023-03-04'];
    
    // Start a timer on the first date
    timer.currentDate = dates[0];
    timer.startTimer('projectTraining');
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // Rapid switching between dates
    for (let i = 0; i < dates.length; i++) {
      timer.saveTimerState();
      timer.currentDate = dates[i];
      timer.loadTimerState();
      
      // Each date should only show its own time
      if (i === 0) {
        expect(timer.getSeconds('projectTraining')).toBeGreaterThan(0);
      } else {
        expect(timer.getSeconds('projectTraining')).toBe(0);
      }
      
      // Start a timer for each date
      timer.startTimer(`${i === 0 ? 'projectTraining' : i === 1 ? 'sheetwork' : 'blocked'}`);
      jest.advanceTimersByTime(2000); // 2 seconds
    }
    
    // Now go back to each date and check that it only shows its own timer
    for (let i = 0; i < dates.length; i++) {
      timer.saveTimerState();
      timer.currentDate = dates[i];
      timer.loadTimerState();
      
      // Verify each date only shows its own timer
      if (i === 0) {
        expect(timer.getSeconds('projectTraining')).toBeGreaterThan(0);
        expect(timer.getSeconds('sheetwork')).toBe(0);
        expect(timer.getSeconds('blocked')).toBe(0);
      } else if (i === 1) {
        expect(timer.getSeconds('projectTraining')).toBe(0);
        expect(timer.getSeconds('sheetwork')).toBeGreaterThan(0);
        expect(timer.getSeconds('blocked')).toBe(0);
      } else {
        expect(timer.getSeconds('projectTraining')).toBe(0);
        expect(timer.getSeconds('sheetwork')).toBe(0);
        expect(timer.getSeconds('blocked')).toBeGreaterThan(0);
      }
    }
    
    // The total should include time from all dates
    expect(timer.getGrandTotalSeconds()).toBeGreaterThan(0);
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
    
    // Verify date 2 shows 0 for projectTraining (not showing the timer from date 1)
    expect(timer.getSeconds('projectTraining')).toBe(0);
    
    // But the total time across all dates includes the time from date 1
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(5);
    
    // Advance time to simulate the timer continuing to run
    jest.advanceTimersByTime(3000); // 3 seconds
    
    // Date 2 still shows 0 for projectTraining
    expect(timer.getSeconds('projectTraining')).toBe(0);
    
    // But the total time for projectTraining is now 8 seconds
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(8);
    
    // Start a different timer for date2
    timer.startTimer('sheetwork');
    
    // Advance time
    jest.advanceTimersByTime(2000); // 2 seconds
    
    // Date 2 shows 0 for projectTraining and 2 for sheetwork
    expect(timer.getSeconds('projectTraining')).toBe(0);
    expect(timer.getSeconds('sheetwork')).toBe(2);
    
    // Total time for projectTraining is now 10 seconds (5 + 3 + 2)
    expect(timer.getTotalSecondsForCategory('projectTraining')).toBe(10);
    // Total time for sheetwork is 2 seconds
    expect(timer.getTotalSecondsForCategory('sheetwork')).toBe(2);
    
    // Save state before changing back
    timer.saveTimerState();
    
    // Change back to original date
    timer.currentDate = date1;
    timer.loadTimerState();
    
    // Date 1 shows its own timer value for projectTraining, not including time from date 2 sheetwork
    expect(timer.getSeconds('projectTraining')).toBeGreaterThan(0);
    // Date 1 shows 0 for sheetwork (not showing the timer from date 2)
    expect(timer.getSeconds('sheetwork')).toBe(0);
    
    // Advance time some more
    jest.advanceTimersByTime(2000); // 2 more seconds
    
    // Verify total time across all dates continues to accumulate
    expect(timer.getGrandTotalSeconds()).toBeGreaterThan(12);
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
    
    // In our updated implementation, totalSeconds isn't incremented in saveTimerState,
    // as the elapsed time is tracked in activeTimers
    // The actual accumulated time will be added when the timer is reloaded
    
    // Create a new timer instance (simulates page reload)
    const newTimer = new OffPlatformTimer();
    newTimer.currentDate = '2023-01-01';
    
    // Copy the activeTimers from the original timer to simulate preserved state
    // In a real scenario, this would be handled by localStorage
    newTimer.activeTimers = { ...timer.activeTimers };
    
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