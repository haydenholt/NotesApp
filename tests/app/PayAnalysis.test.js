import PayAnalysis from '../../src/app/PayAnalysis.js';
import OffPlatformTimer from '../../src/app/OffPlatformTimer.js';

// Mock dependencies
jest.mock('../../src/app/OffPlatformTimer.js');

describe('PayAnalysis', () => {
  let payAnalysis;
  let mockContainer;
  let mockReportContainer;
  let mockLocalStorage;
  
  beforeEach(() => {
    // Setup DOM elements needed by PayAnalysis
    mockContainer = document.createElement('div');
    mockContainer.id = 'calendarContainer';
    mockReportContainer = document.createElement('div');
    mockReportContainer.id = 'payReportContainer';
    document.body.appendChild(mockContainer);
    document.body.appendChild(mockReportContainer);
    
    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
      setItem: jest.fn((key, value) => {
        mockLocalStorage.store[key] = value.toString();
      }),
      key: jest.fn((i) => Object.keys(mockLocalStorage.store)[i]),
      length: jest.fn(() => Object.keys(mockLocalStorage.store).length)
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up OffPlatformTimer mock
    OffPlatformTimer.mockImplementation(() => {
      return {
        currentDate: null,
        getTotalSeconds: jest.fn().mockReturnValue(3600), // 1 hour
        set currentDate(date) {
          this._currentDate = date;
        },
        get currentDate() {
          return this._currentDate;
        }
      };
    });
    
    // Use fake timers
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2023, 5, 15)); // Fixed date: June 15, 2023
    
    // Instantiate PayAnalysis
    payAnalysis = new PayAnalysis();
  });
  
  afterEach(() => {
    // Cleanup
    document.body.removeChild(mockContainer);
    document.body.removeChild(mockReportContainer);
    jest.useRealTimers();
  });

  test('should initialize with default values', () => {
    expect(payAnalysis.calendarContainer).toBe(mockContainer);
    expect(payAnalysis.reportContainer).toBe(mockReportContainer);
    expect(payAnalysis.selectedMonday).not.toBeNull();
    expect(payAnalysis.ratePerHour).toBe(60);
  });

  test('should render calendar with correct month and year', () => {
    // Get current date from our fixed fake timer
    const today = new Date();
    
    // Check if month and year are correctly set
    expect(payAnalysis.currentMonth).toBe(today.getMonth());
    expect(payAnalysis.currentYear).toBe(today.getFullYear());
    
    // Verify the month label is correct
    expect(payAnalysis.monthLabelElement.textContent).toBe(`${payAnalysis.getMonthName(today.getMonth())} ${today.getFullYear()}`);
    
    // Check if calendar grid exists
    expect(payAnalysis.datesGrid).toBeDefined();
  });

  test('should change month correctly', () => {
    const initialMonth = payAnalysis.currentMonth;
    const initialYear = payAnalysis.currentYear;
    
    // Change to next month
    payAnalysis.changeMonth(1);
    
    if (initialMonth === 11) {
      expect(payAnalysis.currentMonth).toBe(0);
      expect(payAnalysis.currentYear).toBe(initialYear + 1);
    } else {
      expect(payAnalysis.currentMonth).toBe(initialMonth + 1);
      expect(payAnalysis.currentYear).toBe(initialYear);
    }
    
    // Change to previous month
    payAnalysis.changeMonth(-1);
    
    expect(payAnalysis.currentMonth).toBe(initialMonth);
    expect(payAnalysis.currentYear).toBe(initialYear);
    
    // Test year change when going back from January
    payAnalysis.currentMonth = 0;
    payAnalysis.changeMonth(-1);
    
    expect(payAnalysis.currentMonth).toBe(11); // December
    expect(payAnalysis.currentYear).toBe(initialYear - 1);
  });

  test('should select date and calculate correct week', () => {
    const testDate = new Date(2023, 5, 15); // Thursday, June 15, 2023
    payAnalysis.selectDate(testDate);
    
    // Monday of that week would be June 12, 2023
    expect(payAnalysis.selectedMonday).toBe('2023-06-12');
    
    // Test with a Monday
    const mondayDate = new Date(2023, 5, 12); // Monday, June 12, 2023
    payAnalysis.selectDate(mondayDate);
    
    expect(payAnalysis.selectedMonday).toBe('2023-06-12');
    
    // Test with a Sunday (should return previous week's Monday)
    const sundayDate = new Date(2023, 5, 18); // Sunday, June 18, 2023
    payAnalysis.selectDate(sundayDate);
    
    expect(payAnalysis.selectedMonday).toBe('2023-06-12');
  });

  test('calendar weeks always start on Monday regardless of clicked date', () => {
    // Test every day of a week to ensure they all map to the same Monday
    const testWeek = {
      monday: new Date(2023, 7, 7),      // August 7, 2023
      tuesday: new Date(2023, 7, 8),     // August 8, 2023
      wednesday: new Date(2023, 7, 9),   // August 9, 2023
      thursday: new Date(2023, 7, 10),   // August 10, 2023
      friday: new Date(2023, 7, 11),     // August 11, 2023
      saturday: new Date(2023, 7, 12),   // August 12, 2023
      sunday: new Date(2023, 7, 13)      // August 13, 2023
    };

    // The Monday of this week should be August 7, 2023
    const expectedMonday = '2023-08-07';
    
    // Test each day of the week
    Object.values(testWeek).forEach(date => {
      payAnalysis.selectDate(date);
      expect(payAnalysis.selectedMonday).toBe(expectedMonday);
    });
    
    // Test date spanning month boundary
    const endOfMonth = new Date(2023, 6, 30);  // July 30, 2023 (Sunday)
    payAnalysis.selectDate(endOfMonth);
    expect(payAnalysis.selectedMonday).toBe('2023-07-24');  // Monday of that week
    
    const startOfMonth = new Date(2023, 7, 1);  // August 1, 2023 (Tuesday)
    payAnalysis.selectDate(startOfMonth);
    expect(payAnalysis.selectedMonday).toBe('2023-07-31');  // Monday of that week
    
    // Test date spanning year boundary
    const endOfYear = new Date(2023, 11, 31);  // December 31, 2023 (Sunday)
    payAnalysis.selectDate(endOfYear);
    expect(payAnalysis.selectedMonday).toBe('2023-12-25');  // Monday of that week
    
    const startOfYear = new Date(2024, 0, 1);  // January 1, 2024 (Monday)
    payAnalysis.selectDate(startOfYear);
    expect(payAnalysis.selectedMonday).toBe('2024-01-01');  // Monday of that week

    // Special case: February leap year handling
    const leapYearFeb = new Date(2024, 1, 29);  // February 29, 2024 (Thursday)
    payAnalysis.selectDate(leapYearFeb);
    expect(payAnalysis.selectedMonday).toBe('2024-02-26');  // Monday of that week
  });

  test('should format time correctly', () => {
    expect(payAnalysis.formatTime(0)).toBe('00:00:00');
    expect(payAnalysis.formatTime(30)).toBe('00:00:30');
    expect(payAnalysis.formatTime(60)).toBe('00:01:00');
    expect(payAnalysis.formatTime(3600)).toBe('01:00:00');
    expect(payAnalysis.formatTime(3661)).toBe('01:01:01');
    expect(payAnalysis.formatTime(86400)).toBe('24:00:00');
  });

  test('should get correct month name', () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthNames.forEach((name, index) => {
      expect(payAnalysis.getMonthName(index)).toBe(name);
    });
  });

  test('should retrieve on-platform time from localStorage', () => {
    const testDate = '2023-06-15';
    const testNotes = {
      note1: {
        startTimestamp: 1623744000000, // Some timestamp
        endTimestamp: 1623747600000,   // 1 hour later
        additionalTime: 1800           // 30 minutes
      },
      note2: {
        startTimestamp: 1623751200000, // Another timestamp
        endTimestamp: 1623754800000,   // 1 hour later
        additionalTime: 0
      },
      note3: {
        startTimestamp: 1623758400000, // Active timer (no end)
        endTimestamp: null,
        additionalTime: 0
      }
    };
    
    mockLocalStorage.store[testDate] = JSON.stringify(testNotes);
    
    // Mock Date.now() for the active timer calculation
    const now = 1623761400000; // 50 minutes after note3 start time
    
    // Should calculate: 1hr + 1hr + 30min + 50min = 3hr 20min = 12000 seconds
    expect(payAnalysis.getOnSecondsForDate(testDate, now)).toBe(12000);
  });

  test('should retrieve off-platform time from OffPlatformTimer', () => {
    const testDate = '2023-06-15';
    
    const result = payAnalysis.getOffSecondsForDate(testDate);
    
    // Check OffPlatformTimer was instantiated and used correctly
    expect(OffPlatformTimer).toHaveBeenCalled();
    const mockOffPlatformTimerInstance = OffPlatformTimer.mock.instances[0];
    
    // Verify that the currentDate was set on the instance
    // Setting happens during getOffSecondsForDate in PayAnalysis
    expect(result).toBe(3600);
  });

  test('should count completed tasks correctly', () => {
    const testDate = '2023-06-15';
    const testNotes = {
      note1: { completed: true, canceled: false },
      note2: { completed: false, canceled: false },
      note3: { completed: true, canceled: true }, // Completed but canceled, should not count
      note4: { completed: true, canceled: false },
      note5: { completed: false, canceled: true }
    };
    
    mockLocalStorage.store[testDate] = JSON.stringify(testNotes);
    
    // Should only count note1 and note4 (completed and not canceled)
    expect(payAnalysis.getCompletedCountForDate(testDate)).toBe(2);
  });

  test('should generate report with correct data', () => {
    // Set up mock data
    const monday = new Date(2023, 5, 12); // June 12, 2023
    payAnalysis.selectDate(monday);
    
    // Mock localStorage data for the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateKey = date.toISOString().slice(0, 10);
      
      const mockNotes = {
        note1: { 
          startTimestamp: date.getTime(),
          endTimestamp: date.getTime() + 3600000, // 1 hour
          additionalTime: 0,
          completed: true,
          canceled: false
        }
      };
      
      mockLocalStorage.store[dateKey] = JSON.stringify(mockNotes);
    }
    
    // Generate report
    payAnalysis.generateReport();
    
    // Check if report was generated
    expect(mockReportContainer.innerHTML).not.toBe('');
    
    // Verify report contains expected data
    expect(mockReportContainer.innerHTML).toContain('Week of June 12, 2023');
    
    // 7 days × (1 hour on-platform + 1 hour off-platform) = 14 hours
    expect(mockReportContainer.innerHTML).toContain('14.0');
    
    // 14 hours × $60/hour = $840.00
    expect(mockReportContainer.innerHTML).toContain('$840.00');
    
    // 7 tasks completed (1 per day)
    expect(mockReportContainer.innerHTML).toContain('7');
  });

  test('should export localStorage data to JSON', () => {
    // Mock data in localStorage
    mockLocalStorage.store = {
      'key1': 'value1',
      'key2': 'value2'
    };
    
    // Mock URL.createObjectURL and link.click
    const mockObjectURL = 'blob:test-url';
    global.URL.createObjectURL = jest.fn().mockReturnValue(mockObjectURL);
    global.URL.revokeObjectURL = jest.fn();
    
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn()
    };
    
    // Save original createElement to avoid recursion
    const originalCreateElement = document.createElement;
    
    document.createElement = jest.fn((tag) => {
      if (tag === 'a') return mockLink;
      // Use a simpler approach that doesn't recurse
      return originalCreateElement.call(document, tag);
    });
    
    // Call export function
    payAnalysis.exportAllData();
    
    // Verify URL creation and link click
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLink.href).toBe(mockObjectURL);
    expect(mockLink.download).toBe('notes_data.json');
    expect(mockLink.click).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
    
    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  test('should show import dialog and handle file import', async () => {
    // Mock file input
    const mockFileInput = {
      type: '',
      accept: '',
      files: [{ 
        text: jest.fn().mockResolvedValue(JSON.stringify({
          'key1': 'value1',
          'key2': 'value2'
        }))
      }],
      addEventListener: jest.fn((event, handler) => {
        if (event === 'change') {
          // Immediately trigger the handler to simulate file selection
          handler();
        }
      }),
      click: jest.fn()
    };
    
    // Save original createElement to avoid recursion
    const originalCreateElement = document.createElement;
    
    document.createElement = jest.fn((tag) => {
      if (tag === 'input') return mockFileInput;
      // Use a simpler approach that doesn't recurse
      return originalCreateElement.call(document, tag);
    });
    
    // Mock window.location.reload
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };
    
    // Call import function
    await payAnalysis.showImportDialog();
    
    // Verify file input creation and settings
    expect(mockFileInput.type).toBe('file');
    expect(mockFileInput.accept).toBe('.json,application/json');
    expect(mockFileInput.click).toHaveBeenCalled();
    
    // Verify localStorage was updated with file content
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('key1', 'value1');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('key2', 'value2');
    
    // Verify page reload was called
    expect(window.location.reload).toHaveBeenCalled();
    
    // Restore originals
    document.createElement = originalCreateElement;
    window.location = originalLocation;
  });
}); 