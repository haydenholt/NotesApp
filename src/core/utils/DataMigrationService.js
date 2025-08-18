import { EncryptionService } from './EncryptionService.js';
import { SecurityUtils } from './SecurityUtils.js';

/**
 * Service to migrate existing unencrypted data to encrypted format
 */
export class DataMigrationService {
    static MIGRATION_VERSION_KEY = 'data_migration_version';
    static CURRENT_MIGRATION_VERSION = 1;

    /**
     * Check if migration is needed and run it
     */
    static async runMigrationIfNeeded() {
        try {
            const currentVersion = this.getCurrentMigrationVersion();
            
            if (currentVersion < this.CURRENT_MIGRATION_VERSION) {
                console.log('Starting data migration to add encryption...');
                const success = await this.migrateToEncryption();
                
                if (success) {
                    this.setMigrationVersion(this.CURRENT_MIGRATION_VERSION);
                    console.log('Data migration completed successfully');
                    return true;
                } else {
                    console.error('Data migration failed');
                    return false;
                }
            }
            
            return true; // No migration needed
        } catch (error) {
            console.error('Error during migration check:', error);
            return false;
        }
    }

    /**
     * Get the current migration version
     */
    static getCurrentMigrationVersion() {
        const version = localStorage.getItem(this.MIGRATION_VERSION_KEY);
        return version ? parseInt(version, 10) : 0;
    }

    /**
     * Set the migration version
     */
    static setMigrationVersion(version) {
        localStorage.setItem(this.MIGRATION_VERSION_KEY, version.toString());
    }

    /**
     * Migrate all data to use encryption
     */
    static async migrateToEncryption() {
        try {
            // Initialize encryption first
            await EncryptionService.initialize();
            
            // Migrate notes data
            const notesMigrated = await this.migrateNotes();
            
            // Migrate timer data
            const timersMigrated = await this.migrateTimers();
            
            return notesMigrated && timersMigrated;
        } catch (error) {
            console.error('Error during encryption migration:', error);
            return false;
        }
    }

    /**
     * Migrate notes to encrypted format
     */
    static async migrateNotes() {
        try {
            let migratedCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                // Check if this is a date key for notes
                if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
                    const rawData = localStorage.getItem(key);
                    if (!rawData) continue;
                    
                    try {
                        const notes = JSON.parse(rawData);
                        let hasUnencryptedData = false;
                        const migratedNotes = {};
                        
                        for (const [noteId, noteData] of Object.entries(notes)) {
                            if (typeof noteData === 'object' && noteData !== null) {
                                // Check if any sensitive fields are unencrypted
                                const isEncrypted = SecurityUtils.isNoteDataEncrypted ? 
                                    SecurityUtils.isNoteDataEncrypted(noteData) : false;
                                
                                if (!isEncrypted) {
                                    hasUnencryptedData = true;
                                    // Encrypt the note data
                                    migratedNotes[noteId] = await SecurityUtils.sanitizeAndEncryptNoteData(noteData);
                                } else {
                                    migratedNotes[noteId] = noteData;
                                }
                            } else {
                                migratedNotes[noteId] = noteData;
                            }
                        }
                        
                        // Only update if we found unencrypted data
                        if (hasUnencryptedData) {
                            localStorage.setItem(key, JSON.stringify(migratedNotes));
                            migratedCount++;
                        }
                    } catch (parseError) {
                        console.warn(`Could not parse notes for date ${key}:`, parseError);
                    }
                }
            }
            
            console.log(`Migrated ${migratedCount} note files to encrypted format`);
            return true;
        } catch (error) {
            console.error('Error migrating notes:', error);
            return false;
        }
    }

    /**
     * Migrate timer data to encrypted format
     */
    static async migrateTimers() {
        try {
            let migratedCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                // Check if this is an off-platform timer key
                if (key && key.startsWith('offPlatform_') && /offPlatform_\d{4}-\d{2}-\d{2}$/.test(key)) {
                    const rawData = localStorage.getItem(key);
                    if (!rawData) continue;
                    
                    try {
                        // Check if data is already encrypted
                        if (!EncryptionService.isEncrypted(rawData)) {
                            // Data is not encrypted, encrypt it
                            const encryptedData = await EncryptionService.encrypt(rawData);
                            localStorage.setItem(key, encryptedData);
                            migratedCount++;
                        }
                    } catch (parseError) {
                        console.warn(`Could not migrate timer data for key ${key}:`, parseError);
                    }
                }
            }
            
            console.log(`Migrated ${migratedCount} timer files to encrypted format`);
            return true;
        } catch (error) {
            console.error('Error migrating timers:', error);
            return false;
        }
    }

    /**
     * Get migration statistics
     */
    static getMigrationStats() {
        let totalNoteFiles = 0;
        let encryptedNoteFiles = 0;
        let totalTimerFiles = 0;
        let encryptedTimerFiles = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                totalNoteFiles++;
                const rawData = localStorage.getItem(key);
                if (rawData) {
                    try {
                        const notes = JSON.parse(rawData);
                        const hasEncryptedNotes = Object.values(notes).some(note => 
                            SecurityUtils.isNoteDataEncrypted ? SecurityUtils.isNoteDataEncrypted(note) : false
                        );
                        if (hasEncryptedNotes) encryptedNoteFiles++;
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            } else if (key.startsWith('offPlatform_')) {
                totalTimerFiles++;
                const rawData = localStorage.getItem(key);
                if (rawData && EncryptionService.isEncrypted(rawData)) {
                    encryptedTimerFiles++;
                }
            }
        }
        
        return {
            notes: {
                total: totalNoteFiles,
                encrypted: encryptedNoteFiles,
                migrationComplete: totalNoteFiles === 0 || encryptedNoteFiles === totalNoteFiles
            },
            timers: {
                total: totalTimerFiles,
                encrypted: encryptedTimerFiles,
                migrationComplete: totalTimerFiles === 0 || encryptedTimerFiles === totalTimerFiles
            },
            currentVersion: this.getCurrentMigrationVersion(),
            targetVersion: this.CURRENT_MIGRATION_VERSION
        };
    }

    /**
     * Force re-run migration (for debugging/recovery)
     */
    static async forceMigration() {
        this.setMigrationVersion(0);
        return await this.runMigrationIfNeeded();
    }
}