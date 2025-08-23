import { DOMHelpers } from '../../core/utils/DOMHelpers.js';
import { OffPlatformEntry } from './OffPlatformEntry.js';

/**
 * OffPlatformEntryList - Manages a list of off-platform timer entries
 * Handles creation, deletion, and coordination between entries
 */
export class OffPlatformEntryList {
    constructor(themeManager, callbacks = {}) {
        this.themeManager = themeManager;
        this.callbacks = callbacks;
        
        this.entries = new Map(); // id -> OffPlatformEntry
        this.container = null;
        this.entriesContainer = null;
        this.addButton = null;
        this.totalDisplay = null;
        this.totalUpdateInterval = null;
        
        this.render();
        this.setupEventListeners();
        this.startTotalUpdateInterval();
    }

    render() {
        this.container = DOMHelpers.createElement('div', 'space-y-4');

        // Header with add button and total
        const header = DOMHelpers.createElement('div', 'flex justify-between items-center mb-4');
        
        const title = DOMHelpers.createElement('h2',
            this.themeManager.combineClasses(
                'text-lg font-semibold',
                this.themeManager.getColor('text', 'secondary')
            ),
            'Off-platform time'
        );

        const headerRight = DOMHelpers.createElement('div', 'flex items-center gap-3');

        // Total time display
        this.totalDisplay = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'font-mono text-base',
                this.themeManager.getColor('text', 'primary')
            ),
            '00:00:00'
        );

        // Start/Stop timer button
        this.addButton = DOMHelpers.createButton(
            'Start Timer',
            this.themeManager.combineClasses(
                'flex items-center gap-2',
                this.themeManager.getButtonClasses('success', 'md')
            ),
            () => this.handleStartStopButton()
        );

        headerRight.appendChild(this.totalDisplay);
        headerRight.appendChild(this.addButton);
        header.appendChild(title);
        header.appendChild(headerRight);

        // Entries container - single column for compact display
        this.entriesContainer = DOMHelpers.createElement('div', 'space-y-2');

        // Empty state message
        const emptyMessage = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'text-center py-12 rounded-lg border border-dashed',
                this.themeManager.getColor('border', 'light'),
                this.themeManager.getColor('text', 'muted')
            ),
            'No timer entries yet.'
        );
        emptyMessage.className += ' empty-state';

        this.entriesContainer.appendChild(emptyMessage);

        this.container.appendChild(header);
        this.container.appendChild(this.entriesContainer);
    }

    setupEventListeners() {
        // Theme change listener
        document.addEventListener('themeChanged', () => {
            this.updateTheme();
        });
    }

    handleStartStopButton() {
        const runningEntry = this.getRunningEntry();
        
        if (runningEntry) {
            // Stop the running timer
            runningEntry.entry.stopTimer();
        } else {
            // Start a new timer
            this.addNewEntry();
        }
    }

    addNewEntry(entryData = null) {
        const newEntryData = entryData || {
            id: this.generateId(),
            title: '',
            totalSeconds: 0,
            isRunning: false,
            startTime: null,
            endTime: null,
            createdAt: Date.now()
        };

        // Ensure totalSeconds is always a number, not null
        if (newEntryData.totalSeconds === null || newEntryData.totalSeconds === undefined) {
            newEntryData.totalSeconds = 0;
        }

        // If no existing data, start the timer immediately
        if (!entryData) {
            newEntryData.isRunning = true;
            newEntryData.startTime = Date.now();
            
            // Stop any other running entries
            this.stopAllRunningEntries();
        }

        const entry = new OffPlatformEntry(newEntryData, this.themeManager, {
            entryStarted: (data) => this.handleEntryStarted(data),
            entryStopped: (data) => this.handleEntryStopped(data),
            entryUpdated: (data) => this.handleEntryUpdated(data),
            entryDeleted: (data) => this.handleEntryDeleted(data)
        });

        this.entries.set(newEntryData.id, entry);
        this.addEntryToDOM(entry);
        this.updateTotalDisplay();
        this.updateButtonState();
        this.toggleEmptyState();

        // Notify parent about the new entry
        this.notifyCallback('entryAdded', newEntryData);

        return entry;
    }

    removeEntry(entryId) {
        const entry = this.entries.get(entryId);
        if (entry) {
            entry.cleanup();
            this.entries.delete(entryId);
            this.updateTotalDisplay();
            this.toggleEmptyState();
        }
    }

    addEntryToDOM(entry) {
        // Remove empty state if it exists
        const emptyState = this.entriesContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Find the correct position to maintain chronological order
        const entryElements = Array.from(this.entriesContainer.children);
        const entryCreatedAt = entry.entryData.createdAt || 0;
        
        let insertPosition = null;
        
        if (entry.entryData.isRunning) {
            // Running timers: find position among other running timers (newest first)
            for (const element of entryElements) {
                const elementEntry = this.getEntryByElement(element);
                if (elementEntry && elementEntry.entryData.isRunning) {
                    if (entryCreatedAt > (elementEntry.entryData.createdAt || 0)) {
                        insertPosition = element;
                        break;
                    }
                } else {
                    // Found first non-running entry, insert before it
                    insertPosition = element;
                    break;
                }
            }
        } else {
            // Finished timers: find position among other finished timers (newest first)
            for (const element of entryElements) {
                const elementEntry = this.getEntryByElement(element);
                if (elementEntry && !elementEntry.entryData.isRunning) {
                    if (entryCreatedAt > (elementEntry.entryData.createdAt || 0)) {
                        insertPosition = element;
                        break;
                    }
                }
            }
        }
        
        if (insertPosition) {
            this.entriesContainer.insertBefore(entry.getElement(), insertPosition);
        } else {
            this.entriesContainer.appendChild(entry.getElement());
        }
    }

    getEntryByElement(element) {
        for (const [id, entry] of this.entries) {
            if (entry.getElement() === element) {
                return entry;
            }
        }
        return null;
    }

    loadEntries(entriesData) {
        // Clear existing entries
        this.clearAllEntries();

        // Sort entries by creation time (newest first, like most messaging apps)
        const sortedEntries = [...entriesData].sort((a, b) => {
            return (b.createdAt || 0) - (a.createdAt || 0);
        });

        // Load entries from data in chronological order
        sortedEntries.forEach(entryData => {
            this.addNewEntry(entryData);
        });

        this.updateTotalDisplay();
        this.updateButtonState();
    }

    clearAllEntries() {
        this.entries.forEach(entry => entry.cleanup());
        this.entries.clear();
        this.entriesContainer.textContent = '';
        this.toggleEmptyState();
    }

    stopAllRunningEntries() {
        this.entries.forEach(entry => {
            if (entry.entryData.isRunning) {
                entry.stopTimer();
            }
        });
    }

    handleEntryStarted(entryData) {
        // Stop all other running entries
        this.entries.forEach((entry, id) => {
            if (id !== entryData.id && entry.entryData.isRunning) {
                entry.stopTimer();
            }
        });

        this.updateTotalDisplay();
        this.updateButtonState();
        this.notifyCallback('entryStarted', entryData);
    }

    handleEntryStopped(entryData) {
        this.updateTotalDisplay();
        this.updateButtonState();
        this.notifyCallback('entryStopped', entryData);
    }

    handleEntryUpdated(entryData) {
        this.updateTotalDisplay();
        this.notifyCallback('entryUpdated', entryData);
    }

    handleEntryDeleted(entryData) {
        this.removeEntry(entryData.id);
        this.updateButtonState();
        this.notifyCallback('entryDeleted', entryData);
    }

    updateButtonState() {
        const runningEntry = this.getRunningEntry();
        
        if (runningEntry) {
            // Change to Stop button
            this.addButton.textContent = 'Stop Timer';
            this.addButton.className = this.themeManager.combineClasses(
                'flex items-center gap-2',
                this.themeManager.getButtonClasses('danger', 'md')
            );
        } else {
            // Change to Start button
            this.addButton.textContent = 'Start Timer';
            this.addButton.className = this.themeManager.combineClasses(
                'flex items-center gap-2',
                this.themeManager.getButtonClasses('success', 'md')
            );
        }
    }

    updateTotalDisplay() {
        if (this.totalDisplay) {
            const totalSeconds = this.getTotalSeconds();
            this.totalDisplay.textContent = this.formatTime(totalSeconds);
        }
    }

    startTotalUpdateInterval() {
        // Update total every second to show running timer progress
        this.totalUpdateInterval = setInterval(() => {
            this.updateTotalDisplay();
            // Also update sticky timer if there's a running entry
            const runningEntry = this.getRunningEntry();
            if (runningEntry && this.callbacks.stickyTimerUpdate) {
                const timeText = runningEntry.timeText;
                this.callbacks.stickyTimerUpdate(runningEntry.id, timeText);
            }
        }, 1000);
    }

    stopTotalUpdateInterval() {
        if (this.totalUpdateInterval) {
            clearInterval(this.totalUpdateInterval);
            this.totalUpdateInterval = null;
        }
    }

    toggleEmptyState() {
        const hasEntries = this.entries.size > 0;
        let emptyState = this.entriesContainer.querySelector('.empty-state');

        if (!hasEntries && !emptyState) {
            // Show empty state
            emptyState = DOMHelpers.createElement('div',
                this.themeManager.combineClasses(
                    'text-center py-12 rounded-lg',
                    this.themeManager.getColor('border', 'light'),
                    this.themeManager.getColor('text', 'muted')
                ),
                'No timer entries yet.'
            );
            emptyState.className += ' empty-state';
            this.entriesContainer.appendChild(emptyState);
        } else if (hasEntries && emptyState) {
            // Remove empty state
            emptyState.remove();
        }
    }

    getTotalSeconds() {
        let total = 0;
        this.entries.forEach(entry => {
            total += entry.getTotalSeconds();
        });
        return total;
    }

    getRunningEntry() {
        for (const [id, entry] of this.entries) {
            if (entry.entryData.isRunning) {
                return {
                    id,
                    entry,
                    title: entry.entryData.title || 'Untitled Entry',
                    timeText: entry.formatTime(entry.getTotalSeconds())
                };
            }
        }
        return null;
    }

    getAllEntries() {
        return Array.from(this.entries.values()).map(entry => entry.getEntryData());
    }

    saveAllEntriesToController(callback) {
        const entries = this.getAllEntries();
        if (callback && typeof callback === 'function') {
            callback(entries);
        }
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    generateId() {
        return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    updateTheme() {
        // Re-render the container
        const oldContainer = this.container;
        this.render();
        
        // Re-add existing entries with new theme
        const entriesData = this.getAllEntries();
        this.loadEntries(entriesData);
        
        if (oldContainer && oldContainer.parentNode) {
            oldContainer.parentNode.replaceChild(this.container, oldContainer);
        }
    }

    notifyCallback(event, data) {
        if (this.callbacks[event] && typeof this.callbacks[event] === 'function') {
            try {
                this.callbacks[event](data);
            } catch (error) {
                console.error(`Error in OffPlatformEntryList ${event} callback:`, error);
            }
        }
    }

    getContainer() {
        return this.container;
    }

    show() {
        if (this.container) {
            this.container.style.display = '';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    cleanup() {
        this.stopTotalUpdateInterval();
        this.clearAllEntries();
    }
}

export default OffPlatformEntryList;