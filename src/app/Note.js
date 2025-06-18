import Timer from '../components/Timer.js';

// Add Note class wrapper for note creation logic
export class Note {
    constructor(number, date, displayIndex, { enableEditing, completeEditing, deleteNote, markEditing}) {
        // Minimal context for this Note
        this.number = number;
        this.date = date;
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
        // Create the note container with improved styling - changed to flex-col for horizontal layout
        const noteContainer = document.createElement('div');
        noteContainer.className = 'flex flex-col mb-4 p-5 rounded-lg shadow-sm border border-gray-100 relative group transition-shadow hover:shadow-md ' +
            (completed ?
                (canceled ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200') :
                'bg-white border-gray-100');
        noteContainer.dataset.noteId = number;

        // Create action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity';
        
        const editButton = document.createElement('button');
        editButton.className = 'w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center justify-center';
        editButton.innerHTML = '✎';
        editButton.title = 'Edit note';
        editButton.style.display = completed ? 'block' : 'none';

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

        // Top header with note number, timer, and ID fields in horizontal layout
        const topHeader = document.createElement('div');
        topHeader.className = 'flex items-center gap-4 mb-3 pb-2 border-b-2 border-gray-300 bg-gray-50 -mx-5 -mt-5 px-5 pt-3 rounded-t-lg';

        // Note number display
        const numberDisplay = document.createElement('div');
        numberDisplay.className = 'text-lg font-bold flex-shrink-0';
        if (completed && canceled) {
            numberDisplay.textContent = "Cancelled";
            numberDisplay.className = 'text-lg font-bold flex-shrink-0 text-red-600';
        } else {
            numberDisplay.textContent = `#${displayIndex}`;
            numberDisplay.className = 'text-lg font-bold flex-shrink-0 text-gray-700';
        }
        topHeader.appendChild(numberDisplay);

        // Timer display
        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'font-mono text-lg font-semibold flex-shrink-0 ' + 
            (completed ? 
                (canceled ? 'text-red-600' : 'text-green-600') : 
                'text-gray-600');
        timerDisplay.textContent = '00:00:00';
        topHeader.appendChild(timerDisplay);

        // ID fields container - horizontal layout with improved styling
        const idFieldsContainer = document.createElement('div');
        idFieldsContainer.className = 'flex gap-4 flex-grow';
        
        // Create ID field function for both active and completed notes
        const createIDField = (value, placeholder, label) => {
            const group = document.createElement('div');
            group.className = 'flex flex-col';
            
            const labelEl = document.createElement('label');
            labelEl.className = 'text-xs font-medium text-gray-600 mb-1';
            labelEl.textContent = label;
            
            const input = document.createElement('input');
            input.className = 'w-40 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ' + 
                              (completed ? 'bg-gray-100 text-gray-500' : 'bg-white text-black');
            input.style.direction = 'rtl';
            input.placeholder = placeholder;
            input.value = value;
            input.disabled = completed;
            
            group.appendChild(labelEl);
            group.appendChild(input);
            
            return { group, input };
        };
        
        // Project ID field
        const projectField = createIDField(projectID, 'Enter project ID', 'Project ID');
        const attemptField = createIDField(attemptID, 'Enter attempt ID', 'Attempt ID');
        const operationField = createIDField(operationID, 'Enter op ID', 'Operation ID');
        
        idFieldsContainer.appendChild(projectField.group);
        idFieldsContainer.appendChild(attemptField.group);
        idFieldsContainer.appendChild(operationField.group);
        
        const projectIDInput = projectField.input;
        const attemptIDInput = attemptField.input;
        const operationIDInput = operationField.input;
        
        topHeader.appendChild(idFieldsContainer);

        // Content container - now full width below the header
        const contentContainer = document.createElement('div');
        contentContainer.className = 'flex flex-col gap-3 min-w-0';

        // Create the three sections
        const sections = [
            { label: 'Failing issues:', value: failingIssues, key: 'failingIssues' },
            { label: 'Non-failing issues:', value: nonFailingIssues, key: 'nonFailingIssues' },
            { label: 'Discussion:', value: discussion, key: 'discussion' }
        ];

        const sectionElements = {};

        sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'flex flex-col';

            const label = document.createElement('div');
            label.className = 'font-bold mb-1 text-gray-700';
            label.textContent = section.label;

            const textarea = document.createElement('textarea');
            // Set the original font family
            textarea.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
            textarea.className = 'w-full p-2 border border-gray-300 rounded text-base min-h-5 resize-none overflow-hidden ' + 
                     (completed ? 'text-gray-500' : 'text-black');
            textarea.placeholder = `Type ${section.label.toLowerCase().replace(':', '')}...`;
            textarea.value = section.value;
            textarea.disabled = completed;
            
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
                // Use clipboard API or fallback
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(formattedIDs)
                        .catch(err => {
                            console.error('Failed to copy formatted IDs: ', err);
                            this.fallbackCopy(formattedIDs);
                        });
                } else {
                    this.fallbackCopy(formattedIDs);
                }
                // Show inline cancel confirmation on this note
                this.showCancelConfirmation();
            }
            if (e.ctrlKey && e.key === 'x') {
                // Don't prevent default to allow normal copy behavior in addition to our custom one
                const text = this.getFormattedText();
                // Check if clipboard API is available
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text)
                        .catch(err => {
                            console.error('Failed to copy: ', err);
                            this.fallbackCopy(text);
                        });
                } else {
                    this.fallbackCopy(text);
                }
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

        noteContainer.appendChild(topHeader);
        noteContainer.appendChild(contentContainer);

        // Attach instance properties to mirror old note object
        this.timer = timer;
        this.container = noteContainer;
        this.elements = { ...sectionElements, attemptID: attemptIDInput, projectID: projectIDInput, operationID: operationIDInput };
        this.editButton = editButton;
        this.saveButton = saveButton;
        this.completed = completed;
        this.canceled = canceled;

        // Focus first textarea if new
        if (!completed) sectionElements.failingIssues.focus();
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
        confirmationDiv.className = 'absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-4 z-10';
        confirmationDiv.dataset.confirmation = 'cancel';
        this.confirmationDiv = confirmationDiv;

        // Grab note ID for callbacks
        const number = this.container.dataset.noteId;

        const title = document.createElement('h3');
        title.className = 'text-lg font-bold text-gray-900 mb-2';
        title.textContent = 'Cancel Note';
        confirmationDiv.appendChild(title);

        const message = document.createElement('p');
        message.className = 'text-gray-700 mb-4 text-center';
        message.textContent = 'Are you sure you want to cancel this note? This will stop the timer and mark the note as canceled.';
        confirmationDiv.appendChild(message);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex gap-2';
        confirmationDiv.appendChild(buttonContainer);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded';
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