export class DateUtils {
    static getCurrentDate() {
        return new Date().toLocaleDateString('sv-SE');
    }

    static formatDate(dateString) {
        const [yearStr, monthStr, dayStr] = dateString.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const day = parseInt(dayStr, 10);
        const date = new Date(year, month, day);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    static addDays(dateString, days) {
        const currentDate = new Date(dateString);
        currentDate.setDate(currentDate.getDate() + days);
        return currentDate.toISOString().split('T')[0];
    }

    static isValidDateKey(key) {
        return /^\d{4}-\d{2}-\d{2}$/.test(key);
    }

    static getAllDateKeys(localStorage) {
        const dateKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && this.isValidDateKey(key)) {
                dateKeys.push(key);
            }
        }
        return dateKeys.sort().reverse(); // newest first
    }
}