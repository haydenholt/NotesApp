/**
 * OffPlatformTimer class for tracking off-platform time with multiple timer types
 */
export class OffPlatformTimer {
    constructor() {
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
                    
                    // Update UI for stopped timer
                    this.stopDisplay(otherCategory);
                    if (this.displayElements[otherCategory]) {
                        this.displayElements[otherCategory].classList.remove('text-green-600');
                    }
                    this.triggerStopCallbacks(otherCategory);
                }
            });
            
            // Start this timer
            data.timers[category].startTime = Date.now();
            
            // Clear any existing shouldBeRunning flag
            if (data.timers[category].shouldBeRunning) {
                delete data.timers[category].shouldBeRunning;
            }
            
            this.saveTimerData(data);
            
            // Update our in-memory state for UI updates
            this.timers = data.timers;
            
            // Update UI
            this.startDisplay(category);
            this.triggerStartCallbacks(category);
            
            // Add active class to the time display
            if (this.displayElements[category]) {
                this.displayElements[category].classList.add('text-green-600');
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
                this.displayElements[category].classList.remove('text-green-600');
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
        }
        
        // Set new total
        data.timers[category].totalSeconds = totalSeconds;
        
        // Restart if was running
        if (wasRunning) {
            data.timers[category].startTime = Date.now();
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
        
        // If timer is running, add current elapsed time
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
            this.displayElements.total.textContent = this.formatTime(this.getTotalSeconds());
        }
    }
    
    // Stop all timers
    stopAllTimers() {
        // Get fresh timer data
        const data = this.getTimerData();
        
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
                
                // Update UI
                this.stopDisplay(category);
                if (this.displayElements[category]) {
                    this.displayElements[category].classList.remove('text-green-600');
                }
            }
        });
        
        // Save updated data
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
                const elapsedSeconds = Math.floor((Date.now() - data.timers[category].startTime) / 1000);
                data.timers[category].totalSeconds += elapsedSeconds;
                // Instead of stopping the timer, mark it as "shouldBeRunning" for this date
                data.timers[category].shouldBeRunning = true;
                data.timers[category].startTime = null; // Temporarily stop timer
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
            
            // Update in-memory state
            this.timers = JSON.parse(JSON.stringify(data.timers));
            
            // Update UI for all timers
            Object.keys(this.timers).forEach(category => {
                // Reset any UI indicators
                if (this.displayElements[category]) {
                    this.displayElements[category].classList.remove('text-green-600');
                }
                
                // Check if this timer should be running based on previous state
                if (this.timers[category].shouldBeRunning) {
                    // Restart the timer
                    this.timers[category].startTime = Date.now();
                    data.timers[category].startTime = Date.now();
                    delete this.timers[category].shouldBeRunning;
                    delete data.timers[category].shouldBeRunning;
                    this.saveTimerData(data);
                    
                    // Start display updates for running timers
                    this.startDisplay(category);
                    
                    // Add active class to the time display
                    if (this.displayElements[category]) {
                        this.displayElements[category].classList.add('text-green-600');
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