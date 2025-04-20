import Timer from '../../src/components/Timer.js';

describe('Timer', () => {
  let timer;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create a new Timer instance before each test
    timer = new Timer();

    // Mock localStorage
    jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(Storage.prototype, 'getItem');
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  test('should initialize with null timestamps', () => {
    expect(timer.startTimestamp).toBeNull();
    expect(timer.endTimestamp).toBeNull();
    expect(timer.displayInterval).toBeNull();
    expect(timer.additionalTime).toBe(0);
  });
  
  test('should start timer correctly', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    
    timer.start();
    
    expect(timer.startTimestamp).toBe(now);
    expect(timer.endTimestamp).toBeNull();
    
    // Restore the Date.now mock
    Date.now.mockRestore();
  });
  
  test('should stop timer correctly', () => {
    // Setup: Start the timer
    const startTime = Date.now();
    jest.spyOn(Date, 'now').mockReturnValueOnce(startTime);
    timer.start();
    
    // Stop the timer
    const stopTime = startTime + 5000; // 5 seconds later
    Date.now.mockReturnValueOnce(stopTime);
    timer.stop();
    
    expect(timer.endTimestamp).toBe(stopTime);
    
    // Restore the Date.now mock
    Date.now.mockRestore();
  });
  
  test('should calculate seconds correctly', () => {
    // Setup: Start the timer at a specific time
    const startTime = 1000000;
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime) // for start()
      .mockReturnValueOnce(startTime + 10000); // for getSeconds()
    
    timer.start();
    
    // Should return 10 seconds
    expect(timer.getSeconds()).toBe(10);
    
    // Restore the Date.now mock
    Date.now.mockRestore();
  });
  
  test('should format time correctly', () => {
    expect(timer.formatTime(3661)).toBe('01:01:01');
    expect(timer.formatTime(7325)).toBe('02:02:05');
  });
  
  test('should restart a stopped timer', () => {
    // Setup: Start and stop the timer
    const startTime = 1000000;
    const stopTime = startTime + 5000; // 5 seconds
    const restartTime = stopTime + 1000; // 1 second after stopping
    
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime) // for start()
      .mockReturnValueOnce(stopTime)  // for stop()
      .mockReturnValueOnce(restartTime); // for restart()
    
    timer.start();
    timer.stop();
    
    // Restart the timer
    timer.restart();
    
    // Should have accumulated 5 seconds in additionalTime
    expect(timer.additionalTime).toBe(5);
    expect(timer.startTimestamp).toBe(restartTime);
    expect(timer.endTimestamp).toBeNull();
    
    // Restore the Date.now mock
    Date.now.mockRestore();
  });
  
  test('should update display element', () => {
    // Create a mock display element
    const mockElement = { textContent: '' };
    timer.displayElement = mockElement;
    
    // Mock getSeconds to return a specific value
    jest.spyOn(timer, 'getSeconds').mockReturnValue(3661);
    
    // Call updateDisplay directly
    timer.updateDisplay();
    
    // Verify the formatted time is correctly set
    expect(mockElement.textContent).toBe('01:01:01');
  });
}); 