/**
 * BackupService - Handles automatic daily backups of localStorage data
 */
export class BackupService {
    constructor() {
        this.BACKUP_URL = 'http://localhost:8001/backup';
        this.STATUS_URL = 'http://localhost:8001/status';
        this.isInitialized = false;
    }

    /**
     * Initialize the backup service - call this on app startup
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Check if backup server is running
            const response = await fetch(this.STATUS_URL);
            if (response.ok) {
                console.log('📦 Backup service connected');
                this.isInitialized = true;
                
                // Attempt backup on startup
                await this.performBackup();
                
                // Set up periodic backup check (every hour)
                setInterval(() => {
                    this.performBackup();
                }, 60 * 60 * 1000); // 1 hour
                
            } else {
                console.warn('📦 Backup server not responding');
            }
        } catch (error) {
            console.warn('📦 Backup server not available:', error.message);
        }
    }

    /**
     * Get all localStorage data
     */
    getAllLocalStorageData() {
        const data = {};
        
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
        
        return data;
    }

    /**
     * Perform backup of all localStorage data
     */
    async performBackup() {
        if (!this.isInitialized) {
            console.log('📦 Backup service not initialized');
            return false;
        }

        try {
            const data = this.getAllLocalStorageData();
            
            const response = await fetch(this.BACKUP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.backed_up) {
                    console.log(`✅ Backup completed: ${result.filename}`);
                } else {
                    console.log('📦 Already backed up today');
                }
                return true;
            } else {
                console.error('❌ Backup failed:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Backup error:', error);
            return false;
        }
    }

    /**
     * Manual backup trigger
     */
    async triggerBackup() {
        console.log('📦 Manual backup triggered...');
        return await this.performBackup();
    }

    /**
     * Get backup status
     */
    async getStatus() {
        try {
            const response = await fetch(this.STATUS_URL);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('❌ Could not get backup status:', error);
        }
        return null;
    }
}