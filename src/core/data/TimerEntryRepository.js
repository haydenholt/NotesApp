/**
 * TimerEntryRepository - Manages off-platform timer entries in localStorage
 * Handles the new entry-based system while providing backward compatibility
 */
import { SecureStorage } from './SecureStorage.js';

export class TimerEntryRepository {
    static getEntriesKey(dateKey) {
        return `offPlatform_entries_${dateKey}`;
    }

    static getLegacyKey(dateKey) {
        return `offPlatform_${dateKey}`;
    }

    /**
     * Get entries for a specific date, migrating legacy data if needed
     */
    static async getEntries(dateKey) {
        try {
            const entriesKey = this.getEntriesKey(dateKey);
            const entriesData = await SecureStorage.getItem(entriesKey);
            
            if (entriesData) {
                // Return existing entry data
                return JSON.parse(entriesData);
            } else {
                // Check for legacy data and migrate if it exists
                const legacyEntries = await this.migrateLegacyData(dateKey);
                if (legacyEntries.length > 0) {
                    await this.saveEntries(dateKey, legacyEntries);
                    return legacyEntries;
                }
                
                // Return empty array if no data found
                return [];
            }
        } catch (error) {
            console.error('Error loading timer entries:', dateKey, error);
            return [];
        }
    }

    /**
     * Save entries for a specific date
     */
    static async saveEntries(dateKey, entries) {
        try {
            const entriesKey = this.getEntriesKey(dateKey);
            await SecureStorage.setItem(entriesKey, JSON.stringify(entries));
            return true;
        } catch (error) {
            console.error('Error saving timer entries:', dateKey, error);
            return false;
        }
    }

    /**
     * Add or update a specific entry
     */
    static async saveEntry(dateKey, entry) {
        const entries = await this.getEntries(dateKey);
        const existingIndex = entries.findIndex(e => e.id === entry.id);
        
        if (existingIndex >= 0) {
            entries[existingIndex] = { ...entry };
        } else {
            entries.push({ ...entry });
        }
        
        return await this.saveEntries(dateKey, entries);
    }

    /**
     * Remove an entry by ID
     */
    static async deleteEntry(dateKey, entryId) {
        const entries = await this.getEntries(dateKey);
        const filteredEntries = entries.filter(e => e.id !== entryId);
        return await this.saveEntries(dateKey, filteredEntries);
    }

    /**
     * Get total seconds for a date (for compatibility with PayAnalysis)
     */
    static async getTotalSecondsForDate(dateKey) {
        const entries = await this.getEntries(dateKey);
        return entries.reduce((total, entry) => {
            // Ensure we have valid numbers, default to 0 for any invalid values
            let entrySeconds = Number(entry.totalSeconds) || 0;
            
            // Add running time if timer is active
            if (entry.isRunning && entry.startTime) {
                const startTime = Number(entry.startTime) || Date.now();
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                if (!isNaN(elapsed) && elapsed >= 0) {
                    entrySeconds += elapsed;
                }
            }
            
            // Ensure entrySeconds is a valid number
            if (isNaN(entrySeconds) || entrySeconds < 0) {
                entrySeconds = 0;
            }
            
            return total + entrySeconds;
        }, 0);
    }

    /**
     * Get running entry for a date (if any)
     */
    static async getRunningEntry(dateKey) {
        const entries = await this.getEntries(dateKey);
        return entries.find(entry => entry.isRunning) || null;
    }

    /**
     * Stop all running entries for a date
     */
    static async stopAllRunningEntries(dateKey) {
        const entries = await this.getEntries(dateKey);
        let hasChanges = false;
        
        const updatedEntries = entries.map(entry => {
            if (entry.isRunning) {
                const elapsed = Math.floor((Date.now() - entry.startTime) / 1000);
                hasChanges = true;
                return {
                    ...entry,
                    isRunning: false,
                    totalSeconds: (entry.totalSeconds || 0) + elapsed,
                    endTime: Date.now(),
                    startTime: null
                };
            }
            return entry;
        });
        
        if (hasChanges) {
            await this.saveEntries(dateKey, updatedEntries);
        }
        
        return updatedEntries;
    }

    /**
     * Migrate legacy timer data to entry format
     */
    static async migrateLegacyData(dateKey) {
        try {
            const legacyKey = this.getLegacyKey(dateKey);
            const legacyData = await SecureStorage.getItem(legacyKey);
            
            if (!legacyData) {
                return [];
            }
            
            const parsedData = JSON.parse(legacyData);
            if (!parsedData.timers) {
                return [];
            }
            
            const entries = [];
            const categoryTitles = {
                projectTraining: 'Project Training',
                sheetwork: 'Sheet Work',
                blocked: 'Blocked from Working'
            };
            
            // Convert each legacy timer to an entry
            let migrationOffset = 0;
            Object.entries(parsedData.timers).forEach(([category, timer]) => {
                if (timer.totalSeconds > 0 || timer.startTime) {
                    // Give each legacy entry a slightly different timestamp to maintain order
                    const baseTime = Date.now() - 86400000; // Start from yesterday to clearly mark as legacy
                    const createdAt = baseTime + migrationOffset;
                    migrationOffset += 1000; // 1 second apart
                    
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
            

            return entries;
            
        } catch (error) {
            console.error('Error migrating legacy timer data:', dateKey, error);
            return [];
        }
    }

    /**
     * Generate a unique ID for new entries
     */
    static generateEntryId() {
        return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Create a new entry with default values
     */
    static createNewEntry(overrides = {}) {
        return {
            id: this.generateEntryId(),
            title: '',
            totalSeconds: 0,
            isRunning: false,
            startTime: null,
            endTime: null,
            createdAt: Date.now(),
            ...overrides
        };
    }

    /**
     * Check if legacy data exists for backward compatibility
     */
    static async hasLegacyData(dateKey) {
        const legacyKey = this.getLegacyKey(dateKey);
        const legacyData = await SecureStorage.getItem(legacyKey);
        return !!legacyData;
    }

    /**
     * For compatibility - get data in legacy format for PayAnalysis
     */
    static async getLegacyCompatibleData(dateKey) {
        const entries = await this.getEntries(dateKey);
        
        // If no entries, check for actual legacy data
        if (entries.length === 0) {
            const legacyKey = this.getLegacyKey(dateKey);
            const legacyData = await SecureStorage.getItem(legacyKey);
            if (legacyData) {
                return JSON.parse(legacyData);
            }
        }
        
        // Create legacy format from entries
        const legacyFormat = {
            timers: {
                projectTraining: { startTime: null, totalSeconds: 0 },
                sheetwork: { startTime: null, totalSeconds: 0 },
                blocked: { startTime: null, totalSeconds: 0 }
            }
        };
        
        // Sum up entries by their legacy category mappings
        entries.forEach(entry => {
            const title = entry.title?.toLowerCase() || '';
            let category = null;
            
            if (title.includes('project') && title.includes('training')) {
                category = 'projectTraining';
            } else if (title.includes('sheet')) {
                category = 'sheetwork';
            } else if (title.includes('blocked')) {
                category = 'blocked';
            }
            
            if (category) {
                let seconds = entry.totalSeconds || 0;
                if (entry.isRunning && entry.startTime) {
                    seconds += Math.floor((Date.now() - entry.startTime) / 1000);
                }
                legacyFormat.timers[category].totalSeconds += seconds;
                
                // If this entry is running, mark the category as running too
                if (entry.isRunning) {
                    legacyFormat.timers[category].startTime = entry.startTime;
                }
            }
        });
        
        return legacyFormat;
    }
}