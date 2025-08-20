import { DOMHelpers } from '../../core/utils/DOMHelpers.js';

/**
 * OffPlatformEntry - Represents a single off-platform timer entry
 * Supports creation, editing, starting/stopping timers, and deletion
 */
export class OffPlatformEntry {
    constructor(entryData, themeManager, callbacks = {}) {
        this.entryData = { ...entryData };
        this.themeManager = themeManager;
        this.callbacks = callbacks;
        
        // UI elements
        this.element = null;
        this.titleInput = null;
        this.timeDisplay = null;
        this.editButton = null;
        this.deleteButton = null;
        
        // Timer state
        this.updateInterval = null;
        
        this.render();
        this.setupEventListeners();
        
        // Start timer display if running
        if (this.entryData.isRunning) {
            this.startTimerDisplay();
        }
    }

    render() {
        const isRunning = this.entryData.isRunning;
        
        // Single-line layout for all timers
        this.element = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'flex items-center gap-3 p-2 rounded border transition-all group',
                this.themeManager.getColor('background', 'card'),
                isRunning ? this.themeManager.getColor('border', 'success') : this.themeManager.getColor('border', 'light'),
                isRunning ? 'ring-1 ring-green-200' : 'hover:shadow-sm'
            )
        );

        // Title section
        this.renderTitleSection(isRunning);
        
        // Time section
        this.renderTimeSection(isRunning);
        
        // Button section
        this.renderButtonSection(isRunning);
    }

    renderTitleSection(isRunning) {
        const titleContainer = DOMHelpers.createElement('div', 'flex-1 min-w-0');
        
        if (isRunning) {
            // Editable input for running timer
            this.titleInput = DOMHelpers.createElement('input');
            this.titleInput.type = 'text';
            this.titleInput.value = this.entryData.title || '';
            this.titleInput.placeholder = 'Enter title...';
            this.titleInput.className = this.themeManager.combineClasses(
                'w-full text-sm bg-transparent border-0 focus:outline-none placeholder-opacity-75',
                this.themeManager.getColor('text', 'secondary')
            );
            titleContainer.appendChild(this.titleInput);
        } else {
            // Display with inline editing for finished timer
            this.titleDisplay = DOMHelpers.createElement('div',
                this.themeManager.combineClasses(
                    'text-sm truncate cursor-pointer hover:opacity-75 transition-opacity',
                    this.themeManager.getColor('text', 'secondary')
                ),
                this.entryData.title || 'Untitled'
            );

            this.titleInput = DOMHelpers.createElement('input');
            this.titleInput.type = 'text';
            this.titleInput.value = this.entryData.title || '';
            this.titleInput.className = this.themeManager.combineClasses(
                'w-full text-sm bg-transparent border-0 focus:outline-none',
                this.themeManager.getColor('text', 'secondary')
            );
            this.titleInput.style.display = 'none';

            titleContainer.appendChild(this.titleDisplay);
            titleContainer.appendChild(this.titleInput);
        }

        this.element.appendChild(titleContainer);
    }

    renderTimeSection(isRunning) {
        const timeContainer = DOMHelpers.createElement('div', 'flex-shrink-0');
        
        this.timeDisplay = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'font-mono text-base min-w-[80px] text-center',
                isRunning ? this.themeManager.getColor('status', 'success') : this.themeManager.getColor('text', 'tertiary'),
                !isRunning ? 'cursor-pointer' : ''
            ),
            this.formatTime(this.getTotalSeconds())
        );

        // Time inputs will be created dynamically when needed

        timeContainer.appendChild(this.timeDisplay);
        this.element.appendChild(timeContainer);
    }

    renderButtonSection(isRunning) {
        const buttonContainer = DOMHelpers.createElement('div', 'flex-shrink-0');

        if (!isRunning) {
            // Delete button for finished timer (visible on hover)
            this.deleteButton = DOMHelpers.createButton(
                '×',
                this.themeManager.combineClasses(
                    'w-8 h-8 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                    this.themeManager.getButtonClasses('danger', 'sm')
                ),
                () => this.deleteEntry()
            );
            this.deleteButton.title = 'Delete entry';
            buttonContainer.appendChild(this.deleteButton);
        }
        // No individual stop buttons - handled by main start/stop button

        this.element.appendChild(buttonContainer);
    }

    setupEventListeners() {
        const isRunning = this.entryData.isRunning;

        if (isRunning) {
            // Running timer event listeners
            this.titleInput.addEventListener('blur', () => {
                this.saveTitleForRunningTimer();
            });

            this.titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveTitleForRunningTimer();
                    this.titleInput.blur();
                }
            });
        } else {
            // Finished timer event listeners
            this.setupInlineEditing();
        }

        // Theme change listener
        document.addEventListener('themeChanged', () => {
            this.updateTheme();
        });
    }

    setupInlineEditing() {
        // Title editing
        if (this.titleDisplay && this.titleInput) {
            this.titleDisplay.addEventListener('click', () => {
                this.startTitleEdit();
            });

            this.titleInput.addEventListener('blur', () => {
                this.finishTitleEdit();
            });

            this.titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.finishTitleEdit();
                } else if (e.key === 'Escape') {
                    this.cancelTitleEdit();
                }
            });
        }

        // Time editing
        if (this.timeDisplay) {
            this.timeDisplay.addEventListener('click', () => {
                this.startTimeEdit();
            });
        }
    }

    startTitleEdit() {
        this.titleInput.value = this.entryData.title || '';
        this.titleDisplay.style.display = 'none';
        this.titleInput.style.display = 'block';
        this.titleInput.focus();
        this.titleInput.select();
    }

    finishTitleEdit() {
        this.entryData.title = this.titleInput.value;
        this.titleDisplay.textContent = this.entryData.title || 'Untitled Entry';
        this.titleInput.style.display = 'none';
        this.titleDisplay.style.display = 'block';
        this.notifyCallback('entryUpdated', this.entryData);
    }

    cancelTitleEdit() {
        this.titleInput.value = this.entryData.title || '';
        this.titleInput.style.display = 'none';
        this.titleDisplay.style.display = 'block';
    }

    startTimeEdit() {
        const currentSeconds = this.getTotalSeconds();
        const hours = Math.floor(currentSeconds / 3600);
        const minutes = Math.floor((currentSeconds % 3600) / 60);
        const seconds = currentSeconds % 60;

        // Create separate inputs
        this.createTimeInputs(hours, minutes, seconds);
        
        this.timeDisplay.style.display = 'none';
        this.timeInputContainer.style.display = 'flex';
        this.hoursInput.focus();
        this.hoursInput.select();
    }

    createTimeInputs(hours, minutes, seconds) {
        if (this.timeInputContainer) return; // Already exists

        this.timeInputContainer = DOMHelpers.createElement('div', 'flex items-center gap-1');

        // Hours input
        this.hoursInput = DOMHelpers.createElement('input');
        this.hoursInput.type = 'number';
        this.hoursInput.min = '0';
        this.hoursInput.max = '99';
        this.hoursInput.value = hours.toString().padStart(2, '0');
        this.hoursInput.className = this.themeManager.combineClasses(
            'w-12 text-center font-mono text-lg font-semibold bg-transparent border border-gray-300 rounded px-1',
            this.themeManager.getColor('text', 'primary')
        );

        // Minutes input
        this.minutesInput = DOMHelpers.createElement('input');
        this.minutesInput.type = 'number';
        this.minutesInput.min = '0';
        this.minutesInput.max = '59';
        this.minutesInput.value = minutes.toString().padStart(2, '0');
        this.minutesInput.className = this.themeManager.combineClasses(
            'w-12 text-center font-mono text-lg font-semibold bg-transparent border border-gray-300 rounded px-1',
            this.themeManager.getColor('text', 'primary')
        );

        // Seconds input
        this.secondsInput = DOMHelpers.createElement('input');
        this.secondsInput.type = 'number';
        this.secondsInput.min = '0';
        this.secondsInput.max = '59';
        this.secondsInput.value = seconds.toString().padStart(2, '0');
        this.secondsInput.className = this.themeManager.combineClasses(
            'w-12 text-center font-mono text-lg font-semibold bg-transparent border border-gray-300 rounded px-1',
            this.themeManager.getColor('text', 'primary')
        );

        // Add separators
        const colon1 = DOMHelpers.createElement('span', 'font-mono text-lg font-semibold', ':');
        const colon2 = DOMHelpers.createElement('span', 'font-mono text-lg font-semibold', ':');

        this.timeInputContainer.appendChild(this.hoursInput);
        this.timeInputContainer.appendChild(colon1);
        this.timeInputContainer.appendChild(this.minutesInput);
        this.timeInputContainer.appendChild(colon2);
        this.timeInputContainer.appendChild(this.secondsInput);

        // Insert after time display
        this.timeDisplay.parentNode.insertBefore(this.timeInputContainer, this.timeDisplay.nextSibling);

        this.setupTimeInputListeners();
    }

    setupTimeInputListeners() {
        const inputs = [this.hoursInput, this.minutesInput, this.secondsInput];

        inputs.forEach((input, index) => {
            // Auto-advance on 2 digits
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length === 2 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                    inputs[index + 1].select();
                }
                
                // Enforce max values
                if (input === this.minutesInput || input === this.secondsInput) {
                    if (parseInt(value) > 59) {
                        e.target.value = '59';
                    }
                }
                if (input === this.hoursInput && parseInt(value) > 99) {
                    e.target.value = '99';
                }
            });

            // Handle Enter/Escape
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.finishTimeEdit();
                } else if (e.key === 'Escape') {
                    this.cancelTimeEdit();
                }
            });

            // Finish on blur (but only if we're not focusing another input)
            input.addEventListener('blur', (e) => {
                setTimeout(() => {
                    if (!inputs.some(inp => inp === document.activeElement)) {
                        this.finishTimeEdit();
                    }
                }, 10);
            });
        });
    }

    finishTimeEdit() {
        if (!this.timeInputContainer) return;

        const hours = Math.max(0, Math.min(99, parseInt(this.hoursInput.value) || 0));
        const minutes = Math.max(0, Math.min(59, parseInt(this.minutesInput.value) || 0));
        const seconds = Math.max(0, Math.min(59, parseInt(this.secondsInput.value) || 0));
        
        const newTotalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        
        this.entryData.totalSeconds = newTotalSeconds;
        this.timeDisplay.textContent = this.formatTime(newTotalSeconds);
        this.notifyCallback('entryUpdated', this.entryData);
        
        this.hideTimeInputs();
    }

    cancelTimeEdit() {
        this.hideTimeInputs();
    }

    hideTimeInputs() {
        if (this.timeInputContainer) {
            this.timeInputContainer.style.display = 'none';
        }
        this.timeDisplay.style.display = 'block';
    }

    startTimer() {
        if (!this.entryData.isRunning) {
            this.entryData.isRunning = true;
            this.entryData.startTime = Date.now();
            
            this.reRender();
            this.startTimerDisplay();
            
            this.notifyCallback('entryStarted', this.entryData);
        }
    }

    stopTimer() {
        if (this.entryData.isRunning) {
            // Calculate elapsed time and add to total
            const elapsed = Math.floor((Date.now() - this.entryData.startTime) / 1000);
            this.entryData.totalSeconds += elapsed;
            
            this.entryData.isRunning = false;
            this.entryData.endTime = Date.now();
            this.entryData.startTime = null;
            
            this.stopTimerDisplay();
            this.reRender();
            
            this.notifyCallback('entryStopped', this.entryData);
        }
    }

    reRender() {
        const oldElement = this.element;
        this.render();
        this.setupEventListeners();
        
        if (oldElement && oldElement.parentNode) {
            oldElement.parentNode.replaceChild(this.element, oldElement);
        }
    }


    deleteEntry() {
        if (this.deleteButton.textContent === '×') {
            // First click - show confirmation
            this.deleteButton.textContent = 'Delete?';
            this.deleteButton.className = this.themeManager.combineClasses(
                'w-16 h-8 rounded opacity-100 transition-opacity text-xs',
                this.themeManager.getButtonClasses('danger', 'sm')
            );
            
            // Reset after 3 seconds
            this.deleteTimeout = setTimeout(() => {
                this.resetDeleteButton();
            }, 3000);
        } else {
            // Second click - confirm delete
            this.cleanup();
            this.notifyCallback('entryDeleted', this.entryData);
        }
    }

    resetDeleteButton() {
        if (this.deleteTimeout) {
            clearTimeout(this.deleteTimeout);
            this.deleteTimeout = null;
        }
        
        if (this.deleteButton) {
            this.deleteButton.textContent = '×';
            this.deleteButton.className = this.themeManager.combineClasses(
                'w-8 h-8 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                this.themeManager.getButtonClasses('danger', 'sm')
            );
        }
    }

    startTimerDisplay() {
        this.stopTimerDisplay();
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 1000);
        this.updateDisplay();
    }

    stopTimerDisplay() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateDisplay() {
        if (this.timeDisplay) {
            this.timeDisplay.textContent = this.formatTime(this.getTotalSeconds());
        }
    }

    updateTheme() {
        // Re-render with new theme
        const oldElement = this.element;
        this.render();
        
        if (oldElement && oldElement.parentNode) {
            oldElement.parentNode.replaceChild(this.element, oldElement);
        }
    }

    getTotalSeconds() {
        let total = this.entryData.totalSeconds || 0;
        
        if (this.entryData.isRunning && this.entryData.startTime) {
            const elapsed = Math.floor((Date.now() - this.entryData.startTime) / 1000);
            total += elapsed;
        }
        
        return total;
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    isValidTimeFormat(timeString) {
        const regex = /^\d{1,2}:\d{2}:\d{2}$/;
        if (!regex.test(timeString)) return false;
        
        const parts = timeString.split(':').map(part => parseInt(part, 10));
        return parts[1] < 60 && parts[2] < 60;
    }

    saveTitleForRunningTimer() {
        const newTitle = this.titleInput.value.trim();
        this.entryData.title = newTitle;
        
        // Provide visual feedback by briefly changing the input style
        this.titleInput.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Light green
        setTimeout(() => {
            this.titleInput.style.backgroundColor = '';
        }, 300);
        
        this.notifyCallback('entryUpdated', this.entryData);
    }

    notifyCallback(event, data) {
        if (this.callbacks[event] && typeof this.callbacks[event] === 'function') {
            try {
                this.callbacks[event](data);
            } catch (error) {
                console.error(`Error in OffPlatformEntry ${event} callback:`, error);
            }
        }
    }

    getElement() {
        return this.element;
    }

    getEntryData() {
        return { ...this.entryData };
    }

    cleanup() {
        this.stopTimerDisplay();
        this.resetDeleteButton();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default OffPlatformEntry;