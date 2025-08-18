/**
 * ImportExportService - Handles manual import/export of all localStorage data
 */
export class ImportExportService {
    /**
     * Export all localStorage data to a JSON file
     */
    static exportData() {
        const data = {};
        const metadata = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalKeys: localStorage.length
        };
        
        // Collect all localStorage data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            try {
                // Try to parse as JSON, if it fails store as string
                data[key] = JSON.parse(value);
            } catch {
                data[key] = value;
            }
        }
        
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
            keysExported: localStorage.length,
            filename: link.download
        };
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
            
            reader.onload = (e) => {
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
                    const backup = this.createBackup();
                    
                    try {
                        // Clear existing localStorage
                        localStorage.clear();
                        
                        // Import all data
                        let importedKeys = 0;
                        for (const [key, value] of Object.entries(importData.data)) {
                            // Convert objects back to JSON strings for localStorage
                            const valueToStore = typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : value;
                            
                            localStorage.setItem(key, valueToStore);
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
                        this.restoreBackup(backup);
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
     * Create a backup of current localStorage
     * @private
     */
    static createBackup() {
        const backup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup[key] = localStorage.getItem(key);
        }
        return backup;
    }
    
    /**
     * Restore localStorage from backup
     * @private
     */
    static restoreBackup(backup) {
        localStorage.clear();
        for (const [key, value] of Object.entries(backup)) {
            localStorage.setItem(key, value);
        }
    }
    
    /**
     * Get statistics about current localStorage data
     */
    static getDataStats() {
        let noteCount = 0;
        let offPlatformCount = 0;
        let otherCount = 0;
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            // Estimate size in bytes
            totalSize += key.length + value.length;
            
            // Categorize keys
            if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                // Date keys for notes
                try {
                    const data = JSON.parse(value);
                    noteCount += Object.keys(data).length;
                } catch {
                    noteCount++;
                }
            } else if (key.startsWith('offPlatform_')) {
                offPlatformCount++;
            } else {
                otherCount++;
            }
        }
        
        return {
            totalKeys: localStorage.length,
            noteCount,
            offPlatformCount,
            otherCount,
            estimatedSizeKB: (totalSize / 1024).toFixed(2)
        };
    }
}