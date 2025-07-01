/**
 * @jest-environment jsdom
 */

import { DateUtils } from '../../../src/core/utils/DateUtils.js';

describe('DateUtils', () => {
    describe('getCurrentDate', () => {
        it('should return current date in YYYY-MM-DD format', () => {
            const mockDate = new Date('2024-01-15T12:00:00Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
            mockDate.toLocaleDateString = jest.fn(() => '2024-01-15');

            const result = DateUtils.getCurrentDate();

            expect(result).toBe('2024-01-15');
            expect(mockDate.toLocaleDateString).toHaveBeenCalledWith('sv-SE');

            global.Date.mockRestore();
        });
    });

    describe('formatDate', () => {
        it('should format date string to readable format', () => {
            // Mock toLocaleDateString to return predictable result
            const mockToLocaleDateString = jest.fn(() => 'Mon, Jan 15');
            const originalDate = global.Date;
            
            global.Date = jest.fn((year, month, day) => ({
                toLocaleDateString: mockToLocaleDateString
            }));
            global.Date.prototype = originalDate.prototype;

            const result = DateUtils.formatDate('2024-01-15');

            expect(global.Date).toHaveBeenCalledWith(2024, 0, 15); // Month is 0-indexed
            expect(mockToLocaleDateString).toHaveBeenCalledWith('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            expect(result).toBe('Mon, Jan 15');

            global.Date = originalDate;
        });

        it('should handle date strings with different formats', () => {
            const mockToLocaleDateString = jest.fn(() => 'Wed, Dec 31');
            const originalDate = global.Date;
            
            global.Date = jest.fn((year, month, day) => ({
                toLocaleDateString: mockToLocaleDateString
            }));
            global.Date.prototype = originalDate.prototype;

            const result = DateUtils.formatDate('2024-12-31');

            expect(global.Date).toHaveBeenCalledWith(2024, 11, 31); // December is month 11
            expect(result).toBe('Wed, Dec 31');

            global.Date = originalDate;
        });
    });

    describe('addDays', () => {
        it('should add positive days to date', () => {
            const result = DateUtils.addDays('2024-01-15', 5);
            expect(result).toBe('2024-01-20');
        });

        it('should subtract days when negative value provided', () => {
            const result = DateUtils.addDays('2024-01-15', -3);
            expect(result).toBe('2024-01-12');
        });

        it('should handle month boundaries', () => {
            const result = DateUtils.addDays('2024-01-30', 5);
            expect(result).toBe('2024-02-04');
        });

        it('should handle year boundaries', () => {
            const result = DateUtils.addDays('2023-12-30', 5);
            expect(result).toBe('2024-01-04');
        });

        it('should handle leap year', () => {
            const result = DateUtils.addDays('2024-02-28', 1);
            expect(result).toBe('2024-02-29'); // 2024 is a leap year
        });

        it('should handle adding zero days', () => {
            const result = DateUtils.addDays('2024-01-15', 0);
            expect(result).toBe('2024-01-15');
        });
    });

    describe('isValidDateKey', () => {
        it('should return true for valid date keys', () => {
            expect(DateUtils.isValidDateKey('2024-01-15')).toBe(true);
            expect(DateUtils.isValidDateKey('2023-12-31')).toBe(true);
            expect(DateUtils.isValidDateKey('2024-02-29')).toBe(true);
            expect(DateUtils.isValidDateKey('1999-01-01')).toBe(true);
        });

        it('should return false for invalid date keys', () => {
            expect(DateUtils.isValidDateKey('24-01-15')).toBe(false); // Wrong year format
            expect(DateUtils.isValidDateKey('2024-1-15')).toBe(false); // Single digit month
            expect(DateUtils.isValidDateKey('2024-01-5')).toBe(false); // Single digit day
            expect(DateUtils.isValidDateKey('2024/01/15')).toBe(false); // Wrong separator
            // Note: isValidDateKey only checks format, not logical validity
            // So '2024-13-01' would pass the regex test but be logically invalid
            expect(DateUtils.isValidDateKey('not-a-date')).toBe(false);
            expect(DateUtils.isValidDateKey('')).toBe(false);
            expect(DateUtils.isValidDateKey('2024-01')).toBe(false); // Incomplete
            expect(DateUtils.isValidDateKey('2024-01-15-extra')).toBe(false); // Extra parts
        });

        it('should handle null and undefined', () => {
            expect(DateUtils.isValidDateKey(null)).toBe(false);
            expect(DateUtils.isValidDateKey(undefined)).toBe(false);
        });
    });

    describe('getAllDateKeys', () => {
        let mockLocalStorage;

        beforeEach(() => {
            mockLocalStorage = {
                length: 0,
                key: jest.fn(),
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn()
            };
        });

        it('should return sorted date keys from localStorage', () => {
            const keys = ['2024-01-15', 'invalid-key', '2024-01-10', '2024-01-20', 'another-invalid'];
            mockLocalStorage.length = keys.length;
            mockLocalStorage.key.mockImplementation((index) => keys[index]);

            const result = DateUtils.getAllDateKeys(mockLocalStorage);

            expect(result).toEqual(['2024-01-20', '2024-01-15', '2024-01-10']); // Sorted newest first
        });

        it('should handle localStorage with no valid date keys', () => {
            const keys = ['invalid-key', 'another-invalid', 'notes_config'];
            mockLocalStorage.length = keys.length;
            mockLocalStorage.key.mockImplementation((index) => keys[index]);

            const result = DateUtils.getAllDateKeys(mockLocalStorage);

            expect(result).toEqual([]);
        });

        it('should handle empty localStorage', () => {
            mockLocalStorage.length = 0;

            const result = DateUtils.getAllDateKeys(mockLocalStorage);

            expect(result).toEqual([]);
        });

        it('should handle null keys in localStorage', () => {
            const keys = ['2024-01-15', null, '2024-01-10', undefined];
            mockLocalStorage.length = keys.length;
            mockLocalStorage.key.mockImplementation((index) => keys[index]);

            const result = DateUtils.getAllDateKeys(mockLocalStorage);

            expect(result).toEqual(['2024-01-15', '2024-01-10']);
        });

        it('should sort dates chronologically with newest first', () => {
            const keys = [
                '2023-12-25',
                '2024-01-01',
                '2024-01-15',
                '2023-12-31',
                '2024-02-01'
            ];
            mockLocalStorage.length = keys.length;
            mockLocalStorage.key.mockImplementation((index) => keys[index]);

            const result = DateUtils.getAllDateKeys(mockLocalStorage);

            expect(result).toEqual([
                '2024-02-01',
                '2024-01-15',
                '2024-01-01',
                '2023-12-31',
                '2023-12-25'
            ]);
        });

        it('should handle mixed valid and invalid keys', () => {
            const keys = [
                '2024-01-15',
                'timer_2024-01-15_projectTraining',
                '2024-01-10',
                'app_settings',
                '2024-01-20',
                'invalid-date-format'
            ];
            mockLocalStorage.length = keys.length;
            mockLocalStorage.key.mockImplementation((index) => keys[index]);

            const result = DateUtils.getAllDateKeys(mockLocalStorage);

            expect(result).toEqual(['2024-01-20', '2024-01-15', '2024-01-10']);
        });
    });
});