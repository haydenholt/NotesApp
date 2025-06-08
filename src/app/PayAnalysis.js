import Timer from '../components/Timer.js';

export class PayAnalysis {
    constructor() {
        this.weekSelector = document.getElementById('weekSelector');
        this.container = document.getElementById('payAnalysisContainer');
        this.openButton = document.getElementById('openPayAnalysisButton');
        this.viewManager = window.viewManager;
        this.noteApp = window.noteApp;

        // Bind open button click to show this view
        if (this.openButton) {
            this.openButton.addEventListener('click', () => {
                this.viewManager.showView('payAnalysis');
                this.updateAnalysis();
            });
        }

        // Set default week and bind change event
        if (this.weekSelector) {
            // Set default week to current date
            const today = new Date(this.noteApp.currentDate);
            const defaultYear = this.getISOWeekYear(today);
            const defaultWeek = this.getISOWeekNumber(today);
            this.weekSelector.value = `${defaultYear}-W${defaultWeek.toString().padStart(2, '0')}`;

            this.weekSelector.addEventListener('change', () => {
                this.updateAnalysis();
            });
        }

        // Perform initial analysis
        if (this.weekSelector && this.weekSelector.value) {
            this.updateAnalysis();
        }
    }

    updateAnalysis() {
        const weekValue = this.weekSelector.value;
        if (!weekValue) return;

        const [yearStr, weekStr] = weekValue.split('-W');
        const year = parseInt(yearStr, 10);
        const week = parseInt(weekStr, 10);

        const monday = this.getDateOfISOWeek(week, year);
        const baseStart = new Date(monday);
        const baseEnd = new Date(monday);
        baseEnd.setDate(baseEnd.getDate() + 6);

        const additionalStart = new Date(monday);
        additionalStart.setDate(additionalStart.getDate() + 1);
        const additionalEnd = new Date(monday);
        additionalEnd.setDate(additionalEnd.getDate() + 7);

        const projects = {};

        const ensureProject = (id) => {
            if (!projects[id]) {
                projects[id] = { baseSeconds: 0, additionalSeconds: 0, offPlatformSeconds: 0 };
            }
        };

        // On-platform base pay period (Monday-Sunday at $52.75/hr)
        const dateIter = new Date(baseStart);
        while (dateIter <= baseEnd) {
            const dateStr = dateIter.toISOString().split('T')[0];
            // Process saved completed notes
            const savedNotes = JSON.parse(localStorage.getItem(dateStr) || '{}');
            Object.values(savedNotes).forEach(note => {
                if (note.completed && !note.canceled) {
                    const projectID = note.projectID || 'Unassigned';
                    ensureProject(projectID);
                    // Calculate duration including additionalTime
                    const timer = new Timer(note.startTimestamp, note.endTimestamp);
                    timer.additionalTime = note.additionalTime || 0;
                    const durationSeconds = timer.getSeconds();
                    projects[projectID].baseSeconds += durationSeconds;
                }
            });
            // Also include any in-progress notes for the current date
            if (dateStr === this.noteApp.currentDate) {
                this.noteApp.notes.forEach(noteObj => {
                    if (!noteObj.completed && !noteObj.canceled) {
                        const projectID = noteObj.elements.projectID.value.trim() || 'Unassigned';
                        ensureProject(projectID);
                        const durationSeconds = noteObj.timer.getSeconds();
                        projects[projectID].baseSeconds += durationSeconds;
                    }
                });
            }
            dateIter.setDate(dateIter.getDate() + 1);
        }

        // On-platform additional pay period (Tuesday-Monday at $7.25/hr)
        const dateIter2 = new Date(additionalStart);
        while (dateIter2 <= additionalEnd) {
            const dateStr = dateIter2.toISOString().split('T')[0];
            // Process saved completed notes
            const savedNotes2 = JSON.parse(localStorage.getItem(dateStr) || '{}');
            Object.values(savedNotes2).forEach(note => {
                if (note.completed && !note.canceled) {
                    const projectID = note.projectID || 'Unassigned';
                    ensureProject(projectID);
                    // Calculate duration including additionalTime
                    const timer = new Timer(note.startTimestamp, note.endTimestamp);
                    timer.additionalTime = note.additionalTime || 0;
                    const durationSeconds = timer.getSeconds();
                    projects[projectID].additionalSeconds += durationSeconds;
                }
            });
            // Also include any in-progress notes for the current date
            if (dateStr === this.noteApp.currentDate) {
                this.noteApp.notes.forEach(noteObj => {
                    if (!noteObj.completed && !noteObj.canceled) {
                        const projectID = noteObj.elements.projectID.value.trim() || 'Unassigned';
                        ensureProject(projectID);
                        const durationSeconds = noteObj.timer.getSeconds();
                        projects[projectID].additionalSeconds += durationSeconds;
                    }
                });
            }
            dateIter2.setDate(dateIter2.getDate() + 1);
        }

        // Off-platform pay period (Monday-Sunday at $60/hr)
        const offProjectID = 'Off-Platform';
        const dateIter3 = new Date(baseStart);
        while (dateIter3 <= baseEnd) {
            const dateStr = dateIter3.toISOString().split('T')[0];
            const offData = JSON.parse(localStorage.getItem(`offPlatform_${dateStr}`) || '{}');
            if (offData.timers) {
                const totalOff = Object.values(offData.timers).reduce((sum, t) => sum + (t.totalSeconds || 0), 0);
                ensureProject(offProjectID);
                projects[offProjectID].offPlatformSeconds += totalOff;
            }
            dateIter3.setDate(dateIter3.getDate() + 1);
        }

        // Compute pay per project
        const rows = [];
        Object.entries(projects).forEach(([projectID, secs]) => {
            const basePay = secs.baseSeconds * (52.75 / 3600);
            const additionalPay = secs.additionalSeconds * (7.25 / 3600);
            const offPay = secs.offPlatformSeconds * (60 / 3600);
            const totalPay = basePay + additionalPay + offPay;
            rows.push({ projectID, totalPay, basePay });
        });

        // Render results
        this.container.innerHTML = '';
        // Show total for the week
        const totalAll = rows.reduce((sum, row) => sum + row.totalPay, 0);
        const totalDiv = document.createElement('div');
        totalDiv.className = 'text-xl font-semibold mb-4';
        totalDiv.textContent = `Week Total: $${totalAll.toFixed(2)}`;
        this.container.appendChild(totalDiv);
        if (rows.length === 0) {
            this.container.innerHTML = '<p class="text-gray-700">No data for selected week.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pay</th>
                <th class="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Portion @ $52.75/hr</th>
            </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.className = 'bg-white divide-y divide-gray-200';
        rows.forEach(({ projectID, totalPay, basePay }) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${projectID}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$${totalPay.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$${basePay.toFixed(2)}</td>`;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        this.container.appendChild(table);
    }

    getISOWeekNumber(date) {
        const tmp = new Date(date.valueOf());
        tmp.setHours(0,0,0,0);
        tmp.setDate(tmp.getDate() + 3 - (tmp.getDay() + 6) % 7);
        const firstThursday = new Date(tmp.getFullYear(), 0, 4);
        const diff = tmp - firstThursday;
        return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
    }

    getISOWeekYear(date) {
        const tmp = new Date(date.valueOf());
        tmp.setHours(0,0,0,0);
        tmp.setDate(tmp.getDate() + 3 - (tmp.getDay() + 6) % 7);
        return tmp.getFullYear();
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
}

export default PayAnalysis; 