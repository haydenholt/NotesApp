/**
 * OffPlatformTimer class for tracking off-platform time with multiple timer types
 */
export class OffPlatformTimer {
    constructor() {
        // Initialize timers for each category
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
    
    // Start timer for a specific category
    startTimer(category) {
        if (!this.timers[category].startTime) {
            // Stop any other running timers first
            Object.keys(this.timers).forEach(otherCategory => {
                if (otherCategory !== category && this.timers[otherCategory].startTime) {
                    this.stopTimer(otherCategory);
                }
            });
            
            this.timers[category].startTime = Date.now();
            this.startDisplay(category);
            this.saveTimerState();
            this.triggerStartCallbacks(category);
            
            // Add active class to the time display for visual feedback
            if (this.displayElements[category]) {
                this.displayElements[category].classList.add('text-green-600');
            }
        }
    }
    
    // Stop timer for a specific category
    stopTimer(category) {
        if (this.timers[category].startTime) {
            // Add elapsed time to total
            const elapsedSeconds = Math.floor((Date.now() - this.timers[category].startTime) / 1000);
            this.timers[category].totalSeconds += elapsedSeconds;
            
            // Reset start time
            this.timers[category].startTime = null;
            
            // Stop display updates
            this.stopDisplay(category);
            
            // Save state
            this.saveTimerState();
            
            // Update total display
            this.updateTotalDisplay();
            
            // Execute UI callback
            this.triggerStopCallbacks(category);
            
            // Remove active class from the time display
            if (this.displayElements[category]) {
                this.displayElements[category].classList.remove('text-green-600');
            }
        }
    }
    
    // Edit timer value for a specific category
    editTimer(category, hours, minutes, seconds) {
        // Convert to total seconds
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        
        // Update the timer value
        if (this.timers[category]) {
            // If timer is running, stop it first to capture elapsed time
            const wasRunning = !!this.timers[category].startTime;
            if (wasRunning) {
                this.stopTimer(category);
            }
            
            // Set the new total
            this.timers[category].totalSeconds = totalSeconds;
            
            // Restart if it was running
            if (wasRunning) {
                this.startTimer(category);
            } else {
                // Just update the display
                this.updateDisplay(category);
                this.updateTotalDisplay();
            }
            
            // Save state
            this.saveTimerState();
            
            // Trigger edit callbacks
            this.triggerEditCallbacks(category);
        }
    }
    
    // Get seconds for a specific category
    getSeconds(category) {
        let seconds = this.timers[category].totalSeconds;
        
        // If timer is running, add current elapsed time
        if (this.timers[category].startTime) {
            const currentElapsed = Math.floor((Date.now() - this.timers[category].startTime) / 1000);
            seconds += currentElapsed;
        }
        
        return seconds;
    }
    
    // Get total seconds across all categories
    getTotalSeconds() {
        return Object.keys(this.timers).reduce((total, category) => {
            return total + this.getSeconds(category);
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
        Object.keys(this.timers).forEach(category => {
            this.stopTimer(category);
        });
    }
    
    // Save timer state to localStorage
    saveTimerState() {
        if (window.app) {
            const currentDate = window.app.currentDate;
            const offPlatformData = JSON.parse(localStorage.getItem(`offPlatform_${currentDate}`) || '{}');
            
            // Save current timer state
            offPlatformData.timers = {
                projectTraining: {
                    startTime: this.timers.projectTraining.startTime,
                    totalSeconds: this.timers.projectTraining.totalSeconds
                },
                sheetwork: {
                    startTime: this.timers.sheetwork.startTime,
                    totalSeconds: this.timers.sheetwork.totalSeconds
                },
                blocked: {
                    startTime: this.timers.blocked.startTime,
                    totalSeconds: this.timers.blocked.totalSeconds
                }
            };
            
            localStorage.setItem(`offPlatform_${currentDate}`, JSON.stringify(offPlatformData));
        }
    }
    
    // Load timer state from localStorage
    loadTimerState() {
        if (window.app) {
            const currentDate = window.app.currentDate;
            const offPlatformData = JSON.parse(localStorage.getItem(`offPlatform_${currentDate}`) || '{}');
            
            if (offPlatformData.timers) {
                // Preserve running timers from previous state
                const runningTimers = {};
                Object.keys(this.timers).forEach(category => {
                    if (this.timers[category].startTime) {
                        // Calculate and add elapsed time to the total before switching
                        const elapsedSeconds = Math.floor((Date.now() - this.timers[category].startTime) / 1000);
                        this.timers[category].totalSeconds += elapsedSeconds;
                        runningTimers[category] = true;
                    }
                });
                
                // Load saved timer state for the new date
                this.timers = offPlatformData.timers;
                
                // Restore running state for timers that were running before date change
                Object.keys(runningTimers).forEach(category => {
                    if (!this.timers[category].startTime) {
                        this.timers[category].startTime = Date.now();
                    }
                });
                
                // Restart display for running timers
                Object.keys(this.timers).forEach(category => {
                    if (this.timers[category].startTime) {
                        this.startDisplay(category);
                        this.triggerStartCallbacks(category);
                        
                        // Add active class to the time display
                        if (this.displayElements[category]) {
                            this.displayElements[category].classList.add('text-green-600');
                        }
                    } else {
                        this.updateDisplay(category);
                    }
                });
                
                this.updateTotalDisplay();
                this.saveTimerState();
            }
        }
    }
}

export default OffPlatformTimer; 