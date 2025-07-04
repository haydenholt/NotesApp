import { NotesRepository } from './NotesRepository.js';
import { TimeFormatter } from '../utils/TimeFormatter.js';

export class ExportService {
    static exportNotesToCSV() {
        const csvRows = [];
        const headers = [
            'Date', 
            'Note ID', 
            'Project ID', 
            'Attempt ID', 
            'Operation ID', 
            'Start Timestamp', 
            'End Timestamp', 
            'Duration', 
            'Canceled',
            'Failing Issues',
            'Non-Failing Issues',
            'Discussion'
        ];
        csvRows.push(headers.join(','));

        const allNotes = NotesRepository.getAllCompletedNotes();
        
        allNotes.forEach(({ dateKey, id, note }) => {
            const startDate = note.startTimestamp ? 
                new Date(note.startTimestamp).toLocaleString() : '';
            const endDate = note.endTimestamp ? 
                new Date(note.endTimestamp).toLocaleString() : '';
            
            const duration = TimeFormatter.calculateDuration(
                note.startTimestamp, 
                note.endTimestamp, 
                note.additionalTime
            );
            
            const canceled = note.canceled ? 'Yes' : 'No';
            
            // Escape and quote fields that might contain commas or quotes
            const escapeCSVField = (field) => {
                if (!field) return '';
                const str = String(field).replace(/"/g, '""');
                return str.includes(',') || str.includes('"') || str.includes('\n') ? 
                    `"${str}"` : str;
            };
            
            const row = [
                escapeCSVField(dateKey),
                escapeCSVField(id),
                escapeCSVField(note.projectID || ''),
                escapeCSVField(note.attemptID || ''),
                escapeCSVField(note.operationID || ''),
                escapeCSVField(startDate),
                escapeCSVField(endDate),
                escapeCSVField(duration),
                escapeCSVField(canceled),
                escapeCSVField(note.failingIssues || ''),
                escapeCSVField(note.nonFailingIssues || ''),
                escapeCSVField(note.discussion || '')
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    static downloadCSV(csvContent, filename = 'notes_export.csv') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    static exportAndDownloadNotes() {
        const csvContent = this.exportNotesToCSV();
        this.downloadCSV(csvContent);
    }

    static getExportStats() {
        const allNotes = NotesRepository.getAllCompletedNotes();
        const dateRange = this.getDateRange(allNotes);
        
        return {
            totalNotes: allNotes.length,
            dateRange,
            completedNotes: allNotes.filter(({ note }) => note.completed && !note.canceled).length,
            canceledNotes: allNotes.filter(({ note }) => note.canceled).length
        };
    }

    static getDateRange(allNotes) {
        if (allNotes.length === 0) return null;
        
        const dates = allNotes.map(({ dateKey }) => dateKey).sort();
        const earliest = dates[0];
        const latest = dates[dates.length - 1];
        
        return earliest === latest ? earliest : `${earliest} to ${latest}`;
    }
}