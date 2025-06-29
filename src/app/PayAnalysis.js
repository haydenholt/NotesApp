import OffPlatformTimer from './OffPlatformTimer.js';

export class PayAnalysis {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.calendarContainer = document.getElementById('calendarContainer');
        this.reportContainer = document.getElementById('payReportContainer');
        this.selectedMonday = null;
        this.ratePerHour = 60;
        this.init();
    }

    init() {
        if (this.calendarContainer) {
            this.renderCalendar();
        }
        // Select the current week on load
        this.selectDate(new Date());
        
        // Listen for theme changes and re-render
        document.addEventListener('themeChanged', () => {
            if (this.calendarContainer) {
                this.renderCalendar();
            }
            if (this.selectedMonday) {
                this.generateReport();
            }
        });
    }

    generateReport() {
        if (!this.selectedMonday) return;
        const [year, month, day] = this.selectedMonday.split('-').map(Number);
        const monday = new Date(year, month - 1, day);
        const reportRows = [];
        let totalOnSeconds = 0;
        let totalOffSeconds = 0;
        let totalTasks = 0;
        const now = Date.now();

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateKey = date.toLocaleDateString('sv-SE');

            const onSeconds = this.getOnSecondsForDate(dateKey, now);
            const offSeconds = this.getOffSecondsForDate(dateKey);
            const tasksCount = this.getCompletedCountForDate(dateKey);
            totalTasks += tasksCount;

            totalOnSeconds += onSeconds;
            totalOffSeconds += offSeconds;

            reportRows.push({ 
                date: dateKey, 
                onSeconds, 
                offSeconds,
                dayName: date.toLocaleDateString('en-US', { weekday: 'long' })
            });
        }

        const grandTotalSeconds = totalOnSeconds + totalOffSeconds;
        const totalHours = grandTotalSeconds / 3600;
        const payAmount = (totalHours * this.ratePerHour).toFixed(2);
    

        // Balanced summary cards with subtle color accents
        let html = `<div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-4 rounded-md shadow-sm border-l-2 ${this.themeManager.getColor('border', 'primary')}">
                <div class="text-xs uppercase text-gray-400 tracking-wider">Total Hours</div>
                <div class="flex items-end mt-1">
                    <span class="text-2xl font-light text-gray-800">${(grandTotalSeconds / 3600).toFixed(1)}</span>
                    <span class="ml-1 text-sm text-gray-500">hours</span>
                </div>
            </div>
            <div class="bg-white p-4 rounded-md shadow-sm border-l-2 border-emerald-300">
                <div class="text-xs uppercase text-gray-400 tracking-wider">Total Pay</div>
                <div class="flex items-end mt-1">
                    <span class="text-2xl font-light text-gray-800">$${payAmount}</span>
                    <span class="ml-1 text-sm text-gray-500">USD</span>
                </div>
            </div>
            <div class="bg-white p-4 rounded-md shadow-sm border-l-2 border-indigo-300">
                <div class="text-xs uppercase text-gray-400 tracking-wider">Tasks Completed</div>
                <div class="flex items-end mt-1">
                    <span class="text-2xl font-light text-gray-800">${totalTasks}</span>
                    <span class="ml-1 text-sm text-gray-500">tasks</span>
                </div>
            </div>
        </div>`;
        
        // Main report with balanced styling
        const tableClasses = this.themeManager.getTableClasses();
        const cardClass = this.themeManager.getCardClasses('large');
        
        html += `<div class="${cardClass}">
            <h3 class="${tableClasses.title}">
                Week of ${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            
            <div class="overflow-x-auto">
                <table class="${tableClasses.table}">
                    <thead>
                        <tr class="${tableClasses.headerRow}">
                            <th class="${tableClasses.headerCell}">Day</th>
                            <th class="${tableClasses.headerCell}">Date</th>
                            <th class="${tableClasses.headerCell}">On-platform</th>
                            <th class="${tableClasses.headerCell}">Off-platform</th>
                            <th class="${tableClasses.headerCell}">Total</th>
                        </tr>
                    </thead>
                    <tbody>`;

        reportRows.forEach((row, index) => {
            const onTime = this.formatTime(row.onSeconds);
            const offTime = this.formatTime(row.offSeconds);
            const totalSeconds = row.onSeconds + row.offSeconds;
            const totalTime = this.formatTime(totalSeconds);
            const isDayOff = index >= 2 && index <= 4; // Wed, Thu, Fri
            
            const rowClass = isDayOff ? 
                this.themeManager.combineClasses(tableClasses.bodyRow, this.themeManager.getColor('calendar', 'dayOff')) :
                tableClasses.bodyRow;
            
            html += `<tr class="${rowClass}">
                <td class="${tableClasses.bodyCell} font-medium">${row.dayName}</td>
                <td class="${tableClasses.bodyCell}">${new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                <td class="${tableClasses.bodyCell} font-mono">${onTime}</td>
                <td class="${tableClasses.bodyCell} font-mono">${offTime}</td>
                <td class="${tableClasses.bodyCell} font-mono">${totalTime}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        
        const sectionBg = this.themeManager.getColor('background', 'card');
        const sectionBorder = this.themeManager.getColor('border', 'primary');
        const textPrimary = this.themeManager.getColor('text', 'primary');
        const textSecondary = this.themeManager.getColor('text', 'secondary');
        const textMuted = this.themeManager.getColor('text', 'muted');
        const bgSecondary = this.themeManager.getColor('background', 'secondary');
        
        html += `<div class="mt-6 p-4 ${sectionBg} border-t ${sectionBorder}">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="text-base font-medium ${textPrimary} mb-3">Time Breakdown</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm ${textSecondary}">On-platform:</span>
                            <span class="text-sm font-mono ${textPrimary}">${this.formatTime(totalOnSeconds)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm ${textSecondary}">Off-platform:</span>
                            <span class="text-sm font-mono ${textPrimary}">${this.formatTime(totalOffSeconds)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium ${textPrimary}">Total Time:</span>
                            <span class="text-sm font-mono font-semibold ${textPrimary}">${this.formatTime(grandTotalSeconds)}</span>
                        </div>
                    </div>
                    
                    <div class="mt-3 ${bgSecondary} rounded-full h-1.5">
                        <div class="${this.themeManager.getProgressBarClasses().fill} h-1.5 rounded-full" style="width: ${Math.round(totalOnSeconds / grandTotalSeconds * 100)}%"></div>
                    </div>
                    <div class="flex justify-between mt-1 text-xs ${textMuted}">
                        <span>On-platform (${Math.round(totalOnSeconds / grandTotalSeconds * 100)}%)</span>
                        <span>Off-platform (${Math.round(totalOffSeconds / grandTotalSeconds * 100)}%)</span>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-base font-medium ${textPrimary} mb-3">Payment Details</h4>
                    <div class="${bgSecondary} p-3 rounded-md border ${sectionBorder}">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm ${textSecondary}">Rate per hour:</span>
                            <span class="text-sm ${textSecondary}">$${this.ratePerHour.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm ${textSecondary}">Total hours:</span>
                            <span class="text-sm ${textSecondary}">${totalHours.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between items-center pt-2 border-t ${sectionBorder}">
                            <span class="text-sm font-medium ${textPrimary}">Total pay:</span>
                            <span class="text-sm font-medium text-green-600">$${payAmount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        if (this.reportContainer) {
            this.reportContainer.innerHTML = html;
        }
    }

    getDateOfISOWeek(week, year) {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = new Date(simple);
        if (dow <= 4) {
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        } else {
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        }
        return ISOweekStart;
    }

    getOnSecondsForDate(dateKey, now) {
        const notesData = JSON.parse(localStorage.getItem(dateKey) || '{}');
        let total = 0;
        Object.values(notesData).forEach(note => {
            const start = note.startTimestamp;
            const end = note.endTimestamp;
            const additional = note.additionalTime || 0;
            let seconds = additional;
            if (start && end) {
                seconds += Math.floor((end - start) / 1000);
            } else if (start && !end) {
                seconds += Math.floor((now - start) / 1000);
            }
            total += seconds;
        });
        return total;
    }

    getOffSecondsForDate(dateKey) {
        const offTimer = new OffPlatformTimer();
        offTimer.currentDate = dateKey;
        return offTimer.getTotalSeconds();
    }

    // Count completed (not canceled) tasks for a date
    getCompletedCountForDate(dateKey) {
        const notesData = JSON.parse(localStorage.getItem(dateKey) || '{}');
        return Object.values(notesData).filter(note => note.completed && !note.canceled).length;
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Render a calendar with balanced styling
    renderCalendar() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.calendarContainer.innerHTML = '';

        // Calendar container with theme styling
        const calendarClasses = this.themeManager.getCalendarClasses();
        const calendarWrapper = document.createElement('div');
        calendarWrapper.className = this.themeManager.combineClasses(
            calendarClasses.container,
            'border',
            calendarClasses.border
        );
        this.calendarContainer.appendChild(calendarWrapper);
        
        // Navigation header with theme styling
        const nav = document.createElement('div');
        nav.className = this.themeManager.combineClasses(
            'flex justify-between items-center p-4 border-b',
            calendarClasses.border
        );
        
        const buttonHoverBg = this.themeManager.getColor('background', 'secondary');
        const buttonTextColor = this.themeManager.getColor('text', 'muted');
        
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7"></path></svg>';
        prevBtn.className = `p-1.5 rounded-full hover:${buttonHoverBg} ${buttonTextColor} transition-colors`;
        prevBtn.title = 'Previous Month';
        prevBtn.addEventListener('click', () => this.changeMonth(-1));
        
        this.monthLabelElement = document.createElement('div');
        this.monthLabelElement.className = this.themeManager.combineClasses(
            'text-base font-light',
            this.themeManager.getColor('text', 'secondary')
        );
        
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path></svg>';
        nextBtn.className = `p-1.5 rounded-full hover:${buttonHoverBg} ${buttonTextColor} transition-colors`;
        nextBtn.title = 'Next Month';
        nextBtn.addEventListener('click', () => this.changeMonth(1));
        
        nav.append(prevBtn, this.monthLabelElement, nextBtn);
        calendarWrapper.appendChild(nav);
        
        // Day names header with theme styling
        const daysRow = document.createElement('div');
        daysRow.className = this.themeManager.combineClasses(
            'grid grid-cols-7 text-center border-b',
            calendarClasses.border
        );
        
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(d => {
            const cell = document.createElement('div');
            cell.textContent = d;
            cell.className = this.themeManager.combineClasses(
                'py-2 text-xs font-medium',
                this.themeManager.getColor('text', 'lighter')
            );
            daysRow.appendChild(cell);
        });
        
        calendarWrapper.appendChild(daysRow);
        
        // Dates grid - balanced styling
        this.datesGrid = document.createElement('div');
        this.datesGrid.className = 'grid grid-cols-7';
        calendarWrapper.appendChild(this.datesGrid);
        
        this.updateCalendar();
    }

    // Change displayed month for calendar
    changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.updateCalendar();
    }

    // Update calendar grid with balanced styling
    updateCalendar() {
        this.monthLabelElement.textContent = `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;
        this.datesGrid.innerHTML = '';
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const startIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const totalCells = Math.ceil((startIndex + daysInMonth) / 7) * 7;
        
        // Add empty cells for days before the first of the month
        for (let i = 0; i < startIndex; i++) {
            const cell = document.createElement('div');
            cell.className = 'h-9';
            this.datesGrid.appendChild(cell);
        }
        
        // Add cells for days in the month - balanced styling
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'relative';
            
            const dateObj = new Date(this.currentYear, this.currentMonth, day);
            // Determine if this date is in the selected week
            let isInSelectedWeek = false;
            if (this.selectedMonday) {
                // Parse the selectedMonday string (YYYY-MM-DD) to avoid timezone issues
                const [year, month, day] = this.selectedMonday.split('-').map(Number);
                const mondayDate = new Date(year, month - 1, day);
                const weekDates = [];
                for (let j = 0; j < 7; j++) {
                    const d = new Date(mondayDate);
                    d.setDate(mondayDate.getDate() + j);
                    weekDates.push(d.toLocaleDateString('sv-SE'));
                }
                const currentDateStr = dateObj.toLocaleDateString('sv-SE');
                isInSelectedWeek = weekDates.includes(currentDateStr);
            }
            

            
            // Create the inner content of the date cell with theme styling
            const innerContent = document.createElement('div');
            const lightBorder = this.themeManager.getColor('border', 'light');
            const hoverBg = this.themeManager.getColor('background', 'secondary');
            const selectedBg = this.themeManager.getCalendarClasses().selected;
            const selectedHoverBg = this.themeManager.getCalendarClasses().selectedHover;
            
            innerContent.className = this.themeManager.combineClasses(
                'h-9 flex items-center justify-center cursor-pointer border-b transition-colors',
                lightBorder,
                isInSelectedWeek ? `${selectedBg} ${selectedHoverBg}` : `hover:${hoverBg}`
            );
            
            // Date number with theme styling
            const dateNumber = document.createElement('div');
            const textColor = this.themeManager.getColor('text', 'secondary');
            dateNumber.className = this.themeManager.combineClasses(
                'text-xs',
                isInSelectedWeek ? 'font-bold' : 'font-light',
                textColor
            );
            dateNumber.textContent = day;
            innerContent.appendChild(dateNumber);
            
            innerContent.addEventListener('click', () => this.selectDate(dateObj));
            cell.appendChild(innerContent);
            this.datesGrid.appendChild(cell);
        }
        
        // Add empty cells for days after the last day of the month
        const remainingCells = totalCells - (startIndex + daysInMonth);
        for (let i = 0; i < remainingCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'h-9';
            this.datesGrid.appendChild(cell);
        }
    }

    // Handle selection of a date to set week
    selectDate(date) {
        // Ensure we're working with a fresh Date object to avoid mutation issues
        const workDate = new Date(date.getTime());
        
        // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = workDate.getDay();
        
        // Calculate days to subtract to get to Monday
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const monday = new Date(workDate);
        monday.setDate(workDate.getDate() - daysToSubtract);

        this.selectedMonday = monday.toLocaleDateString('sv-SE');
        this.updateCalendar();
        this.generateReport();
    }

    // Helper to get month name by index
    getMonthName(monthIndex) {
        return ['January','February','March','April','May','June','July','August','September','October','November','December'][monthIndex];
    }

    // Export all localStorage data to JSON file for import/export
    exportAllData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'notes_data.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Show file input to import JSON data into localStorage
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.addEventListener('change', async () => {
            if (!input.files.length) return;
            try {
                const text = await input.files[0].text();
                const data = JSON.parse(text);
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key]);
                });
                window.location.reload();
            } catch (err) {
                alert('Failed to import JSON: ' + err.message);
            }
        });
        input.click();
    }
}

export default PayAnalysis; 