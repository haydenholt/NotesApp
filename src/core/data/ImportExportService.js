/**
 * ImportExportService - Handles manual import/export of all localStorage data
 */
import { SecurityUtils } from '../utils/SecurityUtils.js';
import { SecureStorage } from './SecureStorage.js';

export class ImportExportService {
    /**
     * Export all localStorage data to a JSON file (unencrypted)
     */
    static async exportData() {
        try {
            // Export decrypted data
            const allData = await SecureStorage.exportAll();
            
            // Filter out old format off-platform keys (keep only new format)
            const data = {};
            for (const [key, value] of Object.entries(allData)) {
                // Skip old format offPlatform_ keys (but keep offPlatform_entries_ keys)
                if (key.startsWith('offPlatform_') && !key.startsWith('offPlatform_entries_')) {
                    console.log('Skipping old format key from export:', key);
                    continue;
                }
                data[key] = value;
            }
            
            const metadata = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                totalKeys: Object.keys(data).length
            };
            
            const exportData = {
                metadata,
                data
            };
            
            // Create and download the file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            const timestamp = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `notes-backup-${timestamp}.json`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            return {
                success: true,
                keysExported: Object.keys(data).length,
                filename: link.download
            };
        } catch (error) {
            console.error('Export failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Import data from a JSON file and restore to localStorage
     * @param {File} file - The file to import
     * @returns {Promise} Promise that resolves with import result
     */
    static async importData(file) {
        return new Promise((resolve, reject) => {
            if (!file || file.type !== 'application/json') {
                reject(new Error('Please select a valid JSON file'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate the import data structure
                    if (!importData.data || typeof importData.data !== 'object') {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Optional: Check version compatibility
                    if (importData.metadata && importData.metadata.version) {
                        const version = importData.metadata.version;
                        // For now we only have version 1.0
                        if (version !== '1.0') {
                            console.warn(`Importing from version ${version}, current version is 1.0`);
                        }
                    }
                    
                    // Store current data for potential rollback
                    const backup = await this.createBackup();
                    
                    try {
                        // Clear existing encrypted data
                        SecureStorage.clear();
                        
                        // Import all data (will be encrypted when stored)
                        let importedKeys = 0;
                        for (const [key, value] of Object.entries(importData.data)) {
                            // Validate the key format
                            if (typeof key !== 'string' || key.length === 0) {
                                console.warn('Skipping invalid key:', key);
                                continue;
                            }
                            
                            let valueToStore;
                            
                            // For date keys (note data), validate and sanitize
                            // Also handle keys that start with 'notes_' prefix
                            if (/^\d{4}-\d{2}-\d{2}$/.test(key) || (key.startsWith('notes_') && /^\d{4}-\d{2}-\d{2}$/.test(key.substring(6)))) {
                                // Extract the actual date key (remove 'notes_' prefix if present)
                                const actualKey = key.startsWith('notes_') ? key.substring(6) : key;
                                
                                if (typeof value === 'object') {
                                    const sanitizedNotes = {};
                                    for (const [noteId, noteData] of Object.entries(value)) {
                                        if (!/^\d+$/.test(noteId)) continue;
                                        sanitizedNotes[noteId] = SecurityUtils.sanitizeNoteData(noteData);
                                    }
                                    valueToStore = JSON.stringify(sanitizedNotes);
                                    
                                    // Store with the clean date key (without 'notes_' prefix)
                                    await SecureStorage.setItem(actualKey, valueToStore);
                                    importedKeys++;
                                    continue;
                                } else {
                                    continue; // Skip invalid note data
                                }
                            }
                            // For pay rate
                            else if (key === 'pay_rate') {
                                const rate = parseFloat(value);
                                if (isNaN(rate) || rate < 0 || rate > 1000) {
                                    console.warn('Skipping invalid pay rate:', value);
                                    continue;
                                }
                                valueToStore = String(rate);
                            }
                            // For theme
                            else if (key === 'app_theme') {
                                if (value !== 'light' && value !== 'dark') {
                                    console.warn('Skipping invalid theme:', value);
                                    continue;
                                }
                                valueToStore = value;
                            }
                            // For off-platform timer data - handle new format first, then old format
                            else if (key.startsWith('offPlatform_entries_')) {
                                // New format: offPlatform_entries_YYYY-MM-DD
                                const dateKey = key.substring(20);
                                if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                                    console.warn('Skipping invalid off-platform entries key:', key);
                                    continue;
                                }
                                valueToStore = typeof value === 'object' 
                                    ? JSON.stringify(value) 
                                    : value;
                                
                                // Store the new format entries
                                await SecureStorage.setItem(key, valueToStore);
                                importedKeys++;
                                continue;
                            }
                            else if (key.startsWith('offPlatform_') && !key.startsWith('offPlatform_entries_')) {
                                // Old format: offPlatform_YYYY-MM-DD - convert to new format during import
                                const dateKey = key.substring(12);
                                
                                // Skip special keys like offPlatform_shared, offPlatform_activeTimers
                                if (dateKey === 'shared' || dateKey === 'activeTimers') {
                                    // These are special keys, store them as-is
                                    valueToStore = typeof value === 'object' 
                                        ? JSON.stringify(value) 
                                        : value;
                                    await SecureStorage.setItem(key, valueToStore);
                                    importedKeys++;
                                    continue;
                                }
                                
                                if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                                    console.warn('Skipping invalid off-platform key:', key);
                                    continue;
                                }
                                
                                // Convert old format to new format during import
                                if (typeof value === 'object' && value.timers) {
                                    // This is old format, convert to new entries format
                                    const entries = [];
                                    const categoryTitles = {
                                        projectTraining: 'Project Training',
                                        sheetwork: 'Sheet Work',
                                        blocked: 'Blocked from Working'
                                    };
                                    
                                    let migrationOffset = 0;
                                    const baseTime = Date.now() - 86400000; // Mark as legacy
                                    
                                    Object.entries(value.timers).forEach(([category, timer]) => {
                                        if (timer.totalSeconds > 0 || timer.startTime) {
                                            const createdAt = baseTime + migrationOffset;
                                            migrationOffset += 1000;
                                            
                                            const entry = {
                                                id: `legacy_${category}_${createdAt}_${Math.random().toString(36).substr(2, 9)}`,
                                                title: categoryTitles[category] || category,
                                                totalSeconds: timer.totalSeconds || 0,
                                                isRunning: !!timer.startTime,
                                                startTime: timer.startTime || null,
                                                endTime: timer.startTime ? null : createdAt,
                                                createdAt,
                                                migrated: true
                                            };
                                            entries.push(entry);
                                        }
                                    });
                                    
                                    // Store as new format
                                    const newKey = `offPlatform_entries_${dateKey}`;
                                    await SecureStorage.setItem(newKey, JSON.stringify(entries));
                                    importedKeys++;
                                    continue; // Skip storing the old format
                                } else {
                                    // Skip old format keys that don't have the expected structure
                                    console.warn('Skipping old format off-platform key during import:', key);
                                    continue;
                                }
                            }
                            // Handle timer_ keys (legacy timer format)
                            else if (key.startsWith('timer_')) {
                                // These are legacy individual timer keys, skip them
                                console.warn('Skipping legacy timer key:', key);
                                continue;
                            }
                            // Handle systemPromptTemplates
                            else if (key === 'systemPromptTemplates') {
                                valueToStore = typeof value === 'object' 
                                    ? JSON.stringify(value) 
                                    : value;
                            }
                            // Skip any other keys for security
                            else {
                                console.warn('Skipping unknown key for security:', key);
                                continue;
                            }
                            
                            await SecureStorage.setItem(key, valueToStore);
                            importedKeys++;
                        }
                        
                        resolve({
                            success: true,
                            keysImported: importedKeys,
                            filename: file.name,
                            exportDate: importData.metadata?.exportDate || 'Unknown'
                        });
                        
                    } catch (importError) {
                        // Rollback on error
                        await this.restoreBackup(backup);
                        throw importError;
                    }
                    
                } catch (error) {
                    reject(new Error(`Import failed: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Create a backup of current encrypted storage
     * @private
     */
    static async createBackup() {
        return await SecureStorage.exportAll();
    }
    
    /**
     * Restore encrypted storage from backup
     * @private
     */
    static async restoreBackup(backup) {
        SecureStorage.clear();
        await SecureStorage.importAll(backup);
    }
    
    /**
     * Get statistics about current encrypted storage data
     */
    static async getDataStats() {
        try {
            const data = await SecureStorage.exportAll();
            let noteCount = 0;
            let offPlatformCount = 0;
            let otherCount = 0;
            let totalSize = 0;
            
            for (const [key, value] of Object.entries(data)) {
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                
                // Estimate size in bytes
                totalSize += key.length + stringValue.length;
                
                // Categorize keys
                if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                    // Date keys for notes
                    try {
                        const noteData = typeof value === 'object' ? value : JSON.parse(value);
                        noteCount += Object.keys(noteData).length;
                    } catch {
                        noteCount++;
                    }
                } else if (key.startsWith('offPlatform_entries_')) {
                    // New format entries
                    offPlatformCount++;
                } else if (key.startsWith('offPlatform_')) {
                    // Old format (shouldn't be exported anymore, but count if present)
                    offPlatformCount++;
                } else {
                    otherCount++;
                }
            }
            
            return {
                totalKeys: Object.keys(data).length,
                noteCount,
                offPlatformCount,
                otherCount,
                estimatedSizeKB: (totalSize / 1024).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting data stats:', error);
            return {
                totalKeys: 0,
                noteCount: 0,
                offPlatformCount: 0,
                otherCount: 0,
                estimatedSizeKB: '0.00'
            };
        }
    }
}