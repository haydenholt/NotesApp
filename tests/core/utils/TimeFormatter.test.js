/**
 * @jest-environment jsdom
 */

import { TimeFormatter } from '../../../src/core/utils/TimeFormatter.js';

describe('TimeFormatter', () => {
    describe('formatTime', () => {
        it('should format seconds into HH:MM:SS format', () => {
            expect(TimeFormatter.formatTime(0)).toBe('00:00:00');
            expect(TimeFormatter.formatTime(30)).toBe('00:00:30');
            expect(TimeFormatter.formatTime(60)).toBe('00:01:00');
            expect(TimeFormatter.formatTime(90)).toBe('00:01:30');
            expect(TimeFormatter.formatTime(3600)).toBe('01:00:00');
            expect(TimeFormatter.formatTime(3661)).toBe('01:01:01');
            expect(TimeFormatter.formatTime(7323)).toBe('02:02:03');
        });

        it('should handle large time values', () => {
            expect(TimeFormatter.formatTime(36000)).toBe('10:00:00'); // 10 hours
            expect(TimeFormatter.formatTime(86400)).toBe('24:00:00'); // 24 hours
            expect(TimeFormatter.formatTime(90061)).toBe('25:01:01'); // 25 hours, 1 minute, 1 second
        });

        it('should pad single digits with zeros', () => {
            expect(TimeFormatter.formatTime(1)).toBe('00:00:01');
            expect(TimeFormatter.formatTime(61)).toBe('00:01:01');
            expect(TimeFormatter.formatTime(3661)).toBe('01:01:01');
        });

        it('should handle negative values gracefully', () => {
            // While negative time doesn't make logical sense, 
            // the function should handle it without crashing
            expect(TimeFormatter.formatTime(-60)).toBe('-1:-1:00');
        });

        it('should handle decimal seconds as is (no flooring)', () => {
            expect(TimeFormatter.formatTime(90.7)).toMatch(/00:01:30\.\d+/);
            expect(TimeFormatter.formatTime(3661.9)).toMatch(/01:01:1\.\d+/);
        });
    });

    describe('calculateDuration', () => {
        it('should calculate duration between two timestamps', () => {
            const start = new Date('2024-01-15T10:00:00').getTime();
            const end = new Date('2024-01-15T10:05:30').getTime(); // 5 minutes 30 seconds

            const result = TimeFormatter.calculateDuration(start, end);
            
            expect(result).toBe('00:05:30');
        });

        it('should include additional time in calculation', () => {
            const start = new Date('2024-01-15T10:00:00').getTime();
            const end = new Date('2024-01-15T10:05:30').getTime(); // 5 minutes 30 seconds
            const additionalTime = 120; // 2 minutes

            const result = TimeFormatter.calculateDuration(start, end, additionalTime);
            
            expect(result).toBe('00:07:30'); // 5:30 + 2:00
        });

        it('should handle missing end timestamp', () => {
            const start = new Date('2024-01-15T10:00:00').getTime();

            const result = TimeFormatter.calculateDuration(start, null);
            
            expect(result).toBe('');
        });

        it('should handle missing start timestamp', () => {
            const end = new Date('2024-01-15T10:05:30').getTime();

            const result = TimeFormatter.calculateDuration(null, end);
            
            expect(result).toBe('');
        });

        it('should return formatted additional time when no timestamps provided', () => {
            const additionalTime = 150; // 2 minutes 30 seconds

            const result = TimeFormatter.calculateDuration(null, null, additionalTime);
            
            expect(result).toBe('00:02:30');
        });

        it('should return empty string when no timestamps or additional time', () => {
            const result = TimeFormatter.calculateDuration(null, null);
            
            expect(result).toBe('');
        });

        it('should handle zero additional time', () => {
            const start = new Date('2024-01-15T10:00:00').getTime();
            const end = new Date('2024-01-15T10:05:30').getTime();

            const result = TimeFormatter.calculateDuration(start, end, 0);
            
            expect(result).toBe('00:05:30');
        });

        it('should handle longer durations', () => {
            const start = new Date('2024-01-15T10:00:00').getTime();
            const end = new Date('2024-01-15T13:45:30').getTime(); // 3 hours 45 minutes 30 seconds

            const result = TimeFormatter.calculateDuration(start, end);
            
            expect(result).toBe('03:45:30');
        });

        it('should handle cross-day calculations', () => {
            const start = new Date('2024-01-15T23:30:00').getTime();
            const end = new Date('2024-01-16T01:15:30').getTime(); // 1 hour 45 minutes 30 seconds

            const result = TimeFormatter.calculateDuration(start, end);
            
            expect(result).toBe('01:45:30');
        });
    });

    describe('parseTimeInput', () => {
        it('should parse time components into total seconds', () => {
            expect(TimeFormatter.parseTimeInput(1, 30, 45)).toBe(5445); // 1*3600 + 30*60 + 45
            expect(TimeFormatter.parseTimeInput(0, 5, 0)).toBe(300); // 5 minutes
            expect(TimeFormatter.parseTimeInput(2, 0, 0)).toBe(7200); // 2 hours
            expect(TimeFormatter.parseTimeInput(0, 0, 30)).toBe(30); // 30 seconds
        });

        it('should handle string inputs', () => {
            expect(TimeFormatter.parseTimeInput('1', '30', '45')).toBe(5445);
            expect(TimeFormatter.parseTimeInput('0', '5', '0')).toBe(300);
        });

        it('should handle missing or invalid inputs', () => {
            expect(TimeFormatter.parseTimeInput(null, 30, 45)).toBe(1845); // 0*3600 + 30*60 + 45
            expect(TimeFormatter.parseTimeInput(1, null, 45)).toBe(3645); // 1*3600 + 0*60 + 45
            expect(TimeFormatter.parseTimeInput(1, 30, null)).toBe(5400); // 1*3600 + 30*60 + 0
            expect(TimeFormatter.parseTimeInput(undefined, undefined, undefined)).toBe(0);
        });

        it('should handle non-numeric strings', () => {
            expect(TimeFormatter.parseTimeInput('abc', 30, 45)).toBe(1845); // 0*3600 + 30*60 + 45
            expect(TimeFormatter.parseTimeInput(1, 'def', 45)).toBe(3645); // 1*3600 + 0*60 + 45
            expect(TimeFormatter.parseTimeInput(1, 30, 'ghi')).toBe(5400); // 1*3600 + 30*60 + 0
        });

        it('should handle decimal inputs by flooring', () => {
            expect(TimeFormatter.parseTimeInput(1.7, 30.9, 45.2)).toBe(5445); // parseInt floors the values
        });

        it('should handle large values', () => {
            expect(TimeFormatter.parseTimeInput(10, 59, 59)).toBe(39599); // 10 hours 59 minutes 59 seconds
            expect(TimeFormatter.parseTimeInput(24, 0, 0)).toBe(86400); // 24 hours
        });

        it('should handle zero values', () => {
            expect(TimeFormatter.parseTimeInput(0, 0, 0)).toBe(0);
        });
    });

    describe('secondsToHMS', () => {
        it('should convert seconds to hours, minutes, and seconds object', () => {
            expect(TimeFormatter.secondsToHMS(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
            expect(TimeFormatter.secondsToHMS(30)).toEqual({ hours: 0, minutes: 0, seconds: 30 });
            expect(TimeFormatter.secondsToHMS(60)).toEqual({ hours: 0, minutes: 1, seconds: 0 });
            expect(TimeFormatter.secondsToHMS(90)).toEqual({ hours: 0, minutes: 1, seconds: 30 });
            expect(TimeFormatter.secondsToHMS(3600)).toEqual({ hours: 1, minutes: 0, seconds: 0 });
            expect(TimeFormatter.secondsToHMS(3661)).toEqual({ hours: 1, minutes: 1, seconds: 1 });
            expect(TimeFormatter.secondsToHMS(7323)).toEqual({ hours: 2, minutes: 2, seconds: 3 });
        });

        it('should handle large time values', () => {
            expect(TimeFormatter.secondsToHMS(36000)).toEqual({ hours: 10, minutes: 0, seconds: 0 });
            expect(TimeFormatter.secondsToHMS(86400)).toEqual({ hours: 24, minutes: 0, seconds: 0 });
            expect(TimeFormatter.secondsToHMS(90061)).toEqual({ hours: 25, minutes: 1, seconds: 1 });
        });

        it('should handle decimal seconds as is (no flooring)', () => {
            const result1 = TimeFormatter.secondsToHMS(90.7);
            expect(result1.hours).toBe(0);
            expect(result1.minutes).toBe(1);
            expect(result1.seconds).toBeCloseTo(30.7, 1);
            
            const result2 = TimeFormatter.secondsToHMS(3661.9);
            expect(result2.hours).toBe(1);
            expect(result2.minutes).toBe(1);
            expect(result2.seconds).toBeCloseTo(1.9, 1);
        });

        it('should handle edge cases', () => {
            expect(TimeFormatter.secondsToHMS(59)).toEqual({ hours: 0, minutes: 0, seconds: 59 });
            expect(TimeFormatter.secondsToHMS(3599)).toEqual({ hours: 0, minutes: 59, seconds: 59 });
        });
    });

    describe('integration tests', () => {
        it('should have consistent formatTime and secondsToHMS results', () => {
            const testSeconds = [0, 30, 60, 90, 3600, 3661, 7323, 36000];
            
            testSeconds.forEach(seconds => {
                const formatted = TimeFormatter.formatTime(seconds);
                const hms = TimeFormatter.secondsToHMS(seconds);
                
                const expectedFormat = `${hms.hours.toString().padStart(2, '0')}:${hms.minutes.toString().padStart(2, '0')}:${hms.seconds.toString().padStart(2, '0')}`;
                
                expect(formatted).toBe(expectedFormat);
            });
        });

        it('should have consistent parseTimeInput and secondsToHMS results', () => {
            const testCases = [
                { h: 0, m: 0, s: 0 },
                { h: 1, m: 30, s: 45 },
                { h: 0, m: 5, s: 0 },
                { h: 2, m: 0, s: 0 },
                { h: 10, m: 59, s: 59 }
            ];
            
            testCases.forEach(({ h, m, s }) => {
                const totalSeconds = TimeFormatter.parseTimeInput(h, m, s);
                const backToHMS = TimeFormatter.secondsToHMS(totalSeconds);
                
                expect(backToHMS).toEqual({ hours: h, minutes: m, seconds: s });
            });
        });

        it('should handle full duration calculation workflow', () => {
            const start = new Date('2024-01-15T10:00:00').getTime();
            const end = new Date('2024-01-15T11:30:45').getTime(); // 1 hour 30 minutes 45 seconds
            const additionalTime = 300; // 5 minutes
            
            const duration = TimeFormatter.calculateDuration(start, end, additionalTime);
            expect(duration).toBe('01:35:45'); // 1:30:45 + 0:05:00
            
            // Verify we can parse this back to seconds
            const durationParts = duration.split(':');
            const totalSeconds = TimeFormatter.parseTimeInput(
                parseInt(durationParts[0]),
                parseInt(durationParts[1]),
                parseInt(durationParts[2])
            );
            expect(totalSeconds).toBe(5745); // 1*3600 + 35*60 + 45
            
            // Verify we can convert back to HMS
            const hms = TimeFormatter.secondsToHMS(totalSeconds);
            expect(hms).toEqual({ hours: 1, minutes: 35, seconds: 45 });
        });
    });
});