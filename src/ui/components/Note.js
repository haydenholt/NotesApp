import Timer from './Timer.js';

// Add Note class wrapper for note creation logic
export class Note {
    constructor(number, date, displayIndex, { enableEditing, completeEditing, deleteNote, markEditing}, themeManager) {
        // Minimal context for this Note
        this.number = number;
        this.date = date;
        this.themeManager = themeManager;
        this._enableNoteEditing = enableEditing;
        this._completeNoteEditing = completeEditing;
        this._deleteNote = deleteNote;
        this._markEditing = markEditing;


        // Load saved note data for this date and ID
        const savedNotes = JSON.parse(localStorage.getItem(date) || '{}');
        const noteData = savedNotes[number] || {};
        // Migrate and default fields
        let failingIssues = '';
        let nonFailingIssues = '';
        let discussion = '';
        let attemptID = '';
        let projectID = '';
        let operationID = '';
        let additionalTime = 0;
        let canceled = false;
        let startTimestamp = null;
        let endTimestamp = null;
        let completed = false;
        if (noteData.hasOwnProperty('text')) {
            // Legacy format
            failingIssues = noteData.text || '';
        } else {
            failingIssues = noteData.failingIssues || '';
            nonFailingIssues = noteData.nonFailingIssues || '';
            discussion = noteData.discussion || '';
            attemptID = noteData.attemptID || '';
            projectID = noteData.projectID || '';
            operationID = noteData.operationID || '';
        }
        startTimestamp = noteData.startTimestamp || null;
        endTimestamp = noteData.endTimestamp || null;
        completed = noteData.completed || false;
        additionalTime = noteData.additionalTime || 0;
        canceled = noteData.canceled || false;
        // Create the note container with theme-aware classes
        const noteContainer = document.createElement('div');
        const backgroundClass = completed ?
            (canceled ? this.themeManager.getColor('note', 'cancelled') : this.themeManager.getColor('note', 'completed')) :
            this.themeManager.getColor('background', 'card');
        // Add subtle styling for completed notes
        const completedStyling = completed && !canceled ? `opacity-75 border ${this.themeManager.getColor('border', 'secondary')}` : '';
        const cancelledStyling = completed && canceled ? `border-2 ${this.themeManager.getColor('status', 'error')} opacity-60` : '';
        noteContainer.className = `flex mb-4 p-4 rounded-lg shadow relative group ${backgroundClass} ${completedStyling} ${cancelledStyling}`;
        noteContainer.dataset.noteId = number;
        noteContainer._noteInstance = this; // Store reference for cleanup

        // Create action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity';
        
        const editButton = document.createElement('button');
        editButton.className = this.themeManager.combineClasses(
            'w-6 h-6 text-white rounded text-sm flex items-center justify-center leading-none',
            this.themeManager.getPrimaryButtonClasses('sm')
        );
        editButton.innerHTML = '✎';
        editButton.title = 'Edit note';
        editButton.style.display = completed ? 'block' : 'none';
        editButton.style.textIndent = '-1px';

        const saveButton = document.createElement('button');
        saveButton.className = 'w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded text-sm flex items-center justify-center';
        saveButton.innerHTML = '✓';
        saveButton.title = 'Save note';
        saveButton.style.display = 'none';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex items-center justify-center';
        deleteButton.innerHTML = '×';
        deleteButton.title = 'Delete note';


        // Wire up actions
        editButton.addEventListener('click', () => {
            this._enableNoteEditing(number);
            editButton.style.display = 'none';
            saveButton.style.display = 'block';
        });
        saveButton.addEventListener('click', () => {
            this._completeNoteEditing(number);
            saveButton.style.display = 'none';
            editButton.style.display = 'block';
        });
        deleteButton.addEventListener('click', () => this._deleteNote(number));

        actionsDiv.append(editButton, saveButton, deleteButton);
        noteContainer.appendChild(actionsDiv);

        // Left sidebar with number, timer and ID fields
        const leftSidebar = document.createElement('div');
        leftSidebar.className = 'flex flex-col mr-4 min-w-32';

        // Number display - hide for cancelled notes, use provided displayIndex for non-cancelled notes
        const numberDisplay = document.createElement('div');
        numberDisplay.className = `${this.themeManager.getColor('text', 'tertiary')} font-bold mb-2`;
        // If note is completed and cancelled, show "Cancelled"; otherwise, show its position among non-cancelled notes
        if (completed && canceled) {
            numberDisplay.textContent = "Cancelled";
            numberDisplay.className = `${this.themeManager.getColor('note', 'cancelledNumber')} font-bold mb-2`;
        } else {
            // Use provided displayIndex
            numberDisplay.textContent = String(displayIndex);
        }
        leftSidebar.appendChild(numberDisplay);

        // Timer display with theme-aware colors
        const timerDisplay = document.createElement('div');
        let timerColorClass;
        if (completed) {
            timerColorClass = canceled ? 
                this.themeManager.getStatusClasses('error') : 
                this.themeManager.getStatusClasses('success');
        } else {
            timerColorClass = this.themeManager.getColor('timer', 'inactive');
        }
        timerDisplay.className = `font-mono text-base mb-3 ${timerColorClass}`;
        timerDisplay.textContent = '00:00:00';
        leftSidebar.appendChild(timerDisplay);

        // Create ID fields container
        const idFieldsContainer = document.createElement('div');
        idFieldsContainer.className = 'flex flex-col gap-1';
        
        // Attempt ID field
        const attemptIDLabel = document.createElement('label');
        attemptIDLabel.className = this.themeManager.combineClasses(
            'text-xs',
            this.themeManager.getColor('text', 'muted')
        );
        attemptIDLabel.textContent = 'Attempt ID:';
        
        const attemptIDInput = document.createElement('input');
        const attemptIDClasses = this.themeManager.combineClasses(
            'w-full rounded px-2 py-1 text-sm border',
            this.themeManager.getColor('border', 'secondary'),
            this.themeManager.getFocusClasses().combined,
            completed ? this.themeManager.getColor('background', 'secondary') : this.themeManager.getColor('background', 'card'),
            completed ? this.themeManager.getColor('text', 'muted') : this.themeManager.getColor('text', 'primary')
        );
        attemptIDInput.className = attemptIDClasses;
        attemptIDInput.style.direction = 'rtl';
        attemptIDInput.placeholder = completed ? '' : 'Enter ID';
        attemptIDInput.value = attemptID;
        attemptIDInput.disabled = completed;
        
        // Store original placeholder for later use
        attemptIDInput.dataset.originalPlaceholder = 'Enter ID';
        
        // Project ID field
        const projectIDLabel = document.createElement('label');
        projectIDLabel.className = this.themeManager.combineClasses(
            'text-xs mt-1',
            this.themeManager.getColor('text', 'muted')
        );
        projectIDLabel.textContent = 'Project ID:';
        
        const projectIDInput = document.createElement('input');
        const projectIDClasses = this.themeManager.combineClasses(
            'w-full rounded px-2 py-1 text-sm border',
            this.themeManager.getColor('border', 'secondary'),
            this.themeManager.getFocusClasses().combined,
            completed ? this.themeManager.getColor('background', 'secondary') : this.themeManager.getColor('background', 'card'),
            completed ? this.themeManager.getColor('text', 'muted') : this.themeManager.getColor('text', 'primary')
        );
        projectIDInput.className = projectIDClasses;
        projectIDInput.style.direction = 'rtl';
        projectIDInput.placeholder = completed ? '' : 'Enter ID';
        projectIDInput.value = projectID;
        projectIDInput.disabled = completed;
        
        // Store original placeholder for later use
        projectIDInput.dataset.originalPlaceholder = 'Enter ID';
        
        // Operation ID field
        const operationIDLabel = document.createElement('label');
        operationIDLabel.className = this.themeManager.combineClasses(
            'text-xs mt-1',
            this.themeManager.getColor('text', 'muted')
        );
        operationIDLabel.textContent = 'Operation ID:';
        
        const operationIDInput = document.createElement('input');
        const operationIDClasses = this.themeManager.combineClasses(
            'w-full rounded px-2 py-1 text-sm border',
            this.themeManager.getColor('border', 'secondary'),
            this.themeManager.getFocusClasses().combined,
            completed ? this.themeManager.getColor('background', 'secondary') : this.themeManager.getColor('background', 'card'),
            completed ? this.themeManager.getColor('text', 'muted') : this.themeManager.getColor('text', 'primary')
        );
        operationIDInput.className = operationIDClasses;
        operationIDInput.style.direction = 'rtl';
        operationIDInput.placeholder = completed ? '' : 'Enter ID';
        operationIDInput.value = operationID;
        operationIDInput.disabled = completed;
        
        // Store original placeholder for later use
        operationIDInput.dataset.originalPlaceholder = 'Enter ID';
        
        idFieldsContainer.appendChild(projectIDLabel);
        idFieldsContainer.appendChild(projectIDInput);
        idFieldsContainer.appendChild(attemptIDLabel);
        idFieldsContainer.appendChild(attemptIDInput);
        idFieldsContainer.appendChild(operationIDLabel);
        idFieldsContainer.appendChild(operationIDInput);
        
        leftSidebar.appendChild(idFieldsContainer);

        // Content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'flex-grow flex flex-col gap-3';

        // Create the three sections
        const sections = [
            { label: 'Failing issues:', value: failingIssues, key: 'failingIssues' },
            { label: 'Non-failing issues:', value: nonFailingIssues, key: 'nonFailingIssues' },
            { label: 'Discussion:', value: discussion, key: 'discussion' }
        ];

        const sectionElements = {};
        const sectionLabels = {};

        sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'flex flex-col';

            const label = document.createElement('div');
            label.className = this.themeManager.combineClasses(
                'font-bold mb-1',
                this.themeManager.getColor('text', 'secondary')
            );
            label.textContent = section.label;
            
            // Store reference to the label for theme updates
            sectionLabels[section.key] = label;

            const textarea = document.createElement('textarea');
            // Set the original font family
            textarea.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
            const textareaClasses = this.themeManager.combineClasses(
                'w-full p-2 rounded text-base min-h-5 resize-none overflow-hidden border',
                this.themeManager.getColor('border', 'secondary'),
                this.themeManager.getFocusClasses().combined,
                completed ? this.themeManager.getColor('background', 'secondary') : this.themeManager.getColor('background', 'card'),
                completed ? this.themeManager.getColor('text', 'muted') : this.themeManager.getColor('text', 'primary')
            );
            textarea.className = textareaClasses;
            textarea.placeholder = completed ? '' : `Type ${section.label.toLowerCase().replace(':', '')}...`;
            textarea.value = section.value;
            textarea.disabled = completed;
            
            // Store original placeholder for later use
            textarea.dataset.originalPlaceholder = `Type ${section.label.toLowerCase().replace(':', '')}...`;
            
            // Add bottom margin if not completed
            if (!completed) {
                textarea.classList.add('pb-6'); // Changed to smaller padding
            }
            
            // Store reference to the textarea
            sectionElements[section.key] = textarea;

            // Auto-resize textarea
            setTimeout(() => {
                Object.values(sectionElements).forEach(textarea => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                });
            }, 0);
            

            textarea.addEventListener('input', () => {
                // Add this function to adjust the height of the textarea
                const adjustHeight = () => {
                    // Reset height to auto first to get accurate scrollHeight
                    textarea.style.height = 'auto';
                    // Set height to scrollHeight to accommodate all content
                    textarea.style.height = textarea.scrollHeight + 'px';
                };
                
                // Call the adjustment function
                adjustHeight();
                
                if (!timer.hasStarted && !completed) {
                    timer.hasStarted = true;
                    timer.start();
                    // Show save button when editing begins
                    saveButton.style.display = 'block';
                }
                this.save(timer.startTimestamp, timer.endTimestamp, completed);
            });


            sectionDiv.appendChild(label);
            sectionDiv.appendChild(textarea);
            contentContainer.appendChild(sectionDiv);
        });

        // Add event listeners to ID fields
        
        // Start timer when IDs are entered
        attemptIDInput.addEventListener('input', () => {
            if (!timer.hasStarted && !completed) {
                timer.hasStarted = true;
                timer.start();
                saveButton.style.display = 'block';
            }
            this.save(timer.startTimestamp, timer.endTimestamp, completed);
        });
        
        projectIDInput.addEventListener('input', () => {
            if (!timer.hasStarted && !completed) {
                timer.hasStarted = true;
                timer.start();
                saveButton.style.display = 'block';
            }
            this.save(timer.startTimestamp, timer.endTimestamp, completed);
        });

        // Add event listener for Operation ID
        operationIDInput.addEventListener('input', () => {
            if (!timer.hasStarted && !completed) {
                timer.hasStarted = true;
                timer.start();
                saveButton.style.display = 'block';
            }
            this.save(timer.startTimestamp, timer.endTimestamp, completed);
        });

        // Add event listeners for F1 to copy IDs
        noteContainer.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                // Copy IDs first
                const formattedIDs = this.getFormattedIDs();
                if (!formattedIDs || formattedIDs.trim() === '') {
                    console.warn('Cannot copy empty formatted IDs');
                    return;
                }
                // Use clipboard API or fallback
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(formattedIDs)
                            .catch(err => {
                                console.error('Failed to copy formatted IDs: ', err);
                                this.fallbackCopy(formattedIDs);
                            });
                    } else {
                        this.fallbackCopy(formattedIDs);
                    }
                } catch (err) {
                    console.error('Clipboard operation failed:', err);
                    this.fallbackCopy(formattedIDs);
                }
                // Show inline cancel confirmation on this note
                this.showCancelConfirmation();
            }
            if (e.ctrlKey && e.key === 'x') {
                // Don't prevent default to allow normal copy behavior in addition to our custom one
                const text = this.getFormattedText();
                if (!text || text.trim() === '') {
                    console.warn('Cannot copy empty text');
                    return;
                }
                // Check if clipboard API is available
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text)
                            .catch(err => {
                                console.error('Failed to copy: ', err);
                                this.fallbackCopy(text);
                            });
                    } else {
                        this.fallbackCopy(text);
                    }
                } catch (err) {
                    console.error('Clipboard operation failed:', err);
                    this.fallbackCopy(text);
                }
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.pasteAsFormattedBullet();
            }
        });

        contentContainer.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                // Always allow Ctrl+Enter for notes with content, regardless of completed state
                if (timer.hasStarted) {
                    e.preventDefault();

                    // Mark as being edited to prevent creating a new note
                    this._markEditing(number);
                    // Call completeNoteEditing without changing the local completed flag
                    this._completeNoteEditing(number);
                }
            }
        });

        const timer = new Timer(startTimestamp, endTimestamp);
        timer.displayElement = timerDisplay;
        timer.noteId = number;
        timer.additionalTime = additionalTime || 0; // Initialize with saved additional time
        timer.completed = completed; // Set timer's completed property
        
        // Initialize hasStarted based on content
        if ((failingIssues || nonFailingIssues || discussion || attemptID || projectID)) {
            timer.hasStarted = true;
        }
        
        timer.updateDisplay();
        // Resume updating the display if this timer was started and not yet completed
        if (timer.hasStarted && !timer.completed && !timer.endTimestamp) {
            timer.startDisplay();
        }

        noteContainer.appendChild(leftSidebar);
        noteContainer.appendChild(contentContainer);

        // Attach instance properties to mirror old note object
        this.timer = timer;
        this.container = noteContainer;
        this.elements = { ...sectionElements, attemptID: attemptIDInput, projectID: projectIDInput, operationID: operationIDInput };
        this.labels = sectionLabels;
        this.editButton = editButton;
        this.saveButton = saveButton;
        this.completed = completed;
        this.canceled = canceled;

        // Focus first textarea if new
        if (!completed) sectionElements.failingIssues.focus();
        
        // Listen for theme changes
        this.themeChangeHandler = () => {
            this.updateStyling();
            this.updateNumberDisplay();
            this.updateTimerDisplay();
            this.updateTextFieldStyles();
            this.updateButtonStyles();
            this.updateLabelStyles();
        };
        document.addEventListener('themeChanged', this.themeChangeHandler);
    }
    
    // Add cleanup method
    destroy() {
        if (this.themeChangeHandler) {
            document.removeEventListener('themeChanged', this.themeChangeHandler);
        }
        if (this.timer) {
            this.timer.stop();
        }
    }
    
    updateNumberDisplay() {
        const numberDisplay = this.container.querySelector('.font-bold.mb-2');
        if (!numberDisplay) return;
        
        // Remove all color classes
        numberDisplay.classList.remove('text-gray-600', 'text-red-600');
        
        if (this.canceled) {
            const cancelledTextColor = this.themeManager.getColor('note', 'cancelledText');
            numberDisplay.classList.add(cancelledTextColor);
        } else {
            const tertiaryTextColor = this.themeManager.getColor('text', 'tertiary');
            numberDisplay.classList.add(tertiaryTextColor);
        }
    }
    
    updateTimerDisplay() {
        if (!this.timer || !this.timer.displayElement) return;
        
        // Remove all possible timer color classes
        const oldClasses = Array.from(this.timer.displayElement.classList).filter(cls => 
            cls.startsWith('text-') || cls.includes('green') || cls.includes('gray') || cls.includes('red')
        );
        oldClasses.forEach(cls => this.timer.displayElement.classList.remove(cls));
        
        // Apply new color based on state
        let colorClass;
        if (this.completed) {
            colorClass = this.canceled ? 
                this.themeManager.getStatusClasses('error') : 
                this.themeManager.getStatusClasses('success');
        } else if (this.timer.hasStarted) {
            colorClass = this.themeManager.getColor('timer', 'active');
        } else {
            colorClass = this.themeManager.getColor('timer', 'inactive');
        }
        
        this.timer.displayElement.classList.add(colorClass);
    }
    
    updateTextFieldStyles() {
        Object.values(this.elements).forEach(element => {
            if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                // Remove old classes
                const oldClasses = Array.from(element.classList).filter(cls => 
                    cls.includes('bg-') || cls.includes('text-') || cls.includes('border-')
                );
                oldClasses.forEach(cls => element.classList.remove(cls));
                
                // Apply new classes based on state
                if (this.completed) {
                    const disabledClasses = this.themeManager.getTextareaClasses('disabled');
                    element.className = element.className.replace(/bg-\S+|text-\S+|border-\S+/g, '');
                    element.className += ' ' + disabledClasses;
                } else {
                    if (element.tagName === 'TEXTAREA') {
                        const textareaClasses = this.themeManager.getTextareaClasses();
                        element.className = element.className.replace(/bg-\S+|text-\S+|border-\S+/g, '');
                        element.className += ' ' + textareaClasses;
                    } else {
                        const inputClasses = this.themeManager.getInputClasses();
                        element.className = element.className.replace(/bg-\S+|text-\S+|border-\S+/g, '');
                        element.className += ' ' + inputClasses;
                    }
                }
            }
        });
    }
    
    updateButtonStyles() {
        if (this.editButton) {
            const oldClasses = Array.from(this.editButton.classList).filter(cls => 
                cls.includes('bg-') || cls.includes('hover:bg-') || cls.includes('text-')
            );
            oldClasses.forEach(cls => this.editButton.classList.remove(cls));
            
            const newClasses = this.themeManager.getPrimaryButtonClasses('sm');
            this.editButton.className = this.themeManager.combineClasses(
                'w-6 h-6 text-white rounded text-sm flex items-center justify-center leading-none',
                newClasses
            );
        }
    }
    
    updateLabelStyles() {
        Object.values(this.labels).forEach(label => {
            // Remove old text color classes
            const oldClasses = Array.from(label.classList).filter(cls => 
                cls.includes('text-')
            );
            oldClasses.forEach(cls => label.classList.remove(cls));
            
            // Apply new theme-aware classes
            label.className = this.themeManager.combineClasses(
                'font-bold mb-1',
                this.themeManager.getColor('text', 'secondary')
            );
        });
    }

    /**
     * Update the note's visual state when transitioning to completed
     */
    updateToCompletedState(isCanceled = false) {
        // Update completed state
        this.completed = true;
        this.canceled = isCanceled;
        
        // Update button visibility - edit button should show for completed notes
        this.editButton.style.display = 'block';
        this.saveButton.style.display = 'none';
        
        // Update placeholders (hide them)
        Object.values(this.elements).forEach(element => {
            if (element.placeholder !== undefined) {
                element.placeholder = '';
            }
        });
        
        // Update styling to match completed state
        this.updateStyling();
    }
    
    /**
     * Update the note's visual state when transitioning to editing
     */
    updateToEditingState() {
        // Update completed state
        this.completed = false;
        // Note: preserve this.canceled state
        
        // Update button visibility - save button should show for editing notes
        this.editButton.style.display = 'none';
        this.saveButton.style.display = 'block';
        
        // Restore placeholders
        Object.values(this.elements).forEach(element => {
            if (element.dataset.originalPlaceholder) {
                element.placeholder = element.dataset.originalPlaceholder;
            }
        });
        
        // Update styling to match editing state
        this.updateStyling();
    }
    
    /**
     * Update all styling based on current state
     */
    updateStyling() {
        // Update background - use card background for active notes to match text fields
        const backgroundClass = this.completed ?
            (this.canceled ? this.themeManager.getColor('note', 'cancelled') : this.themeManager.getColor('note', 'completed')) :
            this.themeManager.getColor('background', 'card');
        
        // Remove all possible background classes more comprehensively
        // First remove hardcoded classes
        this.container.classList.remove('bg-white', 'bg-gray-50', 'bg-red-50', 'bg-neutral-700', 'bg-neutral-800');
        
        // Remove theme-aware background classes for both light and dark themes
        const allBackgroundVariants = ['primary', 'secondary', 'tertiary', 'card', 'overlay'];
        const allNoteVariants = ['completed', 'cancelled'];
        
        // Get classes for both light and dark themes to ensure complete cleanup
        const currentTheme = this.themeManager.currentTheme;
        ['light', 'dark'].forEach(themeName => {
            // Temporarily switch theme to get the classes
            this.themeManager.currentTheme = themeName;
            
            // Remove background classes
            allBackgroundVariants.forEach(variant => {
                const cls = this.themeManager.getColor('background', variant);
                if (cls && cls.trim() !== '') {
                    this.container.classList.remove(cls);
                }
            });
            
            // Remove note state classes
            allNoteVariants.forEach(variant => {
                const cls = this.themeManager.getColor('note', variant);
                if (cls && cls.trim() !== '') {
                    this.container.classList.remove(cls);
                }
            });
        });
        
        // Restore original theme
        this.themeManager.currentTheme = currentTheme;
        
        // Add correct background for current theme
        if (backgroundClass && backgroundClass.trim() !== '') {
            this.container.classList.add(backgroundClass);
        }
        
        // Remove old opacity and border classes
        this.container.classList.remove('opacity-75', 'opacity-60', 'border', 'border-2');
        
        // Add subtle styling for completed notes
        if (this.completed && !this.canceled) {
            this.container.classList.add('opacity-75', 'border');
            const borderClass = this.themeManager.getColor('border', 'secondary');
            if (borderClass) this.container.classList.add(borderClass);
        } else if (this.completed && this.canceled) {
            this.container.classList.add('opacity-60', 'border-2');
            const errorClass = this.themeManager.getColor('status', 'error');
            if (errorClass) this.container.classList.add(errorClass);
        }
        
        // Update input and textarea styling - reconstruct classes completely
        Object.values(this.elements).forEach(element => {
            // Update disabled state
            element.disabled = this.completed;
            
            if (element.tagName === 'INPUT') {
                // Reconstruct input classes
                const classes = [
                    'w-full rounded px-2 py-1 text-sm border',
                    this.themeManager.getColor('border', 'secondary'),
                    this.themeManager.getFocusClasses().combined,
                    this.completed ? this.themeManager.getColor('background', 'secondary') : this.themeManager.getColor('background', 'card'),
                    this.completed ? this.themeManager.getColor('text', 'muted') : this.themeManager.getColor('text', 'primary')
                ].filter(cls => cls && cls.trim() !== '');
                
                element.className = classes.join(' ');
                // Preserve direction
                element.style.direction = 'rtl';
            } else if (element.tagName === 'TEXTAREA') {
                // Reconstruct textarea classes
                const baseClasses = 'w-full p-2 rounded text-base min-h-5 resize-none overflow-hidden border';
                const paddingClass = this.completed ? '' : 'pb-6';
                const classes = [
                    baseClasses,
                    paddingClass,
                    this.themeManager.getColor('border', 'secondary'),
                    this.themeManager.getFocusClasses().combined,
                    this.completed ? this.themeManager.getColor('background', 'secondary') : this.themeManager.getColor('background', 'card'),
                    this.completed ? this.themeManager.getColor('text', 'muted') : this.themeManager.getColor('text', 'primary')
                ].filter(cls => cls && cls.trim() !== '');
                
                element.className = classes.join(' ');
                // Preserve font family
                element.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
            }
        });
        
        // Update timer display color
        const timerDisplay = this.timer.displayElement;
        
        // Remove all possible timer color classes
        const statusClasses = ['success', 'error', 'info'].map(status => 
            this.themeManager.getStatusClasses(status)
        ).filter(cls => cls && cls.trim() !== '');
        
        // Remove hardcoded classes first
        timerDisplay.classList.remove('text-gray-600', 'text-green-600', 'text-red-600', 'text-gray-700');
        
        // Remove theme-aware status classes
        if (statusClasses.length > 0) {
            timerDisplay.classList.remove(...statusClasses);
        }
        
        // Add correct timer color
        let timerColorClass;
        if (this.completed) {
            timerColorClass = this.canceled ? 
                this.themeManager.getStatusClasses('error') : 
                this.themeManager.getStatusClasses('success');
        } else {
            timerColorClass = this.themeManager.getColor('timer', 'inactive');
        }
        
        // Only add the class if it's valid
        if (timerColorClass && timerColorClass.trim() !== '') {
            timerDisplay.classList.add(timerColorClass);
        }
    }

    /**
     * Show cancel confirmation inline within this note.
     */
    showCancelConfirmation() {
        // Prevent canceling if the timer hasn't started
        if (!this.timer.hasStarted) return;

        // Only one confirmation at a time
        if (this.confirmationDiv) return;
        const container = this.container;
        container.style.position = 'relative';
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = `absolute inset-0 ${this.themeManager.getColor('background', 'overlay')} bg-opacity-90 flex flex-col items-center justify-center p-4 z-10`;
        confirmationDiv.dataset.confirmation = 'cancel';
        this.confirmationDiv = confirmationDiv;

        // Grab note ID for callbacks
        const number = this.container.dataset.noteId;

        const title = document.createElement('h3');
        title.className = `text-lg font-bold ${this.themeManager.getColor('text', 'primary')} mb-2`;
        title.textContent = 'Cancel Note';
        confirmationDiv.appendChild(title);

        const message = document.createElement('p');
        message.className = `${this.themeManager.getColor('text', 'secondary')} mb-4 text-center`;
        message.textContent = 'Are you sure you want to cancel this note? This will stop the timer and mark the note as canceled.';
        confirmationDiv.appendChild(message);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex gap-2';
        confirmationDiv.appendChild(buttonContainer);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded';
        cancelBtn.textContent = 'No, Keep Note';
        cancelBtn.addEventListener('click', () => {
            container.removeChild(confirmationDiv);
            delete this.confirmationDiv;
        });
        buttonContainer.appendChild(cancelBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded';
        confirmBtn.textContent = 'Yes, Cancel Note';
        confirmBtn.addEventListener('click', () => {
            this._completeNoteEditing(number, true);
            container.removeChild(confirmationDiv);
            delete this.confirmationDiv;
        });
        buttonContainer.appendChild(confirmBtn);

        container.appendChild(confirmationDiv);
        confirmBtn.focus();
    }

    
    /** Format this note's IDs for copying */
    getFormattedIDs() {
        const project = this.elements.projectID.value || '';
        const op = this.elements.operationID.value || '';
        const attempt = this.elements.attemptID.value || '';
        return `• Project Name/ID: ${project}\n• Op ID: ${op}\n• Reason: \n• Task/Attempt ID(s): ${attempt}`;
    }

    /** Fallback copy for cases where clipboard API fails */
    fallbackCopy(text) {
        if (!text || text.trim() === '') {
            console.warn('Cannot copy empty text using fallback');
            return;
        }
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (!successful) console.error('fallbackCopy: Unable to copy text');
        } catch (err) {
            console.error('fallbackCopy failed:', err);
        }
    }

    /** Paste clipboard content as formatted bullet point */
    async pasteAsFormattedBullet() {
        try {
            let clipboardText = '';
            
            // Try to get clipboard content
            if (navigator.clipboard && navigator.clipboard.readText) {
                clipboardText = await navigator.clipboard.readText();
            } else {
                // Fallback - can't read clipboard without modern API
                console.warn('Clipboard API not available, cannot read clipboard content');
                return;
            }
            
            if (!clipboardText.trim()) {
                return;
            }
            
            // Format as bullet point with brackets
            const formattedText = `- [${clipboardText.trim()}] `;
            
            // Find the currently focused textarea within this note
            const activeElement = document.activeElement;
            const noteTextareas = [
                this.elements.failingIssues,
                this.elements.nonFailingIssues,
                this.elements.discussion
            ];
            
            let targetTextarea = null;
            if (noteTextareas.includes(activeElement)) {
                targetTextarea = activeElement;
            } else {
                // Default to the first textarea if none is focused
                targetTextarea = this.elements.failingIssues;
            }
            
            // Insert the formatted text at cursor position
            const start = targetTextarea.selectionStart;
            const end = targetTextarea.selectionEnd;
            const value = targetTextarea.value;
            targetTextarea.value = value.slice(0, start) + formattedText + value.slice(end);
            targetTextarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
            
            // Trigger input event to update height and save
            targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Focus the textarea
            targetTextarea.focus();
            
        } catch (err) {
            console.error('Failed to paste formatted bullet:', err);
        }
    }

    /**
     * Save this note to localStorage.
     */
    save(startTimestamp, endTimestamp, completed, canceled = false) {
        const savedNotes = JSON.parse(localStorage.getItem(this.date) || '{}');
        const number = this.container.dataset.noteId;
        const noteData = {
            failingIssues: this.elements.failingIssues.value || '',
            nonFailingIssues: this.elements.nonFailingIssues.value || '',
            discussion: this.elements.discussion.value || '',
            startTimestamp: startTimestamp || this.timer.startTimestamp || Date.now(),
            endTimestamp: endTimestamp,
            completed: completed,
            projectID: this.elements.projectID.value || '',
            attemptID: this.elements.attemptID.value || '',
            operationID: this.elements.operationID.value || '',
            additionalTime: this.timer.additionalTime || 0,
            hasStarted: this.timer.hasStarted,
            canceled: canceled || this.canceled
        };
        savedNotes[number] = noteData;
        localStorage.setItem(this.date, JSON.stringify(savedNotes));
    }

    /** Format this note's full text for copying */
    getFormattedText() {
        const parts = [];
        if (this.elements.failingIssues.value.trim()) {
            parts.push(`Failing issues:\n${this.elements.failingIssues.value}`);
        }
        if (this.elements.nonFailingIssues.value.trim()) {
            parts.push(`Non-failing issues:\n${this.elements.nonFailingIssues.value}`);
        }
        if (this.elements.discussion.value.trim()) {
            parts.push(`Discussion:\n${this.elements.discussion.value}`);
        }
        return parts.join('\n\n');
    }
}

export default Note;