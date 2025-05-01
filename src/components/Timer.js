/**
 * Timer class for tracking time spent on notes
 */
export class Timer {
    constructor(startTimestamp = null, endTimestamp = null) {
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
        this.displayInterval = null;
        this.displayElement = null;
        this.noteId = null;
        this.additionalTime = 0; // Store additional time from previous sessions
        this.completed = false; // Add a property to track completion status
    }

    start() {
        if (!this.startTimestamp) {
            this.startTimestamp = Date.now();
            this.endTimestamp = null;
            this.startDisplay();
            this.saveState();
        }
    }

    stop() {
        if (this.startTimestamp && !this.endTimestamp) {
            this.endTimestamp = Date.now();
            this.stopDisplay();
            this.saveState();
        }
    }

    // New method to restart a timer that was previously stopped
    restart() {
        if (!this.startTimestamp) {
            this.start();
            return
        } 

        // Calculate time spent in previous session and add to additionalTime
        this.additionalTime = Math.floor(this.additionalTime + Math.floor((this.endTimestamp - this.startTimestamp) / 1000));

        // Reset timestamps for new session
        this.startTimestamp = Date.now();
        this.endTimestamp = null;
        this.startDisplay();
        this.saveState();
    }

    getSeconds() {
        if (!this.startTimestamp) return 0;
        
        const currentTime = this.endTimestamp || Date.now();

        const sessionTime = Math.floor((currentTime - this.startTimestamp) / 1000);
        // Include time from previous sessions
        return sessionTime + this.additionalTime;

    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    startDisplay() {
        this.stopDisplay();
        this.displayInterval = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    stopDisplay() {
        if (this.displayInterval) {
            clearInterval(this.displayInterval);
            this.displayInterval = null;
        }
    }

    updateDisplay() {
        if (this.displayElement) {
            this.displayElement.textContent = this.formatTime(this.getSeconds());
        }
    }

    saveState() {
        if (this.noteId && window.app) {
            const savedNotes = JSON.parse(localStorage.getItem(window.app.currentDate) || '{}');
            if (savedNotes[this.noteId]) {
                savedNotes[this.noteId].startTimestamp = this.startTimestamp;
                savedNotes[this.noteId].endTimestamp = this.endTimestamp;
                savedNotes[this.noteId].additionalTime = this.additionalTime; // Save additional time
                savedNotes[this.noteId].completed = this.completed; // Save completion status
                localStorage.setItem(window.app.currentDate, JSON.stringify(savedNotes));
            }
        }
    }
}

export default Timer;