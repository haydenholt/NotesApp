/**
 * OffPlatformTimer class for tracking off-platform time with multiple timer types
 */
export class OffPlatformTimer {
    // Helper function to safely add/remove classes from getColor() results
    static safeClassListOperation(element, operation, colorString) {
        if (!element || !colorString) return;
        
        const classes = colorString.split(' ').filter(cls => cls.trim() !== '');
        if (classes.length > 0) {
            element.classList[operation](...classes);
        }
    }
    constructor(themeManager = null) {
        this.themeManager = themeManager;
        // Initialize base timer structure
        this.timers = {
            projectTraining: { startTime: null, totalSeconds: 0 },
            sheetwork: { startTime: null, totalSeconds: 0 },
            blocked: { startTime: null, totalSeconds: 0 }
        };
        
        this.displayElements = {
            projectTraining: null,
            sheetwork: null,
            blocked: null,
            total: null
        };
        
        this.updateIntervals = {
            projectTraining: null,
            sheetwork: null,
            blocked: null
        };
        
        // Add currentDate property
        this.currentDate = null;
        
        // Add callback hooks for UI updates
        this.onStartCallbacks = {};
        this.onStopCallbacks = {};
        this.onEditCallbacks = {}; // Add callbacks for edit events
        
        // Load active timers from localStorage or initialize empty object
        this.activeTimers = this.loadActiveTimersFromStorage();
    }
    
    // Load active timers from localStorage
    loadActiveTimersFromStorage() {
        try {
            const savedActiveTimers = localStorage.getItem('offPlatform_activeTimers');
            return savedActiveTimers ? JSON.parse(savedActiveTimers) : {};
        } catch (e) {
            console.error('Error loading active timers:', e);
            return {};
        }
    }
    
    // Save active timers to localStorage
    saveActiveTimersToStorage() {
        try {
            localStorage.setItem('offPlatform_activeTimers', JSON.stringify(this.activeTimers));
        } catch (e) {
            console.error('Error saving active timers:', e);
        }
    }
    
    // Register callbacks for UI updates when timer starts
    onStart(category, callback) {
        if (!this.onStartCallbacks[category]) {
            this.onStartCallbacks[category] = [];
        }
        this.onStartCallbacks[category].push(callback);
    }
    
    // Register callbacks for UI updates when timer stops
    onStop(category, callback) {
        if (!this.onStopCallbacks[category]) {
            this.onStopCallbacks[category] = [];
        }
        this.onStopCallbacks[category].push(callback);
    }
    
    // Register callbacks for UI updates when timer is edited
    onEdit(category, callback) {
        if (!this.onEditCallbacks[category]) {
            this.onEditCallbacks[category] = [];
        }
        this.onEditCallbacks[category].push(callback);
    }
    
    // Execute start callbacks
    triggerStartCallbacks(category) {
        if (this.onStartCallbacks[category]) {
            this.onStartCallbacks[category].forEach(callback => callback());
        }
    }
    
    // Execute stop callbacks
    triggerStopCallbacks(category) {
        if (this.onStopCallbacks[category]) {
            this.onStopCallbacks[category].forEach(callback => callback());
        }
    }
    
    // Execute edit callbacks
    triggerEditCallbacks(category) {
        if (this.onEditCallbacks[category]) {
            this.onEditCallbacks[category].forEach(callback => callback());
        }
    }
    
    // Get current date's timer data key
    getStorageKey() {
        return `offPlatform_${this.currentDate}`;
    }
    
    // Get fresh timer data for current date
    getTimerData() {
        const data = JSON.parse(localStorage.getItem(this.getStorageKey()) || '{}');
        if (!data.timers) {
            data.timers = {
                projectTraining: { startTime: null, totalSeconds: 0 },
                sheetwork: { startTime: null, totalSeconds: 0 },
                blocked: { startTime: null, totalSeconds: 0 }
            };
        }
        return data;
    }
    
    // Save timer data for current date
    saveTimerData(data) {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    }
    
    // Add timer start time to activeTimers and persist to localStorage
    addToActiveTimers(date, category, startTime) {
        if (!this.activeTimers[date]) {
            this.activeTimers[date] = {};
        }
        this.activeTimers[date][category] = startTime;
        this.saveActiveTimersToStorage();
    }
    
    // Remove timer from activeTimers and persist to localStorage
    removeFromActiveTimers(date, category) {
        if (this.activeTimers[date] && this.activeTimers[date][category]) {
            delete this.activeTimers[date][category];
            // Clean up empty date entries
            if (Object.keys(this.activeTimers[date]).length === 0) {
                delete this.activeTimers[date];
            }
            this.saveActiveTimersToStorage();
        }
    }
    
    // Start timer for a specific category
    startTimer(category) {
        // Get fresh timer data
        const data = this.getTimerData();
        
        // Only start if not already running
        if (!data.timers[category].startTime) {
            // Stop any other running timers first
            Object.keys(data.timers).forEach(otherCategory => {
                if (otherCategory !== category && data.timers[otherCategory].startTime) {
                    // We need to calculate and add the elapsed time
                    const elapsedSeconds = Math.floor((Date.now() - data.timers[otherCategory].startTime) / 1000);
                    data.timers[otherCategory].totalSeconds += elapsedSeconds;
                    data.timers[otherCategory].startTime = null;
                    
                    // Also clear any shouldBeRunning flags
                    if (data.timers[otherCategory].shouldBeRunning) {
                        delete data.timers[otherCategory].shouldBeRunning;
                    }
                    
                    // Remove from active timers
                    this.removeFromActiveTimers(this.currentDate, otherCategory);
                    
                    // Update UI for stopped timer
                    this.stopDisplay(otherCategory);
                    if (this.displayElements[otherCategory] && this.themeManager) {
                        OffPlatformTimer.safeClassListOperation(
                            this.displayElements[otherCategory], 
                            'remove', 
                            this.themeManager.getColor('timer', 'active')
                        );
                        this.displayElements[otherCategory].classList.remove('text-green-600'); // Fallback for old class
                    }
                    this.triggerStopCallbacks(otherCategory);
                }
            });
            
            // Start this timer
            const now = Date.now();
            data.timers[category].startTime = now;
            
            // Clear any existing shouldBeRunning flag
            if (data.timers[category].shouldBeRunning) {
                delete data.timers[category].shouldBeRunning;
            }
            
            // Track as active timer
            this.addToActiveTimers(this.currentDate, category, now);
            
            this.saveTimerData(data);
            
            // Update our in-memory state for UI updates
            this.timers = data.timers;
            
            // Update UI
            this.startDisplay(category);
            this.triggerStartCallbacks(category);
            
            // Add active class to the time display
            if (this.displayElements[category]) {
                if (this.themeManager) {
                    // Remove inactive color and add active color
                    OffPlatformTimer.safeClassListOperation(
                        this.displayElements[category], 
                        'remove', 
                        this.themeManager.getColor('text', 'primary')
                    );
                    OffPlatformTimer.safeClassListOperation(
                        this.displayElements[category], 
                        'add', 
                        this.themeManager.getColor('timer', 'active')
                    );
                } else {
                    this.displayElements[category].classList.remove('text-gray-900');
                    this.displayElements[category].classList.add('text-green-600');
                }
            }
        }
    }
    
    // Stop timer for a specific category
    stopTimer(category) {
        // Get fresh timer data
        const data = this.getTimerData();
        
        if (data.timers[category].startTime) {
            // Calculate elapsed time
            const elapsedSeconds = Math.floor((Date.now() - data.timers[category].startTime) / 1000);
            data.timers[category].totalSeconds += elapsedSeconds;
            data.timers[category].startTime = null;
            
            // Clear any shouldBeRunning flag
            if (data.timers[category].shouldBeRunning) {
                delete data.timers[category].shouldBeRunning;
            }
            
            // Remove from active timers
            this.removeFromActiveTimers(this.currentDate, category);
            
            // Save updated data
            this.saveTimerData(data);
            
            // Update our in-memory state
            this.timers = data.timers;
            
            // Update UI
            this.stopDisplay(category);
            this.updateDisplay(category);
            this.updateTotalDisplay();
            this.triggerStopCallbacks(category);
            
            // Remove active class from time display
            if (this.displayElements[category]) {
                if (this.themeManager) {
                    // Remove active color and add inactive color
                    OffPlatformTimer.safeClassListOperation(
                        this.displayElements[category], 
                        'remove', 
                        this.themeManager.getColor('timer', 'active')
                    );
                    OffPlatformTimer.safeClassListOperation(
                        this.displayElements[category], 
                        'add', 
                        this.themeManager.getColor('text', 'primary')
                    );
                } else {
                    this.displayElements[category].classList.remove('text-green-600');
                    this.displayElements[category].classList.add('text-gray-900');
                }
            }
        }
    }
    
    // Edit timer value for a specific category
    editTimer(category, hours, minutes, seconds) {
        // Convert to total seconds
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        
        // Get fresh timer data
        const data = this.getTimerData();
        
        // Check if timer is running
        const wasRunning = !!data.timers[category].startTime;
        
        // Stop if running
        if (wasRunning) {
            // Calculate elapsed time
            const elapsedSeconds = Math.floor((Date.now() - data.timers[category].startTime) / 1000);
            data.timers[category].totalSeconds += elapsedSeconds;
            data.timers[category].startTime = null;
            
            // Remove from active timers since we're resetting it
            this.removeFromActiveTimers(this.currentDate, category);
        }
        
        // Set new total
        data.timers[category].totalSeconds = totalSeconds;
        
        // Restart if was running
        if (wasRunning) {
            const now = Date.now();
            data.timers[category].startTime = now;
            
            // Update active timers
            this.addToActiveTimers(this.currentDate, category, now);
        }
        
        // Save updated data
        this.saveTimerData(data);
        
        // Update our in-memory state
        this.timers = data.timers;
        
        // Update UI
        if (wasRunning) {
            this.startDisplay(category);
        } else {
            this.updateDisplay(category);
        }
        this.updateTotalDisplay();
        this.triggerEditCallbacks(category);
    }
    
    // Get seconds for a specific category
    getSeconds(category) {
        // Get fresh timer data
        const data = this.getTimerData();
        let seconds = data.timers[category].totalSeconds;
        
        // If timer is running on current date, add current elapsed time
        if (data.timers[category].startTime) {
            const currentElapsed = Math.floor((Date.now() - data.timers[category].startTime) / 1000);
            seconds += currentElapsed;
        }
        
        return seconds;
    }
    
    // Get total seconds across all categories
    getTotalSeconds() {
        // Get fresh timer data
        const data = this.getTimerData();
        
        return Object.keys(data.timers).reduce((total, category) => {
            let categorySeconds = data.timers[category].totalSeconds;
            
            // Add running time if applicable
            if (data.timers[category].startTime) {
                const currentElapsed = Math.floor((Date.now() - data.timers[category].startTime) / 1000);
                categorySeconds += currentElapsed;
            }
            
            return total + categorySeconds;
        }, 0);
    }
    
    // Get the total accumulated time for a category across all dates
    getTotalSecondsForCategory(category) {
        // First get seconds for the current date
        let seconds = this.getSeconds(category);
        
        // Add time from active timers on other dates if applicable
        if (this.activeTimers) {
            for (const date in this.activeTimers) {
                if (date !== this.currentDate && 
                    this.activeTimers[date] && 
                    this.activeTimers[date][category]) {
                    
                    const startTime = this.activeTimers[date][category];
                    const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
                    seconds += currentElapsed;
                }
            }
        }
        
        return seconds;
    }
    
    // Get the total accumulated time across all categories and all dates
    getGrandTotalSeconds() {
        let total = 0;
        
        // Add up all category totals
        for (const category in this.timers) {
            total += this.getTotalSecondsForCategory(category);
        }
        
        return total;
    }
    
    // Format seconds as HH:MM:SS
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    // Parse time string (HH:MM:SS) to seconds
    parseTimeString(timeString) {
        const parts = timeString.split(':').map(part => parseInt(part, 10));
        if (parts.length === 3) {
            return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        }
        return 0;
    }
    
    // Start display updates for a category
    startDisplay(category) {
        this.stopDisplay(category);
        
        this.updateIntervals[category] = setInterval(() => {
            this.updateDisplay(category);
            this.updateTotalDisplay();
        }, 1000);
        
        this.updateDisplay(category);
        this.updateTotalDisplay();
    }
    
    // Stop display updates for a category
    stopDisplay(category) {
        if (this.updateIntervals[category]) {
            clearInterval(this.updateIntervals[category]);
            this.updateIntervals[category] = null;
        }
    }
    
    // Update display for a specific category
    updateDisplay(category) {
        if (this.displayElements[category]) {
            this.displayElements[category].textContent = this.formatTime(this.getSeconds(category));
        }
    }
    
    // Update total time display
    updateTotalDisplay() {
        if (this.displayElements.total) {
            this.displayElements.total.textContent = this.formatTime(this.getGrandTotalSeconds());
        }
    }
    
    // Stop all timers
    stopAllTimers() {
        // Get fresh timer data
        const data = this.getTimerData();
        
        // First stop timers on the current date
        Object.keys(data.timers).forEach(category => {
            if (data.timers[category].startTime) {
                // Calculate elapsed time
                const elapsedSeconds = Math.floor((Date.now() - data.timers[category].startTime) / 1000);
                data.timers[category].totalSeconds += elapsedSeconds;
                data.timers[category].startTime = null;
                
                // Clear any shouldBeRunning flag
                if (data.timers[category].shouldBeRunning) {
                    delete data.timers[category].shouldBeRunning;
                }
                
                // Remove from active timers
                this.removeFromActiveTimers(this.currentDate, category);
                
                // Update UI
                this.stopDisplay(category);
                if (this.displayElements[category]) {
                    if (this.themeManager) {
                        OffPlatformTimer.safeClassListOperation(
                            this.displayElements[category], 
                            'remove', 
                            this.themeManager.getColor('timer', 'active')
                        );
                        OffPlatformTimer.safeClassListOperation(
                            this.displayElements[category], 
                            'add', 
                            this.themeManager.getColor('text', 'primary')
                        );
                    } else {
                        this.displayElements[category].classList.remove('text-green-600');
                        this.displayElements[category].classList.add('text-gray-900');
                    }
                }
            }
        });
        
        // Also handle timers running on other dates
        for (const date in this.activeTimers) {
            if (date !== this.currentDate && Object.keys(this.activeTimers[date]).length > 0) {
                const oldDate = this.currentDate;
                
                // Temporarily switch date to update timers
                this.currentDate = date;
                const dateData = this.getTimerData();
                
                // Update each running timer for this date
                for (const category in this.activeTimers[date]) {
                    const startTime = this.activeTimers[date][category];
                    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                    
                    // Add elapsed time to timer's total
                    dateData.timers[category].totalSeconds += elapsedSeconds;
                    dateData.timers[category].startTime = null;
                    
                    // Clear any shouldBeRunning flag
                    if (dateData.timers[category].shouldBeRunning) {
                        delete dateData.timers[category].shouldBeRunning;
                    }
                    
                    // Remove from active timers
                    this.removeFromActiveTimers(date, category);
                }
                
                // Save updated data for this date
                this.saveTimerData(dateData);
                
                // Switch back to original date
                this.currentDate = oldDate;
            }
        }
        
        // Clear all active timers (just in case any remain)
        this.activeTimers = {};
        this.saveActiveTimersToStorage();
        
        // Save updated data for current date
        this.saveTimerData(data);
        
        // Update our in-memory state
        this.timers = data.timers;
        
        // Update total display
        this.updateTotalDisplay();
    }
    
    // Save timer state to localStorage
    saveTimerState() {
        // Get fresh timer data
        const data = this.getTimerData();
        
        // For any running timers, add elapsed time to total and mark them as "shouldBeRunning"
        Object.keys(data.timers).forEach(category => {
            if (data.timers[category].startTime) {
                // Store the actual start time in activeTimers
                this.addToActiveTimers(this.currentDate, category, data.timers[category].startTime);
                
                // Mark as shouldBeRunning for backward compatibility
                data.timers[category].shouldBeRunning = true;
                
                // Important: Don't add elapsed time to totalSeconds here, as we want to count continuously
                // The timer is now paused in this date's storage, but running in activeTimers
                data.timers[category].startTime = null; // Temporarily stop timer in storage
            }
        });
        
        // Save updated data
        this.saveTimerData(data);
        
        // Update our in-memory state
        this.timers = data.timers;
    }
    
    // Load timer state from localStorage
    loadTimerState() {
        if (this.currentDate) {
            // Stop all display intervals
            Object.keys(this.updateIntervals).forEach(category => {
                if (this.updateIntervals[category]) {
                    clearInterval(this.updateIntervals[category]);
                    this.updateIntervals[category] = null;
                }
            });
            
            // Get fresh timer data for current date
            const data = this.getTimerData();
            
            // Before loading the new state, update any active timers for the current date
            // to store their accumulated time
            if (this.activeTimers[this.currentDate]) {
                Object.keys(this.activeTimers[this.currentDate]).forEach(category => {
                    const startTime = this.activeTimers[this.currentDate][category];
                    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                    
                    // Add the elapsed time to the total
                    data.timers[category].totalSeconds += elapsedSeconds;
                    
                    // Update the shouldBeRunning flag
                    data.timers[category].shouldBeRunning = true;
                });
                
                // Save the updated data
                this.saveTimerData(data);
            }
            
            // Update in-memory state
            this.timers = JSON.parse(JSON.stringify(data.timers));
            
            // Update UI for all timers
            Object.keys(this.timers).forEach(category => {
                // Reset any UI indicators
                if (this.displayElements[category]) {
                    if (this.themeManager) {
                        OffPlatformTimer.safeClassListOperation(
                            this.displayElements[category], 
                            'remove', 
                            this.themeManager.getColor('timer', 'active')
                        );
                        OffPlatformTimer.safeClassListOperation(
                            this.displayElements[category], 
                            'add', 
                            this.themeManager.getColor('text', 'primary')
                        );
                    } else {
                        this.displayElements[category].classList.remove('text-green-600');
                        this.displayElements[category].classList.add('text-gray-900');
                    }
                }
                
                // Check if this timer should be running based on previous state
                if (this.timers[category].shouldBeRunning) {
                    // Restart the timer with the current time
                    const now = Date.now();
                    this.timers[category].startTime = now;
                    data.timers[category].startTime = now;
                    delete this.timers[category].shouldBeRunning;
                    delete data.timers[category].shouldBeRunning;
                    
                    // Track as active timer
                    this.addToActiveTimers(this.currentDate, category, now);
                    
                    this.saveTimerData(data);
                    
                    // Start display updates for running timers
                    this.startDisplay(category);
                    
                    // Add active class to the time display
                    if (this.displayElements[category]) {
                        if (this.themeManager) {
                            OffPlatformTimer.safeClassListOperation(
                                this.displayElements[category], 
                                'remove', 
                                this.themeManager.getColor('text', 'primary')
                            );
                            OffPlatformTimer.safeClassListOperation(
                                this.displayElements[category], 
                                'add', 
                                this.themeManager.getColor('timer', 'active')
                            );
                        } else {
                            this.displayElements[category].classList.remove('text-gray-900');
                            this.displayElements[category].classList.add('text-green-600');
                        }
                    }
                    
                    // Trigger callbacks
                    this.triggerStartCallbacks(category);
                } else {
                    // Just update display for non-running timers
                    this.updateDisplay(category);
                    
                    // Always trigger stop callbacks for non-running timers to ensure UI is reset
                    this.triggerStopCallbacks(category);
                }
            });
            
            // Update total display
            this.updateTotalDisplay();
        }
    }
}

export default OffPlatformTimer; 