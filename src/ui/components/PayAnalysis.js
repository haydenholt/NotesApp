import { TimerEntryRepository } from '../../core/data/TimerEntryRepository.js';
import { SecurityUtils } from '../../core/utils/SecurityUtils.js';
import { SecureStorage } from '../../core/data/SecureStorage.js';
import { NotesRepository } from '../../core/data/NotesRepository.js';

export class PayAnalysis {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.calendarContainer = document.getElementById('calendarContainer');
        this.reportContainer = document.getElementById('payReportContainer');
        this.selectedMonday = null;
        
        // Load saved payrate from localStorage, default to $60
        this.ratePerHour = 60; // Default
        this.loadPayRate();
        
        this.init();
    }

    async loadPayRate() {
        try {
            const savedRate = await SecureStorage.getItem('pay_rate');
            if (savedRate) {
                this.ratePerHour = parseFloat(savedRate);
            }
        } catch (error) {
            console.error('Error loading pay rate:', error);
        }
    }

    init() {
        if (this.calendarContainer) {
            this.renderCalendar();
        }
        // Select the current week on load
        this.selectDate(new Date());
        
        // Listen for theme changes and re-render
        document.addEventListener('themeChanged', (event) => {
            // Store scroll position from the event or get current position
            const scrollPosition = event.detail?.scrollPosition ?? (window.pageYOffset || document.documentElement.scrollTop);
            
            if (this.calendarContainer) {
                this.renderCalendar();
            }
            if (this.selectedMonday) {
                this.generateReport().catch(console.error);
            }
            
            // Restore scroll position after rendering updates
            requestAnimationFrame(() => {
                window.scrollTo(0, scrollPosition);
            });
        });
    }

    async generateReport() {
        if (!this.selectedMonday) return;
        const [year, month, day] = this.selectedMonday.split('-').map(Number);
        const startDate = new Date(year, month - 1, day);
        const reportRows = [];
        let totalOnSeconds = 0;
        let totalOffSeconds = 0;
        let totalTasks = 0;
        const now = Date.now();
        
        // Determine the number of days to include based on the week type
        let daysToInclude = 7;
        if (this.isTransitionWeek) {
            daysToInclude = 8; // Monday to Monday (inclusive)
        }
        
        // Check if this is a new schedule week (Tuesday to Monday)
        const transitionWeekEnd = new Date(2025, 7, 4); // August 4, 2025
        const isNewSchedule = startDate > transitionWeekEnd && !this.isTransitionWeek;

        for (let i = 0; i < daysToInclude; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateKey = date.toLocaleDateString('sv-SE');

            const onSeconds = await this.getOnSecondsForDate(dateKey, now);
            const offSeconds = await this.getOffSecondsForDate(dateKey);
            const tasksCount = await this.getCompletedCountForDate(dateKey);
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
        const hourlyPay = totalHours * this.ratePerHour;
        const payAmount = hourlyPay.toFixed(2);
    

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
        
        // Determine the week title based on the schedule type
        let weekTitle;
        if (this.isTransitionWeek) {
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 7);
            weekTitle = `Transition Week: ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        } else {
            weekTitle = `Week of ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
        
        html += `<div class="${cardClass}">
            <h3 class="${tableClasses.title}">
                ${weekTitle}
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
                            <span class="text-sm ${textSecondary}">Hourly Rate:</span>
                            <div class="flex items-center">
                                <span class="text-sm ${textSecondary}">$</span>
                                <input type="number" 
                                       value="${this.ratePerHour.toFixed(2)}" 
                                       min="0" 
                                       step="0.01" 
                                       class="ml-1 text-sm ${this.themeManager.getInputClasses()} px-1 py-0 border-transparent focus:border-gray-300 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                       style="width: 80px;"
                                       onchange="window.payAnalysis.savePayRate(parseFloat(this.value) || 60)">
                            </div>
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
            this.reportContainer.textContent = '';
            this.buildReportDOM(reportRows, totalOnSeconds, totalOffSeconds, totalTasks, startDate);
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

    async getOnSecondsForDate(dateKey, now) {
        const notesData = await NotesRepository.getNotesForDate(dateKey);
        let total = 0;
        Object.values(notesData).forEach(note => {
            const start = Number(note.startTimestamp) || 0;
            const end = Number(note.endTimestamp) || 0;
            const additional = Number(note.additionalTime) || 0;
            let seconds = additional;
            
            if (start && end && end > start) {
                const duration = Math.floor((end - start) / 1000);
                if (!isNaN(duration) && duration >= 0) {
                    seconds += duration;
                }
            } else if (start && !end) {
                const elapsed = Math.floor((now - start) / 1000);
                if (!isNaN(elapsed) && elapsed >= 0) {
                    seconds += elapsed;
                }
            }
            
            // Ensure seconds is a valid number
            if (isNaN(seconds) || seconds < 0) {
                seconds = 0;
            }
            
            total += seconds;
        });
        return Number(total) || 0;
    }

    async getOffSecondsForDate(dateKey) {
        const result = await TimerEntryRepository.getTotalSecondsForDate(dateKey);
        // Ensure we return a valid number, default to 0 for any invalid values
        return Number(result) || 0;
    }

    // Count completed (not canceled) tasks for a date
    async getCompletedCountForDate(dateKey) {
        const notesData = await NotesRepository.getNotesForDate(dateKey);
        return Object.values(notesData).filter(note => note.completed && !note.canceled).length;
    }

    formatTime(seconds) {
        if (seconds === 0) {
            return '—'; // Em dash for zero time
        }
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }


    // Save payrate to localStorage and update internal value
    async savePayRate(rate) {
        this.ratePerHour = rate;
        await SecureStorage.setItem('pay_rate', rate.toString());
        
        // Regenerate report if a week is selected
        if (this.selectedMonday) {
            this.generateReport().catch(console.error);
        }
    }

    // Render a calendar with balanced styling
    renderCalendar() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.calendarContainer.textContent = '';

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
        
        const prevBtn = document.createElement('button');
        const prevSvg = this.createPrevIcon();
        prevBtn.appendChild(prevSvg);
        prevBtn.className = this.themeManager.combineClasses(
            'p-1.5 rounded-full transition-colors',
            this.themeManager.getButtonClasses('secondary', 'sm')
        );
        prevBtn.title = 'Previous Month';
        prevBtn.addEventListener('click', () => this.changeMonth(-1));
        
        this.monthLabelElement = document.createElement('div');
        this.monthLabelElement.className = this.themeManager.combineClasses(
            'text-base font-light',
            this.themeManager.getColor('text', 'secondary')
        );
        
        const nextBtn = document.createElement('button');
        const nextSvg = this.createNextIcon();
        nextBtn.appendChild(nextSvg);
        nextBtn.className = this.themeManager.combineClasses(
            'p-1.5 rounded-full transition-colors',
            this.themeManager.getButtonClasses('secondary', 'sm')
        );
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
        
        ['T', 'W', 'T', 'F', 'S', 'S', 'M'].forEach(d => {
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
        this.datesGrid.textContent = '';
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        // Adjust for Tuesday start (0=Sun, 1=Mon, 2=Tue, etc.)
        // We want Tuesday=0, Wednesday=1, ... Monday=6
        let dayOfWeek = firstDay.getDay();
        const startIndex = dayOfWeek === 0 ? 5 : (dayOfWeek === 1 ? 6 : dayOfWeek - 2);
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
                const startDate = new Date(year, month - 1, day);
                const weekDates = [];
                
                // Determine how many days to include in the week
                let daysToInclude = 7;
                if (this.isTransitionWeek) {
                    daysToInclude = 8; // Monday to Monday
                }
                
                for (let j = 0; j < daysToInclude; j++) {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + j);
                    weekDates.push(d.toLocaleDateString('sv-SE'));
                }
                const currentDateStr = dateObj.toLocaleDateString('sv-SE');
                isInSelectedWeek = weekDates.includes(currentDateStr);
            }
            

            
            // Create the inner content of the date cell with theme styling
            const innerContent = document.createElement('div');
            const lightBorder = this.themeManager.getColor('border', 'light');
            const payCalendarClasses = this.themeManager.getPayAnalysisCalendarClasses();
            
            innerContent.className = this.themeManager.combineClasses(
                'h-9 flex items-center justify-center cursor-pointer border-b transition-colors',
                lightBorder,
                isInSelectedWeek ? `${payCalendarClasses.selected} ${payCalendarClasses.selectedHover}` : payCalendarClasses.hover
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
        
        // Define the transition week start date (July 28, 2025)
        const transitionWeekStart = new Date(2025, 6, 28); // July 28, 2025
        const transitionWeekEnd = new Date(2025, 7, 4); // August 4, 2025
        
        // Check if the selected date falls within the transition week
        if (workDate >= transitionWeekStart && workDate <= transitionWeekEnd) {
            // Special case: transition week (Monday to Monday)
            this.selectedMonday = '2025-07-28';
            this.isTransitionWeek = true;
        } else if (workDate >= transitionWeekEnd) {
            // New schedule: Tuesday to Monday
            const dayOfWeek = workDate.getDay();
            // Calculate days to subtract to get to previous Tuesday
            let daysToSubtract;
            if (dayOfWeek === 0) { // Sunday
                daysToSubtract = 5;
            } else if (dayOfWeek === 1) { // Monday
                daysToSubtract = 6;
            } else { // Tuesday through Saturday
                daysToSubtract = dayOfWeek - 2;
            }
            
            const tuesday = new Date(workDate);
            tuesday.setDate(workDate.getDate() - daysToSubtract);
            this.selectedMonday = tuesday.toLocaleDateString('sv-SE');
            this.isTransitionWeek = false;
        } else {
            // Old schedule: Monday to Sunday
            const dayOfWeek = workDate.getDay();
            // Calculate days to subtract to get to Monday
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            
            const monday = new Date(workDate);
            monday.setDate(workDate.getDate() - daysToSubtract);
            this.selectedMonday = monday.toLocaleDateString('sv-SE');
            this.isTransitionWeek = false;
        }
        
        this.updateCalendar();
        this.generateReport().catch(console.error);
    }

    // Helper to get month name by index
    getMonthName(monthIndex) {
        return ['January','February','March','April','May','June','July','August','September','October','November','December'][monthIndex];
    }

    // Export all localStorage data to JSON file for import/export
    async exportAllData() {
        try {
            const data = await SecureStorage.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'notes_data.json';
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data: ' + error.message);
        }
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
                await SecureStorage.importAll(data);
                window.location.reload();
            } catch (err) {
                console.error('Error importing data:', err);
                alert('Failed to import JSON: ' + err.message);
            }
        });
        input.click();
    }

    buildReportDOM(reportRows, totalOnSeconds, totalOffSeconds, totalTasks, startDate) {
        const grandTotalSeconds = totalOnSeconds + totalOffSeconds;
        const totalHours = grandTotalSeconds / 3600;
        const hourlyPay = totalHours * this.ratePerHour;
        const payAmount = hourlyPay.toFixed(2);
        
        // Create summary cards
        const summaryGrid = SecurityUtils.createElement('div', '', 'mb-6 grid grid-cols-1 md:grid-cols-3 gap-4');
        
        // Total Hours card
        const hoursCard = SecurityUtils.createElement('div', '', `bg-white p-4 rounded-md shadow-sm border-l-2 ${this.themeManager.getColor('border', 'primary')}`);
        const hoursLabel = SecurityUtils.createElement('div', 'Total Hours', 'text-xs uppercase text-gray-400 tracking-wider');
        const hoursContainer = SecurityUtils.createElement('div', '', 'flex items-end mt-1');
        const hoursValue = SecurityUtils.createElement('span', (grandTotalSeconds / 3600).toFixed(1), 'text-2xl font-light text-gray-800');
        const hoursUnit = SecurityUtils.createElement('span', 'hours', 'ml-1 text-sm text-gray-500');
        hoursContainer.appendChild(hoursValue);
        hoursContainer.appendChild(hoursUnit);
        hoursCard.appendChild(hoursLabel);
        hoursCard.appendChild(hoursContainer);
        
        // Pay card
        const payCard = SecurityUtils.createElement('div', '', 'bg-white p-4 rounded-md shadow-sm border-l-2 border-emerald-300');
        const payLabel = SecurityUtils.createElement('div', 'Total Pay', 'text-xs uppercase text-gray-400 tracking-wider');
        const payContainer = SecurityUtils.createElement('div', '', 'flex items-end mt-1');
        const payValue = SecurityUtils.createElement('span', '$' + payAmount, 'text-2xl font-light text-gray-800');
        const payUnit = SecurityUtils.createElement('span', 'USD', 'ml-1 text-sm text-gray-500');
        payContainer.appendChild(payValue);
        payContainer.appendChild(payUnit);
        payCard.appendChild(payLabel);
        payCard.appendChild(payContainer);
        
        // Tasks card
        const tasksCard = SecurityUtils.createElement('div', '', 'bg-white p-4 rounded-md shadow-sm border-l-2 border-indigo-300');
        const tasksLabel = SecurityUtils.createElement('div', 'Tasks Completed', 'text-xs uppercase text-gray-400 tracking-wider');
        const tasksContainer = SecurityUtils.createElement('div', '', 'flex items-end mt-1');
        const tasksValue = SecurityUtils.createElement('span', String(totalTasks), 'text-2xl font-light text-gray-800');
        const tasksUnit = SecurityUtils.createElement('span', 'tasks', 'ml-1 text-sm text-gray-500');
        tasksContainer.appendChild(tasksValue);
        tasksContainer.appendChild(tasksUnit);
        tasksCard.appendChild(tasksLabel);
        tasksCard.appendChild(tasksContainer);
        
        summaryGrid.appendChild(hoursCard);
        summaryGrid.appendChild(payCard);
        summaryGrid.appendChild(tasksCard);
        
        // Create main report table
        const cardClass = this.themeManager.getCardClasses('large');
        const tableClasses = this.themeManager.getTableClasses();
        
        const reportCard = SecurityUtils.createElement('div', '', cardClass);
        
        // Week title
        let weekTitle;
        if (this.isTransitionWeek) {
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 7);
            weekTitle = `Transition Week: ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        } else {
            weekTitle = `Week of ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
        
        const title = SecurityUtils.createElement('h3', weekTitle, tableClasses.title);
        reportCard.appendChild(title);
        
        // Table container
        const tableContainer = SecurityUtils.createElement('div', '', 'overflow-x-auto');
        const table = SecurityUtils.createElement('table', '', tableClasses.table);
        
        // Table header
        const thead = document.createElement('thead');
        const headerRow = SecurityUtils.createElement('tr', '', tableClasses.headerRow);
        const headers = ['Day', 'Date', 'On-platform', 'Off-platform', 'Total'];
        headers.forEach(headerText => {
            const th = SecurityUtils.createElement('th', headerText, tableClasses.headerCell);
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        reportRows.forEach((row, index) => {
            const onTime = this.formatTime(row.onSeconds);
            const offTime = this.formatTime(row.offSeconds);
            const totalSeconds = row.onSeconds + row.offSeconds;
            const totalTime = this.formatTime(totalSeconds);
            const isDayOff = index >= 2 && index <= 4; // Wed, Thu, Fri
            
            const rowClass = isDayOff ? 
                this.themeManager.combineClasses(tableClasses.bodyRow, this.themeManager.getColor('calendar', 'dayOff')) :
                tableClasses.bodyRow;
            
            const tr = SecurityUtils.createElement('tr', '', rowClass);
            
            const dayCell = SecurityUtils.createElement('td', row.dayName, `${tableClasses.bodyCell} font-medium`);
            const dateCell = SecurityUtils.createElement('td', new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tableClasses.bodyCell);
            const onCell = SecurityUtils.createElement('td', onTime, `${tableClasses.bodyCell} font-mono`);
            const offCell = SecurityUtils.createElement('td', offTime, `${tableClasses.bodyCell} font-mono`);
            const totalCell = SecurityUtils.createElement('td', totalTime, `${tableClasses.bodyCell} font-mono`);
            
            tr.appendChild(dayCell);
            tr.appendChild(dateCell);
            tr.appendChild(onCell);
            tr.appendChild(offCell);
            tr.appendChild(totalCell);
            
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        reportCard.appendChild(tableContainer);
        
        // Create pay breakdown section
        const sectionBg = this.themeManager.getColor('background', 'card');
        const sectionBorder = this.themeManager.getColor('border', 'primary');
        const textPrimary = this.themeManager.getColor('text', 'primary');
        const textSecondary = this.themeManager.getColor('text', 'secondary');
        const textMuted = this.themeManager.getColor('text', 'muted');
        const bgSecondary = this.themeManager.getColor('background', 'secondary');
        
        const payBreakdownSection = SecurityUtils.createElement('div', '', `mt-6 p-4 ${sectionBg} border-t ${sectionBorder}`);
        const payBreakdownGrid = SecurityUtils.createElement('div', '', 'grid grid-cols-1 md:grid-cols-2 gap-6');
        
        // Time breakdown column
        const timeBreakdownColumn = SecurityUtils.createElement('div');
        const timeBreakdownTitle = SecurityUtils.createElement('h4', 'Time Breakdown', `text-base font-medium ${textPrimary} mb-3`);
        const timeBreakdownList = SecurityUtils.createElement('div', '', 'space-y-2');
        
        // On-platform time
        const onPlatformRow = SecurityUtils.createElement('div', '', 'flex justify-between items-center');
        const onPlatformLabel = SecurityUtils.createElement('span', 'On-platform:', `text-sm ${textSecondary}`);
        const onPlatformValue = SecurityUtils.createElement('span', this.formatTime(totalOnSeconds), `text-sm font-mono ${textPrimary}`);
        onPlatformRow.appendChild(onPlatformLabel);
        onPlatformRow.appendChild(onPlatformValue);
        
        // Off-platform time
        const offPlatformRow = SecurityUtils.createElement('div', '', 'flex justify-between items-center');
        const offPlatformLabel = SecurityUtils.createElement('span', 'Off-platform:', `text-sm ${textSecondary}`);
        const offPlatformValue = SecurityUtils.createElement('span', this.formatTime(totalOffSeconds), `text-sm font-mono ${textPrimary}`);
        offPlatformRow.appendChild(offPlatformLabel);
        offPlatformRow.appendChild(offPlatformValue);
        
        // Total time
        const totalTimeRow = SecurityUtils.createElement('div', '', 'flex justify-between items-center');
        const totalTimeLabel = SecurityUtils.createElement('span', 'Total Time:', `text-sm font-medium ${textPrimary}`);
        const totalTimeValue = SecurityUtils.createElement('span', this.formatTime(grandTotalSeconds), `text-sm font-mono font-semibold ${textPrimary}`);
        totalTimeRow.appendChild(totalTimeLabel);
        totalTimeRow.appendChild(totalTimeValue);
        
        timeBreakdownList.appendChild(onPlatformRow);
        timeBreakdownList.appendChild(offPlatformRow);
        timeBreakdownList.appendChild(totalTimeRow);
        
        // Progress bar
        const progressBarContainer = SecurityUtils.createElement('div', '', `mt-3 ${bgSecondary} rounded-full h-1.5`);
        const progressBar = SecurityUtils.createElement('div', '', `${this.themeManager.getProgressBarClasses().fill} h-1.5 rounded-full`);
        progressBar.style.width = `${Math.round(totalOnSeconds / grandTotalSeconds * 100)}%`;
        progressBarContainer.appendChild(progressBar);
        
        const progressLabels = SecurityUtils.createElement('div', '', `flex justify-between mt-1 text-xs ${textMuted}`);
        const onPlatformPercent = SecurityUtils.createElement('span', `On-platform (${Math.round(totalOnSeconds / grandTotalSeconds * 100)}%)`);
        const offPlatformPercent = SecurityUtils.createElement('span', `Off-platform (${Math.round(totalOffSeconds / grandTotalSeconds * 100)}%)`);
        progressLabels.appendChild(onPlatformPercent);
        progressLabels.appendChild(offPlatformPercent);
        
        timeBreakdownColumn.appendChild(timeBreakdownTitle);
        timeBreakdownColumn.appendChild(timeBreakdownList);
        timeBreakdownColumn.appendChild(progressBarContainer);
        timeBreakdownColumn.appendChild(progressLabels);
        
        // Payment details column
        const paymentColumn = SecurityUtils.createElement('div');
        const paymentTitle = SecurityUtils.createElement('h4', 'Payment Details', `text-base font-medium ${textPrimary} mb-3`);
        const paymentCard = SecurityUtils.createElement('div', '', `${bgSecondary} p-3 rounded-md border ${sectionBorder}`);
        
        // Hourly Rate
        const rateRow = SecurityUtils.createElement('div', '', 'flex justify-between items-center mb-2');
        const rateLabel = SecurityUtils.createElement('span', 'Hourly Rate:', `text-sm ${textSecondary}`);
        const rateInputContainer = SecurityUtils.createElement('div', '', 'flex items-center');
        const rateDollarSign = SecurityUtils.createElement('span', '$', `text-sm ${textSecondary}`);
        const rateInput = SecurityUtils.createElement('input');
        rateInput.type = 'number';
        rateInput.value = this.ratePerHour.toFixed(2);
        rateInput.min = '0';
        rateInput.step = '0.01';
        rateInput.className = `ml-1 text-sm ${this.themeManager.getInputClasses()} px-1 py-0 border-transparent focus:border-gray-300 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
        rateInput.style.width = '80px';
        rateInput.addEventListener('change', () => {
            window.payAnalysis.savePayRate(parseFloat(rateInput.value) || 60);
        });
        rateInputContainer.appendChild(rateDollarSign);
        rateInputContainer.appendChild(rateInput);
        rateRow.appendChild(rateLabel);
        rateRow.appendChild(rateInputContainer);
        
        // Total hours
        const totalHoursRow = SecurityUtils.createElement('div', '', 'flex justify-between items-center mb-2');
        const totalHoursLabel = SecurityUtils.createElement('span', 'Total hours:', `text-sm ${textSecondary}`);
        const totalHoursValue = SecurityUtils.createElement('span', totalHours.toFixed(2), `text-sm ${textSecondary}`);
        totalHoursRow.appendChild(totalHoursLabel);
        totalHoursRow.appendChild(totalHoursValue);
        
        // Total pay
        const totalPayRow = SecurityUtils.createElement('div', '', `flex justify-between items-center pt-2 border-t ${sectionBorder}`);
        const totalPayLabel = SecurityUtils.createElement('span', 'Total pay:', `text-sm font-medium ${textPrimary}`);
        const totalPayValue = SecurityUtils.createElement('span', '$' + payAmount, 'text-sm font-medium text-green-600');
        totalPayRow.appendChild(totalPayLabel);
        totalPayRow.appendChild(totalPayValue);
        
        paymentCard.appendChild(rateRow);
        paymentCard.appendChild(totalHoursRow);
        paymentCard.appendChild(totalPayRow);
        
        paymentColumn.appendChild(paymentTitle);
        paymentColumn.appendChild(paymentCard);
        
        payBreakdownGrid.appendChild(timeBreakdownColumn);
        payBreakdownGrid.appendChild(paymentColumn);
        payBreakdownSection.appendChild(payBreakdownGrid);
        reportCard.appendChild(payBreakdownSection);
        
        // Append everything to the container
        this.reportContainer.appendChild(summaryGrid);
        this.reportContainer.appendChild(reportCard);
    }

    createPrevIcon() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'w-4 h-4');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('viewBox', '0 0 24 24');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('d', 'M15 19l-7-7 7-7');
        
        svg.appendChild(path);
        return svg;
    }

    createNextIcon() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'w-4 h-4');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('viewBox', '0 0 24 24');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('d', 'M9 5l7 7-7 7');
        
        svg.appendChild(path);
        return svg;
    }
}

export default PayAnalysis; 