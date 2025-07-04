/**
 * @jest-environment jsdom
 */

import { ExportService } from '../../../src/core/data/ExportService.js';

// Mock dependencies
jest.mock('../../../src/core/data/NotesRepository.js', () => ({
    NotesRepository: {
        getAllCompletedNotes: jest.fn()
    }
}));

jest.mock('../../../src/core/utils/TimeFormatter.js', () => ({
    TimeFormatter: {
        calculateDuration: jest.fn((start, end, additional) => {
            if (!start || !end) return '00:00:00';
            const duration = Math.floor((end - start) / 1000) + (additional || 0);
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        })
    }
}));

import { NotesRepository } from '../../../src/core/data/NotesRepository.js';
import { TimeFormatter } from '../../../src/core/utils/TimeFormatter.js';

describe('ExportService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock DOM methods for download functionality
        global.URL.createObjectURL = jest.fn(() => 'mock-url');
        global.URL.revokeObjectURL = jest.fn();
        global.Blob = jest.fn((content, options) => ({ content, options }));
        
        // Mock document methods
        const mockLink = {
            setAttribute: jest.fn(),
            click: jest.fn(),
            style: {}
        };
        document.createElement = jest.fn(() => mockLink);
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('exportNotesToCSV', () => {
        it('should export notes to CSV format with proper headers', () => {
            const mockNotes = [
                {
                    dateKey: '2024-01-15',
                    id: '1',
                    note: {
                        projectID: 'PROJECT123',
                        attemptID: 'ATT456',
                        operationID: 'OP789',
                        startTimestamp: 1705329600000, // 2024-01-15 12:00:00
                        endTimestamp: 1705333200000,   // 2024-01-15 13:00:00
                        additionalTime: 60,
                        canceled: false,
                        failingIssues: 'Test failing issue',
                        nonFailingIssues: 'Test non-failing issue',
                        discussion: 'Test discussion'
                    }
                }
            ];
            
            NotesRepository.getAllCompletedNotes.mockReturnValue(mockNotes);
            TimeFormatter.calculateDuration.mockReturnValue('01:01:00');

            const csvContent = ExportService.exportNotesToCSV();
            
            const lines = csvContent.split('\n');
            expect(lines[0]).toBe('Date,Note ID,Project ID,Attempt ID,Operation ID,Start Timestamp,End Timestamp,Duration,Canceled,Failing Issues,Non-Failing Issues,Discussion');
            expect(lines).toHaveLength(2); // Header + 1 data row
            
            // Check that the data row contains expected values
            expect(lines[1]).toContain('2024-01-15');
            expect(lines[1]).toContain('PROJECT123');
            expect(lines[1]).toContain('ATT456');
            expect(lines[1]).toContain('OP789');
            expect(lines[1]).toContain('01:01:00');
            expect(lines[1]).toContain('No');
        });

        it('should handle notes with missing fields', () => {
            const mockNotes = [
                {
                    dateKey: '2024-01-15',
                    id: '1',
                    note: {
                        startTimestamp: null,
                        endTimestamp: null,
                        canceled: true,
                        projectID: undefined,
                        attemptID: null,
                        operationID: '',
                        failingIssues: '',
                        nonFailingIssues: '',
                        discussion: ''
                    }
                }
            ];
            
            NotesRepository.getAllCompletedNotes.mockReturnValue(mockNotes);
            TimeFormatter.calculateDuration.mockReturnValue('00:00:00');

            const csvContent = ExportService.exportNotesToCSV();
            
            const lines = csvContent.split('\n');
            expect(lines[1]).toContain('Yes'); // Canceled should be Yes
            expect(lines[1]).toContain('00:00:00'); // Duration should be 00:00:00
        });

        it('should properly escape CSV fields containing commas and quotes', () => {
            const mockNotes = [
                {
                    dateKey: '2024-01-15',
                    id: '1',
                    note: {
                        projectID: 'PROJECT,WITH,COMMAS',
                        attemptID: 'ATT"WITH"QUOTES',
                        operationID: 'OP\nWITH\nNEWLINES',
                        failingIssues: 'Issue with "quotes" and, commas',
                        nonFailingIssues: 'Normal text',
                        discussion: 'Discussion\nwith\nnewlines',
                        startTimestamp: 1705329600000,
                        endTimestamp: 1705333200000,
                        canceled: false
                    }
                }
            ];
            
            NotesRepository.getAllCompletedNotes.mockReturnValue(mockNotes);
            TimeFormatter.calculateDuration.mockReturnValue('01:00:00');

            const csvContent = ExportService.exportNotesToCSV();
            
            // Since fields can contain newlines, we need to check the entire CSV content
            // rather than splitting by lines
            expect(csvContent).toContain('"PROJECT,WITH,COMMAS"');
            expect(csvContent).toContain('"ATT""WITH""QUOTES"');
            expect(csvContent).toContain('"OP\nWITH\nNEWLINES"');
            expect(csvContent).toContain('"Issue with ""quotes"" and, commas"');
            expect(csvContent).toContain('"Discussion\nwith\nnewlines"');
        });

        it('should handle empty notes list', () => {
            NotesRepository.getAllCompletedNotes.mockReturnValue([]);

            const csvContent = ExportService.exportNotesToCSV();
            
            const lines = csvContent.split('\n');
            expect(lines).toHaveLength(1); // Only header
            expect(lines[0]).toBe('Date,Note ID,Project ID,Attempt ID,Operation ID,Start Timestamp,End Timestamp,Duration,Canceled,Failing Issues,Non-Failing Issues,Discussion');
        });

        it('should format timestamps correctly', () => {
            const mockNotes = [
                {
                    dateKey: '2024-01-15',
                    id: '1',
                    note: {
                        startTimestamp: 1705329600000,
                        endTimestamp: 1705333200000,
                        canceled: false
                    }
                }
            ];
            
            NotesRepository.getAllCompletedNotes.mockReturnValue(mockNotes);
            TimeFormatter.calculateDuration.mockReturnValue('01:00:00');

            const csvContent = ExportService.exportNotesToCSV();
            
            // Verify that TimeFormatter.calculateDuration was called with correct parameters
            expect(TimeFormatter.calculateDuration).toHaveBeenCalledWith(
                1705329600000,
                1705333200000,
                undefined
            );
        });

        it('should handle multiple notes', () => {
            const mockNotes = [
                {
                    dateKey: '2024-01-15',
                    id: '1',
                    note: { projectID: 'PROJECT1', canceled: false }
                },
                {
                    dateKey: '2024-01-16',
                    id: '1',
                    note: { projectID: 'PROJECT2', canceled: true }
                }
            ];
            
            NotesRepository.getAllCompletedNotes.mockReturnValue(mockNotes);

            const csvContent = ExportService.exportNotesToCSV();
            
            const lines = csvContent.split('\n');
            expect(lines).toHaveLength(3); // Header + 2 data rows
            expect(lines[1]).toContain('PROJECT1');
            expect(lines[1]).toContain('No');
            expect(lines[2]).toContain('PROJECT2');
            expect(lines[2]).toContain('Yes');
        });
    });

    describe('downloadCSV', () => {
        it('should create and trigger download', () => {
            const csvContent = 'Date,Note ID\n2024-01-15,1';
            const filename = 'test.csv';

            ExportService.downloadCSV(csvContent, filename);

            expect(global.Blob).toHaveBeenCalledWith([csvContent], { type: 'text/csv;charset=utf-8;' });
            expect(global.URL.createObjectURL).toHaveBeenCalledWith({ content: [csvContent], options: { type: 'text/csv;charset=utf-8;' } });
            
            const mockLink = document.createElement();
            expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
            expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
            expect(mockLink.style.visibility).toBe('hidden');
            expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
            expect(mockLink.click).toHaveBeenCalled();
            expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
        });

        it('should use default filename when not provided', () => {
            const csvContent = 'test content';

            ExportService.downloadCSV(csvContent);

            const mockLink = document.createElement();
            expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'notes_export.csv');
        });
    });

    describe('exportAndDownloadNotes', () => {
        it('should export and download notes', () => {
            const mockNotes = [
                {
                    dateKey: '2024-01-15',
                    id: '1',
                    note: { projectID: 'PROJECT1', canceled: false }
                }
            ];
            
            NotesRepository.getAllCompletedNotes.mockReturnValue(mockNotes);
            
            const exportSpy = jest.spyOn(ExportService, 'exportNotesToCSV');
            const downloadSpy = jest.spyOn(ExportService, 'downloadCSV');

            ExportService.exportAndDownloadNotes();

            expect(exportSpy).toHaveBeenCalled();
            expect(downloadSpy).toHaveBeenCalledWith(expect.any(String));
        });
    });

    describe('getExportStats', () => {
        it('should return correct export statistics', () => {
            const mockNotes = [
                {
                    dateKey: '2024-01-15',
                    id: '1',
                    note: { completed: true, canceled: false }
                },
                {
                    dateKey: '2024-01-16',
                    id: '1',
                    note: { completed: true, canceled: true }
                },
                {
                    dateKey: '2024-01-17',
                    id: '1',
                    note: { completed: true, canceled: false }
                }
            ];
            
            NotesRepository.getAllCompletedNotes.mockReturnValue(mockNotes);

            const stats = ExportService.getExportStats();

            expect(stats).toEqual({
                totalNotes: 3,
                dateRange: '2024-01-15 to 2024-01-17',
                completedNotes: 2,
                canceledNotes: 1
            });
        });

        it('should handle empty notes list', () => {
            NotesRepository.getAllCompletedNotes.mockReturnValue([]);

            const stats = ExportService.getExportStats();

            expect(stats).toEqual({
                totalNotes: 0,
                dateRange: null,
                completedNotes: 0,
                canceledNotes: 0
            });
        });

        it('should handle single note', () => {
            const mockNotes = [
                {
                    dateKey: '2024-01-15',
                    id: '1',
                    note: { completed: true, canceled: false }
                }
            ];
            
            NotesRepository.getAllCompletedNotes.mockReturnValue(mockNotes);

            const stats = ExportService.getExportStats();

            expect(stats.dateRange).toBe('2024-01-15');
        });
    });

    describe('getDateRange', () => {
        it('should return single date for one note', () => {
            const allNotes = [
                { dateKey: '2024-01-15', id: '1', note: {} }
            ];

            const range = ExportService.getDateRange(allNotes);

            expect(range).toBe('2024-01-15');
        });

        it('should return date range for multiple notes', () => {
            const allNotes = [
                { dateKey: '2024-01-15', id: '1', note: {} },
                { dateKey: '2024-01-17', id: '1', note: {} },
                { dateKey: '2024-01-16', id: '1', note: {} }
            ];

            const range = ExportService.getDateRange(allNotes);

            expect(range).toBe('2024-01-15 to 2024-01-17');
        });

        it('should return null for empty notes', () => {
            const range = ExportService.getDateRange([]);

            expect(range).toBe(null);
        });

        it('should sort dates correctly', () => {
            const allNotes = [
                { dateKey: '2024-12-31', id: '1', note: {} },
                { dateKey: '2024-01-01', id: '1', note: {} },
                { dateKey: '2024-06-15', id: '1', note: {} }
            ];

            const range = ExportService.getDateRange(allNotes);

            expect(range).toBe('2024-01-01 to 2024-12-31');
        });

        it('should handle same earliest and latest date', () => {
            const allNotes = [
                { dateKey: '2024-01-15', id: '1', note: {} },
                { dateKey: '2024-01-15', id: '2', note: {} }
            ];

            const range = ExportService.getDateRange(allNotes);

            expect(range).toBe('2024-01-15');
        });
    });
});