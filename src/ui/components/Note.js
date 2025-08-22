import Timer from './Timer.js';
import { SecurityUtils } from '../../core/utils/SecurityUtils.js';
import { NotesRepository } from '../../core/data/NotesRepository.js';

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
        // Note: Data will be loaded asynchronously
        const noteData = {};
        this.loadNoteDataAsync(date, number);
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
        
        // Store as instance properties for later updates
        this.completed = completed;
        this.canceled = canceled;
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

        // Create menu button container with Tailwind classes
        const menuContainer = document.createElement('div');
        menuContainer.className = 'absolute top-2 right-2 z-30 w-8 h-8';
        
        // Create hamburger menu button with Tailwind classes
        const menuButton = document.createElement('button');
        menuButton.className = 'w-8 h-8 bg-transparent border-none rounded flex flex-col items-center justify-center cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';
        
        // Create three visible hamburger bars with Tailwind classes
        for (let i = 0; i < 3; i++) {
            const bar = document.createElement('div');
            bar.className = 'w-4 h-0.5 bg-gray-500 dark:bg-gray-400 rounded-sm block';
            if (i === 1) {
                bar.className += ' my-0.5';
            }
            menuButton.appendChild(bar);
        }
        
        menuButton.title = 'Note options';
        console.log('Creating hamburger menu button:', menuButton);
        
        // Create dropdown menu
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = this.themeManager.combineClasses(
            'fixed mt-1 py-2 w-48 rounded-lg shadow-xl border hidden z-50',
            this.themeManager.getColor('background', 'card'),
            this.themeManager.getColor('border', 'primary')
        );
        
        // Store references for later updates
        this.menuButton = menuButton;
        this.dropdownMenu = dropdownMenu;
        
        // Build menu options based on note state (defer until after container setup)
        setTimeout(() => this.buildMenuOptions(), 0);
        
        // Toggle dropdown on button click
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuContainer.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        menuContainer.appendChild(menuButton);
        menuContainer.appendChild(dropdownMenu);
        noteContainer.appendChild(menuContainer);

        // Left sidebar with number, timer and ID fields
        const leftSidebar = document.createElement('div');
        leftSidebar.className = 'flex flex-col mr-4 min-w-32';

        // Number display - hide for cancelled notes, use provided displayIndex for non-cancelled notes
        const numberDisplay = document.createElement('div');
        this.numberDisplay = numberDisplay; // Store reference for later updates
        this.displayIndex = displayIndex; // Store the original display index
        numberDisplay.className = `${this.themeManager.getColor('text', 'tertiary')} text-base mb-2`;
        // If note is completed and cancelled, show "CANCELED"; otherwise, show its position among non-cancelled notes
        if (completed && canceled) {
            numberDisplay.textContent = "CANCELED";
            numberDisplay.className = `${this.themeManager.getColor('note', 'cancelledNumber')} text-base mb-2`;
        } else {
            // Use provided displayIndex
            numberDisplay.textContent = String(displayIndex);
        }
        leftSidebar.appendChild(numberDisplay);

        // Timer display with theme-aware colors
        const timerDisplay = document.createElement('div');
        let timerColorClass;
        const hasStarted = startTimestamp !== null || failingIssues || nonFailingIssues || discussion || attemptID || projectID || operationID;
        const isRunning = hasStarted && !endTimestamp;
        
        if (completed) {
            timerColorClass = canceled ? 
                this.themeManager.getStatusClasses('error') : 
                this.themeManager.getStatusClasses('success');
        } else if (isRunning) {
            timerColorClass = this.themeManager.getColor('timer', 'inactive'); // Grey for running
        } else if (hasStarted && endTimestamp) {
            timerColorClass = this.themeManager.getColor('timer', 'active'); // Green for stopped
        } else {
            timerColorClass = this.themeManager.getColor('timer', 'inactive'); // Grey for not started
        }
        timerDisplay.className = `font-mono text-sm mb-3 ${timerColorClass}`;
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

            // Auto-resize textarea with proper timing
            this.adjustTextareaHeights(sectionElements);
            

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
                }
                this.save(timer.startTimestamp, timer.endTimestamp, completed).catch(console.error);
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
            }
            this.save(timer.startTimestamp, timer.endTimestamp, completed).catch(console.error);
        });
        
        projectIDInput.addEventListener('input', () => {
            if (!timer.hasStarted && !completed) {
                timer.hasStarted = true;
                timer.start();
            }
            this.save(timer.startTimestamp, timer.endTimestamp, completed).catch(console.error);
        });

        // Add event listener for Operation ID
        operationIDInput.addEventListener('input', () => {
            if (!timer.hasStarted && !completed) {
                timer.hasStarted = true;
                timer.start();
            }
            this.save(timer.startTimestamp, timer.endTimestamp, completed).catch(console.error);
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
                // Use the new copyFormattedIDs method
                this.copyFormattedIDs();
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
                // Use the new copyFormattedText method
                this.copyFormattedText();
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
            this.buildMenuOptions(); // Rebuild menu with new theme
        };
        document.addEventListener('themeChanged', this.themeChangeHandler);
    }
    
    // Add cleanup method
    destroy() {
        if (this.themeChangeHandler) {
            document.removeEventListener('themeChanged', this.themeChangeHandler);
        }
        if (this.timer) {
            // Only stop display updates, don't stop the timer itself
            this.timer.stopDisplay();
        }
    }
    
    /**
     * Adjusts textarea heights with proper timing to ensure all CSS and fonts are loaded
     */
    adjustTextareaHeights(sectionElements) {
        const adjustHeights = () => {
            Object.values(sectionElements).forEach(textarea => {
                if (textarea && textarea.tagName === 'TEXTAREA') {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                }
            });
        };

        // Wait for all stylesheets to load, fonts to be ready, and DOM to be fully rendered
        Promise.all([
            document.fonts ? document.fonts.ready : Promise.resolve(),
            new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            })
        ]).then(() => {
            // Use requestAnimationFrame to ensure DOM is fully rendered
            requestAnimationFrame(() => {
                // Double requestAnimationFrame for better reliability
                requestAnimationFrame(() => {
                    adjustHeights();
                    
                    // Additional fallback adjustment after a short delay
                    setTimeout(adjustHeights, 10);
                });
            });
        }).catch(() => {
            // Fallback if promises fail
            setTimeout(adjustHeights, 100);
        });
    }
    
    updateNumberDisplay() {
        if (!this.numberDisplay) return;
        
        // Clear existing classes and rebuild
        this.numberDisplay.className = '';
        
        if (this.completed && this.canceled) {
            // Update text to show "CANCELED" for cancelled notes
            this.numberDisplay.textContent = "CANCELED";
            this.numberDisplay.className = `${this.themeManager.getColor('note', 'cancelledNumber')} text-base mb-2`;
        } else {
            // For non-cancelled notes, show the original display index
            this.numberDisplay.textContent = String(this.displayIndex);
            this.numberDisplay.className = `${this.themeManager.getColor('text', 'tertiary')} text-base mb-2`;
        }
    }
    
    updateTimerDisplay() {
        if (!this.timer || !this.timer.displayElement) return;
        
        // Remove all theme-related classes
        this.removeAllThemeClasses(this.timer.displayElement);
        
        // Apply new color based on state
        let colorClass;
        if (this.completed) {
            colorClass = this.canceled ? 
                this.themeManager.getStatusClasses('error') : 
                this.themeManager.getStatusClasses('success');
        } else if (this.timer.hasStarted && !this.timer.endTimestamp) {
            // Timer is currently running - use grey (inactive color)
            colorClass = this.themeManager.getColor('timer', 'inactive');
        } else if (this.timer.hasStarted && this.timer.endTimestamp) {
            // Timer has been stopped - use green (active color)
            colorClass = this.themeManager.getColor('timer', 'active');
        } else {
            // Timer hasn't started yet - use grey
            colorClass = this.themeManager.getColor('timer', 'inactive');
        }
        
        if (colorClass && colorClass.trim() !== '') {
            this.timer.displayElement.classList.add(colorClass);
        }
    }
    
    updateTextFieldStyles() {
        Object.values(this.elements).forEach(element => {
            if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                // Store non-theme classes
                const nonThemeClasses = Array.from(element.classList).filter(cls => 
                    !cls.match(/^(bg|text|border|placeholder|hover:bg|hover:text|hover:border|focus|opacity|shadow)-/)
                );
                
                // Clear all classes
                element.className = '';
                
                // Restore non-theme classes
                if (nonThemeClasses.length > 0) {
                    element.classList.add(...nonThemeClasses);
                }
                
                // Apply new theme classes based on state and element type
                if (element.tagName === 'INPUT') {
                    const baseClasses = 'w-full rounded px-2 py-1 text-sm border';
                    const themeClasses = [
                        this.themeManager.getColor('border', 'secondary'),
                        this.themeManager.getFocusClasses().combined,
                        this.completed ? this.themeManager.getColor('background', 'secondary') : this.themeManager.getColor('background', 'card'),
                        this.completed ? this.themeManager.getColor('text', 'muted') : this.themeManager.getColor('text', 'primary')
                    ].filter(cls => cls && cls.trim() !== '').join(' ');
                    
                    element.className = `${baseClasses} ${themeClasses}`;
                } else if (element.tagName === 'TEXTAREA') {
                    const baseClasses = 'w-full p-2 rounded text-base min-h-5 resize-none overflow-hidden border';
                    const paddingClass = this.completed ? '' : 'pb-6';
                    const themeClasses = [
                        this.themeManager.getColor('border', 'secondary'),
                        this.themeManager.getFocusClasses().combined,
                        this.completed ? this.themeManager.getColor('background', 'secondary') : this.themeManager.getColor('background', 'card'),
                        this.completed ? this.themeManager.getColor('text', 'muted') : this.themeManager.getColor('text', 'primary')
                    ].filter(cls => cls && cls.trim() !== '').join(' ');
                    
                    element.className = `${baseClasses} ${paddingClass} ${themeClasses}`;
                }
            }
        });
    }
    
    updateButtonStyles() {
        if (this.menuButton) {
            // Update button with Tailwind classes for theme
            this.menuButton.className = 'w-8 h-8 bg-transparent border-none rounded flex flex-col items-center justify-center cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';
            
            // Update bar colors with Tailwind classes
            const bars = this.menuButton.querySelectorAll('div');
            bars.forEach((bar, index) => {
                bar.className = 'w-4 h-0.5 bg-gray-500 dark:bg-gray-400 rounded-sm block';
                if (index === 1) {
                    bar.className += ' my-0.5';
                }
            });
        }
        if (this.dropdownMenu) {
            // Update dropdown styling
            const baseClasses = 'fixed mt-1 py-2 w-48 rounded-lg shadow-xl border hidden z-50';
            this.dropdownMenu.className = this.themeManager.combineClasses(
                baseClasses,
                this.themeManager.getColor('background', 'card'),
                this.themeManager.getColor('border', 'primary')
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
        
        // Update number display (for cancelled notes)
        this.updateNumberDisplay();
        
        // Rebuild menu options for completed state
        this.buildMenuOptions();
        
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
        
        // Restart the timer - clear endTimestamp and start display updates
        if (this.timer && this.timer.hasStarted) {
            this.timer.restart();
        }
        
        // Rebuild menu options for editing state
        this.buildMenuOptions();
        
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
     * Helper method to remove all theme-related classes from an element
     */
    removeAllThemeClasses(element) {
        // Remove all Tailwind color classes
        const classesToRemove = Array.from(element.classList).filter(cls => 
            cls.match(/^(bg|text|border|placeholder|hover:bg|hover:text|hover:border)-/) ||
            cls.match(/^(opacity|shadow)-/)
        );
        classesToRemove.forEach(cls => element.classList.remove(cls));
    }

    /**
     * Update all styling based on current state
     */
    updateStyling() {
        // Update background - use card background for active notes to match text fields
        const backgroundClass = this.completed ?
            (this.canceled ? this.themeManager.getColor('note', 'cancelled') : this.themeManager.getColor('note', 'completed')) :
            this.themeManager.getColor('background', 'card');
        
        // Remove all theme-related classes from container
        this.removeAllThemeClasses(this.container);
        
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
        
        // Update input and textarea styling using the helper method
        this.updateTextFieldStyles();
        
        // Preserve special styles
        Object.values(this.elements).forEach(element => {
            // Update disabled state
            element.disabled = this.completed;
            
            if (element.tagName === 'INPUT') {
                // Preserve direction
                element.style.direction = 'rtl';
            } else if (element.tagName === 'TEXTAREA') {
                // Preserve font family
                element.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
            }
        });
        
        // Update timer display color using dedicated method
        this.updateTimerDisplay();
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
            // Mark as canceled and update display immediately
            this.completed = true;
            this.canceled = true;
            this.updateNumberDisplay();
            container.removeChild(confirmationDiv);
            delete this.confirmationDiv;
        });
        buttonContainer.appendChild(confirmBtn);

        container.appendChild(confirmationDiv);
        confirmBtn.focus();
    }

    /**
     * Show delete confirmation inline within this note.
     */
    showDeleteConfirmation() {
        // Only one confirmation at a time
        if (this.confirmationDiv) return;
        const container = this.container;
        container.style.position = 'relative';
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = `absolute inset-0 ${this.themeManager.getColor('background', 'overlay')} bg-opacity-90 flex flex-col items-center justify-center p-4 z-10`;
        confirmationDiv.dataset.confirmation = 'delete';
        this.confirmationDiv = confirmationDiv;

        // Grab note ID for callbacks
        const number = this.container.dataset.noteId;

        const title = document.createElement('h3');
        title.className = `text-lg font-bold ${this.themeManager.getColor('text', 'primary')} mb-2`;
        title.textContent = 'Delete Note';
        confirmationDiv.appendChild(title);

        const message = document.createElement('p');
        message.className = `${this.themeManager.getColor('text', 'secondary')} mb-4 text-center`;
        message.textContent = 'Are you sure you want to delete this note? This action cannot be undone.';
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
        confirmBtn.textContent = 'Yes, Delete Note';
        confirmBtn.addEventListener('click', () => {
            this._deleteNote(number);
            container.removeChild(confirmationDiv);
            delete this.confirmationDiv;
        });
        buttonContainer.appendChild(confirmBtn);

        container.appendChild(confirmationDiv);
        confirmBtn.focus();
    }

    
    /**
     * Build menu options based on current note state
     */
    buildMenuOptions() {
        if (!this.dropdownMenu || !this.container) return;
        
        // Clear existing options
        this.dropdownMenu.innerHTML = '';
        
        const number = this.container.dataset.noteId || this.number;
        
        if (this.completed) {
            // Options for completed notes
            this.addMenuOption('Edit Note', () => {
                this._enableNoteEditing(number);
                this.closeDropdown();
            });
            
            this.addMenuOption('Copy Feedback', () => {
                this.copyFormattedText();
                this.closeDropdown();
            });
            
            this.addMenuSeparator();
            
            this.addMenuOption('Delete Note', () => {
                this.showDeleteConfirmation();
                this.closeDropdown();
            }, this.themeManager.getStatusClasses('error') || 'text-red-600 hover:text-red-700');
        } else {
            // Options for active/editing notes
            this.addMenuOption('Save Note', () => {
                this._completeNoteEditing(number);
                this.closeDropdown();
            }, this.themeManager.getStatusClasses('success') || 'text-green-600 hover:text-green-700');
            
            this.addMenuOption('Cancel Operation', () => {
                // Copy formatted IDs like F1 does
                this.copyFormattedIDs();
                this.showCancelConfirmation();
                this.closeDropdown();
            }, this.themeManager.getStatusClasses('warning') || 'text-yellow-600 hover:text-yellow-700');
            
            this.addMenuOption('Copy Feedback', () => {
                this.copyFormattedText();
                this.closeDropdown();
            });
            
            this.addMenuOption('Delete Note', () => {
                this.showDeleteConfirmation();
                this.closeDropdown();
            }, this.themeManager.getStatusClasses('error') || 'text-red-600 hover:text-red-700');
        }
    }
    
    /**
     * Add a menu option to the dropdown
     */
    addMenuOption(text, onClick, extraClasses = '') {
        const option = document.createElement('button');
        const baseHoverClass = this.themeManager.getColor('background', 'hover') || 'hover:bg-gray-100';
        
        option.className = this.themeManager.combineClasses(
            'w-full px-4 py-2 text-left text-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis',
            baseHoverClass,
            this.themeManager.getColor('text', 'primary'),
            extraClasses
        );
        
        option.textContent = text;
        option.addEventListener('click', onClick);
        
        this.dropdownMenu.appendChild(option);
    }
    
    /**
     * Add a separator to the dropdown menu
     */
    addMenuSeparator() {
        const separator = document.createElement('div');
        separator.className = this.themeManager.combineClasses(
            'h-px mx-2 my-1',
            this.themeManager.getColor('border', 'secondary')
        );
        this.dropdownMenu.appendChild(separator);
    }
    
    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        if (this.dropdownMenu.classList.contains('hidden')) {
            // Position the fixed dropdown relative to the menu button
            const buttonRect = this.menuButton.getBoundingClientRect();
            this.dropdownMenu.style.top = (buttonRect.bottom + 4) + 'px';
            this.dropdownMenu.style.right = (window.innerWidth - buttonRect.right) + 'px';
            this.dropdownMenu.classList.remove('hidden');
        } else {
            this.dropdownMenu.classList.add('hidden');
        }
    }
    
    /**
     * Close dropdown menu
     */
    closeDropdown() {
        if (this.dropdownMenu) {
            this.dropdownMenu.classList.add('hidden');
        }
    }
    
    /**
     * Copy formatted text with clipboard API
     */
    async copyFormattedText() {
        const text = this.getFormattedText();
        if (!text || text.trim() === '') {
            console.warn('Cannot copy empty text');
            return;
        }
        
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                this.fallbackCopy(text);
            }
        } catch (err) {
            console.error('Failed to copy formatted text:', err);
            this.fallbackCopy(text);
        }
    }
    
    /**
     * Copy formatted IDs with clipboard API
     */
    async copyFormattedIDs() {
        const formattedIDs = this.getFormattedIDs();
        if (!formattedIDs || formattedIDs.trim() === '') {
            console.warn('Cannot copy empty formatted IDs');
            return;
        }
        
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(formattedIDs);
            } else {
                this.fallbackCopy(formattedIDs);
            }
        } catch (err) {
            console.error('Failed to copy formatted IDs:', err);
            this.fallbackCopy(formattedIDs);
        }
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
            
            // Insert the formatted text at cursor position using document.execCommand for proper undo support
            const start = targetTextarea.selectionStart;
            const end = targetTextarea.selectionEnd;
            
            // Focus the textarea and set selection
            targetTextarea.focus();
            targetTextarea.setSelectionRange(start, end);
            
            // Use execCommand to insert text so it registers in the undo stack
            document.execCommand('insertText', false, formattedText);
            
            // The execCommand will trigger a natural input event, so we don't need to dispatch a synthetic one
            // This preserves the undo stack functionality
            
        } catch (err) {
            console.error('Failed to paste formatted bullet:', err);
        }
    }

    /**
     * Save this note to localStorage.
     */
    async save(startTimestamp, endTimestamp, completed, canceled = false) {
        const number = this.container.dataset.noteId;
        // Sanitize all user input fields before saving
        const noteData = {
            failingIssues: SecurityUtils.sanitizeInput(this.elements.failingIssues.value || ''),
            nonFailingIssues: SecurityUtils.sanitizeInput(this.elements.nonFailingIssues.value || ''),
            discussion: SecurityUtils.sanitizeInput(this.elements.discussion.value || ''),
            startTimestamp: startTimestamp || this.timer.startTimestamp || Date.now(),
            endTimestamp: endTimestamp,
            completed: completed,
            projectID: SecurityUtils.sanitizeInput(this.elements.projectID.value || ''),
            attemptID: SecurityUtils.sanitizeInput(this.elements.attemptID.value || ''),
            operationID: SecurityUtils.sanitizeInput(this.elements.operationID.value || ''),
            additionalTime: this.timer.additionalTime || 0,
            hasStarted: this.timer.hasStarted,
            canceled: canceled || this.canceled
        };
        await NotesRepository.saveNote(this.date, number, noteData);
    }

    /**
     * Load note data asynchronously
     */
    async loadNoteDataAsync(date, number) {
        try {
            const savedNotes = await NotesRepository.getNotesForDate(date);
            const noteData = savedNotes[number] || {};
            
            // Update fields with loaded data if they exist
            if (this.elements) {
                if (noteData.failingIssues && this.elements.failingIssues) {
                    this.elements.failingIssues.value = noteData.failingIssues;
                }
                if (noteData.nonFailingIssues && this.elements.nonFailingIssues) {
                    this.elements.nonFailingIssues.value = noteData.nonFailingIssues;
                }
                if (noteData.discussion && this.elements.discussion) {
                    this.elements.discussion.value = noteData.discussion;
                }
                if (noteData.attemptID && this.elements.attemptID) {
                    this.elements.attemptID.value = noteData.attemptID;
                }
                if (noteData.projectID && this.elements.projectID) {
                    this.elements.projectID.value = noteData.projectID;
                }
                if (noteData.operationID && this.elements.operationID) {
                    this.elements.operationID.value = noteData.operationID;
                }
            }
            
            // Update timer if it exists
            if (this.timer && noteData.startTimestamp) {
                this.timer.startTimestamp = noteData.startTimestamp;
                this.timer.endTimestamp = noteData.endTimestamp;
                this.timer.additionalTime = noteData.additionalTime || 0;
                this.timer.hasStarted = noteData.hasStarted || false;
                this.timer.updateDisplay();
            }
            
            // Update completed/canceled status
            if (noteData.completed) {
                this.completed = true;
                const completedClass = noteData.canceled ? 
                    (this.themeManager?.getColor('note', 'cancelled') || 'bg-red-50') :
                    (this.themeManager?.getColor('note', 'completed') || 'bg-gray-50');
                this.container.className = this.container.className.replace(/bg-\w+-\d+/, '') + ' ' + completedClass;
                
                if (noteData.canceled) {
                    this.canceled = true;
                    // Update the number display to show "CANCELED"
                    this.updateNumberDisplay();
                }
            }
        } catch (error) {
            console.error('Error loading note data:', error);
        }
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