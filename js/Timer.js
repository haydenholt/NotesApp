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

    getSeconds() {
        if (!this.startTimestamp) return 0;
        const end = this.endTimestamp || Date.now();
        return Math.floor((end - this.startTimestamp) / 1000);
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
        this.updateDisplay();
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
                localStorage.setItem(window.app.currentDate, JSON.stringify(savedNotes));
            }
        }
    }
}

export default Timer;