export class TimeFormatter {
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static calculateDuration(startTimestamp, endTimestamp, additionalTime = 0) {
        if (startTimestamp && endTimestamp) {
            const start = new Date(startTimestamp);
            const end = new Date(endTimestamp);
            const diff = end - start;
            const seconds = Math.floor(diff / 1000) + (additionalTime || 0);
            return this.formatTime(seconds);
        } else if (additionalTime) {
            return this.formatTime(additionalTime);
        }
        return '';
    }

    static parseTimeInput(hours, minutes, seconds) {
        const hrs = parseInt(hours) || 0;
        const mins = parseInt(minutes) || 0;
        const secs = parseInt(seconds) || 0;
        return (hrs * 3600) + (mins * 60) + secs;
    }

    static secondsToHMS(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return { hours, minutes, seconds: secs };
    }
}