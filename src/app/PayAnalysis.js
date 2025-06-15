import OffPlatformTimer from './OffPlatformTimer.js';

export class PayAnalysis {
    constructor() {
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
    }

    generateReport() {
        if (!this.selectedMonday) return;
        const monday = new Date(this.selectedMonday);
        const reportRows = [];
        let totalOnSeconds = 0;
        let totalOffSeconds = 0;
        let totalTasks = 0;
        const now = Date.now();

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateKey = date.toISOString().slice(0, 10);

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
                dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]
            });
        }

        const grandTotalSeconds = totalOnSeconds + totalOffSeconds;
        const totalHours = grandTotalSeconds / 3600;
        const payAmount = (totalHours * this.ratePerHour).toFixed(2);
    

        // Balanced summary cards with subtle color accents
        let html = `<div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-4 rounded-md shadow-sm border-l-2 border-blue-300">
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
        html += `<div class="bg-white p-6 rounded-md shadow-sm">
            <h3 class="text-lg font-light mb-4 text-gray-800">
                Week of ${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="py-3 px-4 text-left font-medium text-gray-500">Day</th>
                            <th class="py-3 px-4 text-left font-medium text-gray-500">Date</th>
                            <th class="py-3 px-4 text-left font-medium text-gray-500">On-platform</th>
                            <th class="py-3 px-4 text-left font-medium text-gray-500">Off-platform</th>
                            <th class="py-3 px-4 text-left font-medium text-gray-500">Total</th>
                        </tr>
                    </thead>
                    <tbody>`;

        reportRows.forEach((row, index) => {
            const onTime = this.formatTime(row.onSeconds);
            const offTime = this.formatTime(row.offSeconds);
            const totalSeconds = row.onSeconds + row.offSeconds;
            const totalTime = this.formatTime(totalSeconds);
            const isWeekend = index > 4;
            
            html += `<tr class="border-b border-gray-100 ${isWeekend ? 'text-gray-400' : ''}">
                <td class="py-3 px-4 font-medium">${row.dayName}</td>
                <td class="py-3 px-4">${new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                <td class="py-3 px-4 font-mono">${onTime}</td>
                <td class="py-3 px-4 font-mono">${offTime}</td>
                <td class="py-3 px-4 font-mono">${totalTime}</td>
            </tr>`;
        });
        
        html += `</tbody></table></div>
        
        <div class="mt-6 pt-4 border-t border-gray-200">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="text-sm font-medium text-gray-600 mb-3">Time Breakdown</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500">On-platform:</span>
                            <span class="font-mono text-sm">${this.formatTime(totalOnSeconds)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500">Off-platform:</span>
                            <span class="font-mono text-sm">${this.formatTime(totalOffSeconds)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600 font-medium">Total Time:</span>
                            <span class="font-mono text-sm font-medium">${this.formatTime(grandTotalSeconds)}</span>
                        </div>
                    </div>
                    
                    <div class="mt-3 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-blue-400 h-1.5" style="width: ${Math.round(totalOnSeconds / grandTotalSeconds * 100)}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-400 mt-1">
                        <span>On-platform (${Math.round(totalOnSeconds / grandTotalSeconds * 100)}%)</span>
                        <span>Off-platform (${Math.round(totalOffSeconds / grandTotalSeconds * 100)}%)</span>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-sm font-medium text-gray-600 mb-3">Payment Details</h4>
                    <div class="p-4 bg-gray-50 rounded-md border border-gray-100">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-500">Rate per hour:</span>
                            <span class="text-sm">$${this.ratePerHour.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-500">Total hours:</span>
                            <span class="text-sm">${totalHours.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                            <span class="text-sm text-gray-600 font-medium">Total pay:</span>
                            <span class="text-sm font-medium text-emerald-600">$${payAmount}</span>
                        </div>
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

        // Calendar container with balanced styling
        const calendarWrapper = document.createElement('div');
        calendarWrapper.className = 'border border-gray-200 rounded-md bg-white shadow-sm';
        this.calendarContainer.appendChild(calendarWrapper);
        
        // Navigation header - balanced
        const nav = document.createElement('div');
        nav.className = 'flex justify-between items-center p-4 border-b border-gray-100';
        
        const monthYearContainer = document.createElement('div');
        monthYearContainer.className = 'flex-1 text-center';
        
        const navButtonsContainer = document.createElement('div');
        navButtonsContainer.className = 'flex gap-2';
        
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7"></path>
        </svg>`;
        prevBtn.className = 'p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors';
        prevBtn.title = 'Previous Month';
        prevBtn.addEventListener('click', () => this.changeMonth(-1));
        
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path>
        </svg>`;
        nextBtn.className = 'p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors';
        nextBtn.title = 'Next Month';
        nextBtn.addEventListener('click', () => this.changeMonth(1));
        
        this.monthLabelElement = document.createElement('div');
        this.monthLabelElement.className = 'text-base font-light text-gray-700';
        
        monthYearContainer.appendChild(this.monthLabelElement);
        navButtonsContainer.append(prevBtn, nextBtn);
        nav.append(navButtonsContainer, monthYearContainer);
        calendarWrapper.appendChild(nav);
        
        // Day names header - balanced
        const daysRow = document.createElement('div');
        daysRow.className = 'grid grid-cols-7 text-center border-b border-gray-100';
        
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(d => {
            const cell = document.createElement('div');
            cell.textContent = d;
            cell.className = 'py-2 text-xs font-medium text-gray-400';
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
            cell.className = 'h-9 border-b border-gray-50';
            this.datesGrid.appendChild(cell);
        }
        
        // Add cells for days in the month - balanced styling
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'relative border-b border-gray-50';
            
            const dateObj = new Date(this.currentYear, this.currentMonth, day);
            // Determine if this date is in the selected week
            let isInSelectedWeek = false;
            if (this.selectedMonday) {
                const mondayDate = new Date(this.selectedMonday);
                const weekDates = [];
                for (let j = 0; j < 7; j++) {
                    const d = new Date(mondayDate);
                    d.setDate(mondayDate.getDate() + j);
                    weekDates.push(d.toISOString().slice(0, 10));
                }
                const currentDateStr = dateObj.toISOString().slice(0, 10);
                isInSelectedWeek = weekDates.includes(currentDateStr);
            }
            
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            
            // Create the inner content of the date cell - balanced styling
            const innerContent = document.createElement('div');
            innerContent.className = `h-9 flex items-center justify-center cursor-pointer 
                                      ${isInSelectedWeek ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'} 
                                      transition-colors`;
            
            // Date number without any "today" highlighting
            const dateNumber = document.createElement('div');
            dateNumber.className = `text-xs ${isInSelectedWeek ? 'font-medium' : 'font-light'} ${isWeekend ? 'text-gray-400' : 'text-gray-700'}`;
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
        
        // Normalize to midnight to avoid any time-related issues
        monday.setHours(0, 0, 0, 0);
        
        this.selectedMonday = monday.toISOString().slice(0, 10);
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