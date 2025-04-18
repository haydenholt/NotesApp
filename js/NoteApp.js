import Timer from './Timer.js';
import OffPlatformTimer from './OffPlatformTimer.js';

/**
 * Main application class for managing notes
 */
export class NoteApp {
    constructor() {
        this.notes = [];
        this.container = document.getElementById('notesContainer');
        this.totalTimeDisplay = document.getElementById('totalTime');
        this.dateSelector = document.getElementById('dateSelector');
        this.statsDisplay = document.getElementById('statsDisplay');
        this.projectFailRateDisplay = document.getElementById('projectFailRateDisplay');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchButton = document.getElementById('clearSearchButton');
        this.originalNotes = []; // Store original notes for search filtering
        this.isSearchActive = false;
        
        // Initialize off-platform timer
        this.offPlatformTimer = new OffPlatformTimer();
        
        // Initialize date
        const today = new Date().toISOString().split('T')[0];
        this.dateSelector.value = today;
        this.currentDate = today;
    
        // Set up event listeners
        this.dateSelector.addEventListener('change', () => {
            // Stop all note timers but keep off-platform timers running
            this.stopAllNoteTimers();
            
            // Update current date
            this.currentDate = this.dateSelector.value;
            
            // Only reload notes if not in search mode
            if (!this.isSearchActive) {
                // Make sure off-platform container is visible in normal mode
                const offPlatformContainer = document.getElementById('offPlatformContainer');
                if (offPlatformContainer) {
                    offPlatformContainer.style.display = '';
                }
                
                this.loadNotes();
            } else {
                // In search mode, hide the off-platform container
                const offPlatformContainer = document.getElementById('offPlatformContainer');
                if (offPlatformContainer) {
                    offPlatformContainer.style.display = 'none';
                }
                
                // Re-run the search with the new date context
                this.searchNotes(this.searchInput.value.trim());
            }
        });
        
        // Add date navigation buttons
        this.addDateNavigationButtons();
        
        // Set up search functionality
        this.searchInput.addEventListener('input', () => {
            const query = this.searchInput.value.trim();
            if (query === '' && this.isSearchActive) {
                // Reset to current date view when clearing an active search
                this.isSearchActive = false;
                this.loadNotes();
            } else if (query !== '') {
                this.searchNotes(query);
            }
        });
        
        this.clearSearchButton.addEventListener('click', () => {
            this.searchInput.value = '';
            this.isSearchActive = false;
            
            // Show the off-platform container again
            const offPlatformContainer = document.getElementById('offPlatformContainer');
            if (offPlatformContainer) {
                offPlatformContainer.style.display = '';
            }
            
            this.loadNotes();
        });
    
        this.loadNotes();
        this.updateTotalTime();
        
        // Make the app instance globally available for the Timer class
        window.app = this;
    }
    
    // New method to add date navigation buttons
    addDateNavigationButtons() {
        // Create wrapper for the date picker and buttons
        const dateNavContainer = document.createElement('div');
        dateNavContainer.className = 'flex items-center';
        
        // Previous day button
        const prevDayButton = document.createElement('button');
        prevDayButton.innerHTML = '&larr;'; // Left arrow
        prevDayButton.className = 'px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-l';
        prevDayButton.title = 'Previous day';
        prevDayButton.addEventListener('click', () => {
            // Stop all note timers but keep off-platform timers running
            this.stopAllNoteTimers();
            
            const currentDate = new Date(this.dateSelector.value);
            currentDate.setDate(currentDate.getDate() - 1);
            this.dateSelector.value = currentDate.toISOString().split('T')[0];
            this.currentDate = this.dateSelector.value;
            
            // Only reload notes if not in search mode
            if (!this.isSearchActive) {
                // Make sure off-platform container is visible in normal mode
                const offPlatformContainer = document.getElementById('offPlatformContainer');
                if (offPlatformContainer) {
                    offPlatformContainer.style.display = '';
                }
                
                this.loadNotes();
            } else {
                // In search mode, hide the off-platform container
                const offPlatformContainer = document.getElementById('offPlatformContainer');
                if (offPlatformContainer) {
                    offPlatformContainer.style.display = 'none';
                }
                
                // Re-run the search with the new date context
                this.searchNotes(this.searchInput.value.trim());
            }
        });
        
        // Next day button
        const nextDayButton = document.createElement('button');
        nextDayButton.innerHTML = '&rarr;'; // Right arrow
        nextDayButton.className = 'px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-r';
        nextDayButton.title = 'Next day';
        nextDayButton.addEventListener('click', () => {
            // Stop all note timers but keep off-platform timers running
            this.stopAllNoteTimers();
            
            const currentDate = new Date(this.dateSelector.value);
            currentDate.setDate(currentDate.getDate() + 1);
            this.dateSelector.value = currentDate.toISOString().split('T')[0];
            this.currentDate = this.dateSelector.value;
            
            // Only reload notes if not in search mode
            if (!this.isSearchActive) {
                // Make sure off-platform container is visible in normal mode
                const offPlatformContainer = document.getElementById('offPlatformContainer');
                if (offPlatformContainer) {
                    offPlatformContainer.style.display = '';
                }
                
                this.loadNotes();
            } else {
                // In search mode, hide the off-platform container
                const offPlatformContainer = document.getElementById('offPlatformContainer');
                if (offPlatformContainer) {
                    offPlatformContainer.style.display = 'none';
                }
                
                // Re-run the search with the new date context
                this.searchNotes(this.searchInput.value.trim());
            }
        });
        
        // Replace the date selector with our new container
        const parent = this.dateSelector.parentNode;
        const originalDateSelector = this.dateSelector;
        
        // Remove the original date selector from DOM
        parent.removeChild(originalDateSelector);
        
        // Style the date selector to remove default browser border
        originalDateSelector.className = 'px-2 py-1 border-y border-gray-200 focus:outline-none';
        
        // Add elements to the container
        dateNavContainer.appendChild(prevDayButton);
        dateNavContainer.appendChild(originalDateSelector);
        dateNavContainer.appendChild(nextDayButton);
        
        // Add the container to the parent
        parent.appendChild(dateNavContainer);
    }

    getNextNoteNumber() {
        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        
        // Find the lowest available number (no gaps)
        let nextNumber = 1;
        while (savedNotes.hasOwnProperty(nextNumber)) {
            nextNumber++;
        }
        return nextNumber;
    }

    loadNotes() {
        // Stop all note timers but keep off-platform timers running
        this.stopAllNoteTimers();
        
        // Clear the notes container
        this.container.innerHTML = '';
        this.notes = [];

        // Get saved notes and clean up any potentially corrupt entries
        let savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        // Filter out any notes that don't have the required properties
        Object.keys(savedNotes).forEach(key => {
            const note = savedNotes[key];
            if (!note || typeof note !== 'object') {
                delete savedNotes[key];
            }
        });
        // Re-save cleaned notes
        localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
        
        // Add the off-platform time section
        this.createOffPlatformSection();
        
        const sortedNotes = Object.entries(savedNotes)
            .sort(([a], [b]) => parseInt(a) - parseInt(b));

        if (sortedNotes.length === 0) {
            this.createNewNote(1);
        } else {
            sortedNotes.forEach(([id, note]) => {
                // Handle migration from old format to new format
                let failingIssues = '';
                let nonFailingIssues = '';
                let discussion = '';
                let attemptID = '';
                let projectID = '';
                let additionalTime = note.additionalTime || 0; // Add additionalTime with default
                
                if (note.hasOwnProperty('text')) {
                    // Old format - migrate the text to failing issues
                    failingIssues = note.text || '';
                } else {
                    // New format
                    failingIssues = note.failingIssues || '';
                    nonFailingIssues = note.nonFailingIssues || '';
                    discussion = note.discussion || '';
                    attemptID = note.attemptID || '';
                    projectID = note.projectID || '';
                }
                
                this.createNewNote(
                    parseInt(id), 
                    failingIssues, 
                    nonFailingIssues, 
                    discussion,
                    note.startTimestamp, 
                    note.endTimestamp, 
                    note.completed,
                    attemptID,
                    projectID,
                    additionalTime // Pass additionalTime to createNewNote
                );
            });

            // If all notes are completed, create a new one
            const allCompleted = sortedNotes.every(([, note]) => note.completed);
            if (allCompleted) {
                this.createNewNote(this.getNextNoteNumber());
            }
        }
        
        // Store original notes for search filtering
        this.updateOriginalNotes();
        
        // Check if there's an active search and apply it
        if (this.searchInput.value.trim() !== '') {
            this.searchNotes(this.searchInput.value);
        }
        
        // Update statistics after loading notes
        this.updateStatistics();
        this.updateProjectFailRates();

        window.scrollTo(0, 0);
    }

    deleteNote(number) {
        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        delete savedNotes[number];
        localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
        
        // Option to renumber all notes to fix any gaps
        this.renumberNotes();
        
        this.loadNotes();
    }
    
    // New method to fix numbering gaps
    renumberNotes() {
        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        const sortedEntries = Object.entries(savedNotes)
            .sort(([a], [b]) => parseInt(a) - parseInt(b));
        
        if (sortedEntries.length === 0) return;
        
        // Create a new object with sequential numbering
        const renumberedNotes = {};
        sortedEntries.forEach(([, note], index) => {
            renumberedNotes[index + 1] = note;
        });
        
        // Save the renumbered notes
        localStorage.setItem(this.currentDate, JSON.stringify(renumberedNotes));
    }

    createNewNote(number, failingIssues = '', nonFailingIssues = '', discussion = '', startTimestamp = null, endTimestamp = null, completed = false, attemptID = '', projectID = '', additionalTime = 0) {
        // Create the note container with Tailwind classes
        const noteContainer = document.createElement('div');
        noteContainer.className = 'flex mb-4 p-4 rounded-lg shadow relative group ' + (completed ? 'bg-gray-50' : 'bg-white');
        noteContainer.dataset.noteId = number;

        // Create action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity';
        
        const editButton = document.createElement('button');
        editButton.className = 'w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center justify-center';
        editButton.innerHTML = '✎';
        editButton.title = 'Edit note';
        
        const saveButton = document.createElement('button');
        saveButton.className = 'w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded text-sm flex items-center justify-center';
        saveButton.innerHTML = '✓';
        saveButton.title = 'Save note';
        
        // Only show the appropriate button based on completed state
        if (completed) {
            editButton.style.display = 'block';
            saveButton.style.display = 'none';
        } else {
            editButton.style.display = 'none';
            saveButton.style.display = 'none'; // Both hidden for new notes
        }
        
        editButton.addEventListener('click', () => {
            this.enableNoteEditing(number);
            editButton.style.display = 'none';
            saveButton.style.display = 'block';
        });
        
        saveButton.addEventListener('click', () => {
            this.completeNoteEditing(number);
            saveButton.style.display = 'none';
            editButton.style.display = 'block';
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded text-sm flex items-center justify-center';
        deleteButton.innerHTML = '×';
        deleteButton.title = 'Delete note';
        deleteButton.addEventListener('click', () => {
            this.deleteNote(number);
        });
        
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(saveButton);
        actionsDiv.appendChild(deleteButton);
        noteContainer.appendChild(actionsDiv);

        // Left sidebar with number, timer and ID fields
        const leftSidebar = document.createElement('div');
        leftSidebar.className = 'flex flex-col mr-4 min-w-32';

        // Number display
        const numberDisplay = document.createElement('div');
        numberDisplay.className = 'text-gray-600 font-bold mb-2';
        numberDisplay.textContent = number;
        leftSidebar.appendChild(numberDisplay);

        // Timer display - FIX: Use the same class for all completed notes
        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'font-mono text-base mb-3 ' + (completed ? 'text-green-600' : 'text-gray-600');
        timerDisplay.textContent = '00:00:00';
        leftSidebar.appendChild(timerDisplay);

        // Create ID fields container
        const idFieldsContainer = document.createElement('div');
        idFieldsContainer.className = 'flex flex-col gap-1';
        
        // Attempt ID field
        const attemptIDLabel = document.createElement('label');
        attemptIDLabel.className = 'text-xs text-gray-500';
        attemptIDLabel.textContent = 'Attempt ID:';
        
        const attemptIDInput = document.createElement('input');
        attemptIDInput.className = 'w-full border border-gray-300 rounded px-2 py-1 text-sm ' + 
        (completed ? 'bg-gray-100 text-gray-500' : 'text-black');
        attemptIDInput.style.direction = 'rtl';
        attemptIDInput.placeholder = 'Enter ID';
        attemptIDInput.value = attemptID;
        attemptIDInput.disabled = completed;
        
        // Project ID field
        const projectIDLabel = document.createElement('label');
        projectIDLabel.className = 'text-xs text-gray-500 mt-1';
        projectIDLabel.textContent = 'Project ID:';
        
        const projectIDInput = document.createElement('input');
        projectIDInput.className = 'w-full border border-gray-300 rounded px-2 py-1 text-sm ' + 
                                  (completed ? 'bg-gray-100 text-gray-500' : 'text-black');
        projectIDInput.style.direction = 'rtl';
        projectIDInput.placeholder = 'Enter ID';
        projectIDInput.value = projectID;
        projectIDInput.disabled = completed;
        
        idFieldsContainer.appendChild(projectIDLabel);
        idFieldsContainer.appendChild(projectIDInput);
        idFieldsContainer.appendChild(attemptIDLabel);
        idFieldsContainer.appendChild(attemptIDInput);
        
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
                
                if (!hasStarted && !completed) {
                    hasStarted = true;
                    this.stopAllTimers();
                    timer.start();
                    // Show save button when editing begins
                    saveButton.style.display = 'block';
                }
                this.saveNote(number, timer.startTimestamp, timer.endTimestamp, completed);
            });

            sectionDiv.appendChild(label);
            sectionDiv.appendChild(textarea);
            contentContainer.appendChild(sectionDiv);
        });

        // Add event listeners to ID fields
        let hasStarted = false;
        
        // Start timer when IDs are entered
        attemptIDInput.addEventListener('input', () => {
            if (!hasStarted && !completed) {
                hasStarted = true;
                this.stopAllTimers();
                timer.start();
                saveButton.style.display = 'block';
            }
            this.saveNote(number, timer.startTimestamp, timer.endTimestamp, completed);
        });
        
        projectIDInput.addEventListener('input', () => {
            if (!hasStarted && !completed) {
                hasStarted = true;
                this.stopAllTimers();
                timer.start();
                saveButton.style.display = 'block';
            }
            this.saveNote(number, timer.startTimestamp, timer.endTimestamp, completed);
        });

        // Add copy functionality for Ctrl+C
        noteContainer.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'x') {
                // Don't prevent default to allow normal copy behavior in addition to our custom one
                const text = this.getFormattedNoteText(
                    sectionElements.failingIssues.value,
                    sectionElements.nonFailingIssues.value,
                    sectionElements.discussion.value,
                );
                
                navigator.clipboard.writeText(text)
                    .then(() => console.log('Text copied to clipboard'))
                    .catch(err => console.error('Failed to copy: ', err));
            }
        });

        contentContainer.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                if (hasStarted && !completed) {
                    e.preventDefault();
                    timer.stop();
                    noteContainer.classList.add('bg-gray-50');
                    
                    // Update timer display to green when completed - FIX
                    timerDisplay.classList.remove('text-gray-600');
                    timerDisplay.classList.add('text-green-600');
                    
                    // Disable all textareas
                    Object.values(sectionElements).forEach(textarea => {
                        textarea.disabled = true;
                        // Add these lines to update text color
                        textarea.classList.remove('text-black');
                        textarea.classList.add('text-gray-500');
                    });
                    
                    // Disable ID fields
                    attemptIDInput.disabled = true;
                    // Add these lines to update ID field styling
                    attemptIDInput.classList.remove('text-black');
                    attemptIDInput.classList.add('text-gray-500', 'bg-gray-100');
                    
                    projectIDInput.disabled = true;
                    // Add these lines to update ID field styling
                    projectIDInput.classList.remove('text-black');
                    projectIDInput.classList.add('text-gray-500', 'bg-gray-100');
                    
                    completed = true;
                    // Show edit button after completion
                    saveButton.style.display = 'none';
                    editButton.style.display = 'block';
                    
                    this.saveNote(number, timer.startTimestamp, timer.endTimestamp, completed);
                    this.createNewNote(this.getNextNoteNumber());
                }
            }
        });

        const timer = new Timer(startTimestamp, endTimestamp);
        timer.displayElement = timerDisplay;
        timer.noteId = number;
        timer.additionalTime = additionalTime || 0; // Initialize with saved additional time
        timer.updateDisplay();

        noteContainer.appendChild(leftSidebar);
        noteContainer.appendChild(contentContainer);
        this.container.appendChild(noteContainer);

        this.notes.push({ 
            timer, 
            container: noteContainer,
            elements: {
                ...sectionElements,
                attemptID: attemptIDInput,
                projectID: projectIDInput
            },
            editButton,
            saveButton
        });
        
        if (!completed) {
            // Focus the first section
            sectionElements.failingIssues.focus();
        }
        
        // Adjust heights for all textareas
        Object.values(sectionElements).forEach(textarea => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });

        // Start timer if there's saved text and not completed
        if ((failingIssues || nonFailingIssues || discussion || attemptID || projectID) && !completed && startTimestamp && !endTimestamp) {
            hasStarted = true;
            this.stopAllTimers();
            timer.startDisplay();
            // Show save button if editing is in progress
            saveButton.style.display = 'block';
        }
        
        // Update statistics
        this.updateStatistics();
        this.updateProjectFailRates();
    }

    getFormattedNoteText(failingIssues, nonFailingIssues, discussion) {
        // Create an array to hold non-empty sections
        const sections = [];
        
        // Only add sections that have content
        if (failingIssues.trim()) {
            sections.push(`Failing issues:\n${failingIssues}`);
        }
        
        if (nonFailingIssues.trim()) {
            sections.push(`Non-failing issues:\n${nonFailingIssues}`);
        }
        
        if (discussion.trim()) {
            sections.push(`Discussion:\n${discussion}`);
        }
        
        // Join non-empty sections with double newlines
        return sections.join('\n\n');
    }

    saveNote(number, startTimestamp, endTimestamp, completed) {
        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        const noteElement = document.querySelector(`.flex[data-note-id="${number}"]`);
        
        if (!noteElement) return;
        
        // Get all textareas from the current note
        const failingIssuesTextarea = noteElement.querySelector('textarea[placeholder="Type failing issues..."]');
        const nonFailingIssuesTextarea = noteElement.querySelector('textarea[placeholder="Type non-failing issues..."]');
        const discussionTextarea = noteElement.querySelector('textarea[placeholder="Type discussion..."]');
        
        // Get the ID inputs
        const projectIDInput = noteElement.querySelector('input[placeholder="Enter ID"]');
        const attemptIDInput = noteElement.querySelectorAll('input[placeholder="Enter ID"]')[1];
        
        // Create the note object with all the data
        const note = {
            failingIssues: failingIssuesTextarea ? failingIssuesTextarea.value : '',
            nonFailingIssues: nonFailingIssuesTextarea ? nonFailingIssuesTextarea.value : '',
            discussion: discussionTextarea ? discussionTextarea.value : '',
            startTimestamp: startTimestamp || Date.now(),
            endTimestamp: endTimestamp,
            completed: completed,
            projectID: projectIDInput ? projectIDInput.value : '',
            attemptID: attemptIDInput ? attemptIDInput.value : '',
            additionalTime: 0 // Initialize additionalTime to 0 for new notes
        };
        
        // Save to local storage
        savedNotes[number] = note;
        localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
        
        // Check if there's an active search and apply it if needed
        if (this.searchInput.value.trim() !== '') {
            this.searchNotes(this.searchInput.value);
        }
    }

    completeNoteEditing(number) {
        const note = this.notes.find(n => n.container.dataset.noteId == number);
        if (!note) return;
        
        // Disable all textareas
        Object.values(note.elements).forEach(element => {
            if (element.tagName === 'TEXTAREA') {
                element.disabled = true;
                element.classList.remove('text-black');
                element.classList.add('text-gray-500');
            }
        });
        
        // Disable ID fields
        note.elements.attemptID.disabled = true;
        note.elements.attemptID.classList.remove('text-black');
        note.elements.attemptID.classList.add('text-gray-500', 'bg-gray-100');
        
        note.elements.projectID.disabled = true;
        note.elements.projectID.classList.remove('text-black');
        note.elements.projectID.classList.add('text-gray-500', 'bg-gray-100');
        
        // Add completed class
        note.container.classList.add('bg-gray-50');
        
        // Update timer to green when completed
        const timerDisplay = note.timer.displayElement;
        timerDisplay.classList.remove('text-gray-600');
        timerDisplay.classList.add('text-green-600');
        
        // Update the saved state
        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        if (savedNotes[number]) {
            savedNotes[number].completed = true;
            
            // If the timer was running, stop it
            if (!note.timer.endTimestamp) {
                note.timer.stop();
                savedNotes[number].endTimestamp = note.timer.endTimestamp;
            }
            
            localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
            
            // Update button visibility
            note.saveButton.style.display = 'none';
            note.editButton.style.display = 'block';
            
            // Update statistics after completion
            this.updateStatistics();
            this.updateProjectFailRates();
            
            // Check if there's an active search and apply it if needed
            if (this.searchInput.value.trim() !== '') {
                this.searchNotes(this.searchInput.value);
            }
        }
    }

    enableNoteEditing(number) {
        const note = this.notes.find(n => n.container.dataset.noteId == number);
        if (!note) return;
        
        const isCompleted = note.container.classList.contains('bg-gray-50');
        if (isCompleted) {
            // Enable all textareas
            Object.values(note.elements).forEach(element => {
                if (element.tagName === 'TEXTAREA') {
                    element.disabled = false;
                    element.classList.remove('text-gray-500');
                    element.classList.add('text-black');
                }
            });
            
            // Enable ID fields
            note.elements.attemptID.disabled = false;
            note.elements.attemptID.classList.remove('text-gray-500', 'bg-gray-100');
            note.elements.attemptID.classList.add('text-black');
            
            note.elements.projectID.disabled = false;
            note.elements.projectID.classList.remove('text-gray-500', 'bg-gray-100');
            note.elements.projectID.classList.add('text-black');
            
            // Remove completed class
            note.container.classList.remove('bg-gray-50');
            
            // FIX: Update timer color back to gray when editing
            const timerDisplay = note.timer.displayElement;
            timerDisplay.classList.remove('text-green-600');
            timerDisplay.classList.add('text-gray-600');
            
            // Focus the first textarea
            note.elements.failingIssues.focus();
            
            // Update the saved state
            const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
            if (savedNotes[number]) {
                savedNotes[number].completed = false;
                localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
            }
            
            // Restart timer regardless of endTimestamp
            this.stopAllTimers();
            note.timer.restart(); // Use the new restart method instead of startDisplay
            
            // Update button visibility
            note.editButton.style.display = 'none';
            note.saveButton.style.display = 'block';
            
            // Update statistics
            this.updateStatistics();
            this.updateProjectFailRates();
            
            // Check if there's an active search and apply it if needed
            if (this.searchInput.value.trim() !== '') {
                this.searchNotes(this.searchInput.value);
            }
        }
    }

    stopAllTimers() {
        // Stop note timers
        this.notes.forEach(note => {
            note.timer.stop();
        });
        
        // Stop off-platform timers if initialized
        if (this.offPlatformTimer) {
            this.offPlatformTimer.stopAllTimers();
        }
    }

    // Stop only note timers without affecting off-platform timers
    stopAllNoteTimers() {
        // Stop note timers
        this.notes.forEach(note => {
            note.timer.stop();
        });
    }

    updateTotalTime() {
        const updateDisplay = () => {
            const totalSeconds = this.notes.reduce((total, note) => total + note.timer.getSeconds(), 0);
            this.totalTimeDisplay.textContent = `Total Time: ${new Timer().formatTime(totalSeconds)}`;
        };
        
        setInterval(updateDisplay, 1000);
        updateDisplay();
    }
    
    // Add new method for calculating and displaying statistics
    updateStatistics() {
        if (!this.statsDisplay) return;
        
        let failedCount = 0;
        let nonFailedCount = 0;
        let noIssueCount = 0;
        
        this.notes.forEach(note => {
            // Check if the note is completed by looking at the container class
            const isCompleted = note.container.classList.contains('bg-gray-50');
            
            // Only count if the note is completed
            if (isCompleted) {
                const hasFailing = note.elements.failingIssues.value.trim() !== '';
                const hasNonFailing = note.elements.nonFailingIssues.value.trim() !== '';
                
                if (hasFailing) {
                    failedCount++;
                } else if (hasNonFailing) {
                    nonFailedCount++;
                } else {
                    noIssueCount++;
                }
            }
        });
            
        this.statsDisplay.innerHTML = `
            <div class="font-semibold text-lg mb-2">Audit Stats</div>
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-red-100 p-3 rounded shadow-sm">
                    <div class="font-semibold text-red-800">Fails</div>
                    <div class="text-2xl text-red-700">${failedCount}</div>
                </div>
                <div class="bg-yellow-100 p-3 rounded shadow-sm">
                    <div class="font-semibold text-yellow-800">Non-fails</div>
                    <div class="text-2xl text-yellow-700">${nonFailedCount}</div>
                </div>
                <div class="bg-gray-100 p-3 rounded shadow-sm">
                    <div class="font-semibold text-gray-800">No Issues</div>
                    <div class="text-2xl text-gray-700">${noIssueCount}</div>
                </div>
            </div>
        `;
    }
    
    // Add new method for calculating and displaying project fail rates
    updateProjectFailRates() {
        if (!this.projectFailRateDisplay) return;
        
        // Group notes by project ID
        const projectStats = {};
        
        this.notes.forEach(note => {
            const projectID = note.elements.projectID.value.trim();
            if (!projectID) return; // Skip notes without project ID
            
            if (!projectStats[projectID]) {
                projectStats[projectID] = { 
                    total: 0, 
                    failed: 0,
                    nonFailed: 0,
                    totalTime: 0  // Add tracking for total time
                };
            }
            
            projectStats[projectID].total++;
            projectStats[projectID].totalTime += note.timer.getSeconds(); // Add time to total
            
            if (note.elements.failingIssues.value.trim() !== '') {
                projectStats[projectID].failed++;
            } else if (note.elements.nonFailingIssues.value.trim() !== '') {
                projectStats[projectID].nonFailed++;
            }
        });
        
        // Create the HTML for the project fail rate breakdown
        let html = `<div class="font-semibold text-lg mb-2">Project Fail Rates (${this.currentDate})</div>`;
        
        if (Object.keys(projectStats).length === 0) {
            html += '<div class="text-gray-500 italic">No projects with data available for this date</div>';
        } else {
            html += '<div class="space-y-3">';
            
            for (const [projectID, stats] of Object.entries(projectStats)) {
                const failRate = stats.total > 0 ? (stats.failed / stats.total * 100).toFixed(1) : 0;
                const nonFailRate = stats.total > 0 ? (stats.nonFailed / stats.total * 100).toFixed(1) : 0;
                // Calculate average time per note
                const avgTimeSeconds = stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0;
                // Format average time
                const avgTime = new Timer().formatTime(avgTimeSeconds);
                
                // Truncate project ID to show only last 5 characters
                const displayID = projectID.length > 5 ? 
                    projectID.substring(projectID.length - 5) : 
                    projectID;
                
                html += `
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="font-medium">${displayID}</span>
                            <span>${failRate}% (${stats.failed}/${stats.total}) • avg: ${avgTime}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 relative overflow-hidden">
                            <div class="bg-red-200 h-2.5 absolute" style="width: ${failRate}%"></div>
                            <div class="bg-yellow-200 h-2.5 absolute" style="width: ${nonFailRate}%; left: ${failRate}%"></div>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        }
        
        this.projectFailRateDisplay.innerHTML = html;
    }

    // Helper method to update the list of original notes
    updateOriginalNotes() {
        this.originalNotes = Array.from(this.container.children);
    }

    // Add search functionality
    searchNotes(query) {
        query = query.trim().toLowerCase();
        
        // Set search active flag
        this.isSearchActive = true;
        
        // Stop all note timers but keep off-platform timers running
        this.stopAllNoteTimers();
        
        // Hide the off-platform section during search
        const offPlatformContainer = document.getElementById('offPlatformContainer');
        if (offPlatformContainer) {
            offPlatformContainer.style.display = 'none';
        }
        
        // Clear the current container and update originalNotes
        if (query !== '') {
            this.container.innerHTML = '';
            this.originalNotes = [];
            
            // Add a heading for search results
            const heading = document.createElement('div');
            heading.className = 'w-full text-lg font-bold mb-4 text-gray-700';
            heading.textContent = 'Search Results';
            this.container.appendChild(heading);
            
            // Get all dates from localStorage
            const allNotes = [];
            const dateKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    dateKeys.push(key);
                }
            }
            
            // Sort date keys in descending order (newest first)
            dateKeys.sort().reverse();
            
            // Search across all dates
            dateKeys.forEach(dateKey => {
                const notesForDate = JSON.parse(localStorage.getItem(dateKey) || '{}');
                
                Object.entries(notesForDate).forEach(([id, note]) => {
                    const projectID = (note.projectID || '').toLowerCase();
                    const attemptID = (note.attemptID || '').toLowerCase();
                    
                    if (projectID.includes(query) || attemptID.includes(query)) {
                        allNotes.push({
                            dateKey,
                            id,
                            note,
                            formattedDate: this.formatDate(dateKey),
                            matchesProjectID: projectID.includes(query)
                        });
                    }
                });
            });
            
            // Render all search results at once without pagination
            allNotes.forEach(item => {
                this.renderSearchResult(item.dateKey, item.id, item.note, item.formattedDate);
            });
            
            // Add count information
            if (allNotes.length > 0) {
                const countInfo = document.createElement('div');
                countInfo.className = 'text-center text-sm text-gray-500 mt-4 mb-6';
                countInfo.textContent = `Showing all ${allNotes.length} matching notes`;
                this.container.appendChild(countInfo);
            }
            
            // If no results found
            if (allNotes.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'w-full text-center py-8 text-gray-500';
                noResults.textContent = 'No matching notes found';
                this.container.appendChild(noResults);
                
                // Clear stats for empty search results
                this.updateEmptySearchStats();
            } else {
                // Update statistics for search results
                this.updateSearchStatistics(allNotes);
                this.updateSearchProjectFailRates(allNotes);
            }
            
        } else {
            // If search query is empty, load notes for the current date
            this.isSearchActive = false;
            
            // Show the off-platform container again
            if (offPlatformContainer) {
                offPlatformContainer.style.display = '';
            }
            
            this.loadNotes();
        }
    }
    
    // Update statistics based on search results
    updateSearchStatistics(searchResults) {
        if (!this.statsDisplay) return;
        
        let failedCount = 0;
        let nonFailedCount = 0;
        let noIssueCount = 0;
        
        searchResults.forEach(item => {
            const note = item.note;
            
            // Only count if the note is completed
            if (note.completed) {
                const hasFailing = note.failingIssues && note.failingIssues.trim() !== '';
                const hasNonFailing = note.nonFailingIssues && note.nonFailingIssues.trim() !== '';
                
                if (hasFailing) {
                    failedCount++;
                } else if (hasNonFailing) {
                    nonFailedCount++;
                } else {
                    noIssueCount++;
                }
            }
        });
        
        this.statsDisplay.innerHTML = `
            <div class="font-semibold text-lg mb-2">Search Results Stats</div>
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-red-100 p-3 rounded shadow-sm">
                    <div class="font-semibold text-red-800">Fails</div>
                    <div class="text-2xl text-red-700">${failedCount}</div>
                </div>
                <div class="bg-yellow-100 p-3 rounded shadow-sm">
                    <div class="font-semibold text-yellow-800">Non-fails</div>
                    <div class="text-2xl text-yellow-700">${nonFailedCount}</div>
                </div>
                <div class="bg-gray-100 p-3 rounded shadow-sm">
                    <div class="font-semibold text-gray-800">No Issues</div>
                    <div class="text-2xl text-gray-700">${noIssueCount}</div>
                </div>
            </div>
        `;
    }
    
    // Update project fail rates based on search results
    updateSearchProjectFailRates(searchResults) {
        if (!this.projectFailRateDisplay) return;
        
        // Group notes by project ID
        const projectStats = {};
        
        searchResults.forEach(item => {
            const note = item.note;
            const projectID = note.projectID ? note.projectID.trim() : '';
            if (!projectID) return; // Skip notes without project ID
            
            if (!projectStats[projectID]) {
                projectStats[projectID] = { 
                    total: 0, 
                    failed: 0,
                    nonFailed: 0,
                    totalTime: 0
                };
            }
            
            projectStats[projectID].total++;
            
            // Add timer seconds if available
            if (note.startTimestamp && note.endTimestamp) {
                const startTime = new Date(note.startTimestamp).getTime();
                const endTime = new Date(note.endTimestamp).getTime();
                const seconds = Math.floor((endTime - startTime) / 1000);
                projectStats[projectID].totalTime += seconds;
            }
            
            // Add additional time if it exists
            if (note.additionalTime) {
                projectStats[projectID].totalTime += parseInt(note.additionalTime) || 0;
            }
            
            if (note.failingIssues && note.failingIssues.trim() !== '') {
                projectStats[projectID].failed++;
            } else if (note.nonFailingIssues && note.nonFailingIssues.trim() !== '') {
                projectStats[projectID].nonFailed++;
            }
        });
        
        // Create the HTML for the project fail rate breakdown
        let html = `<div class="font-semibold text-lg mb-2">Search Results Project Fail Rates</div>`;
        
        if (Object.keys(projectStats).length === 0) {
            html += '<div class="text-gray-500 italic">No projects with data available in search results</div>';
        } else {
            html += '<div class="space-y-3">';
            
            for (const [projectID, stats] of Object.entries(projectStats)) {
                const failRate = stats.total > 0 ? (stats.failed / stats.total * 100).toFixed(1) : 0;
                const nonFailRate = stats.total > 0 ? (stats.nonFailed / stats.total * 100).toFixed(1) : 0;
                // Calculate average time per note
                const avgTimeSeconds = stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0;
                // Format average time
                const avgTime = new Timer().formatTime(avgTimeSeconds);
                
                // Truncate project ID to show only last 5 characters
                const displayID = projectID.length > 5 ? 
                    projectID.substring(projectID.length - 5) : 
                    projectID;
                
                html += `
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="font-medium">${displayID}</span>
                            <span>${failRate}% (${stats.failed}/${stats.total}) • avg: ${avgTime}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 relative overflow-hidden">
                            <div class="bg-red-200 h-2.5 absolute" style="width: ${failRate}%"></div>
                            <div class="bg-yellow-200 h-2.5 absolute" style="width: ${nonFailRate}%; left: ${failRate}%"></div>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        }
        
        this.projectFailRateDisplay.innerHTML = html;
    }
    
    // Update stats for empty search results
    updateEmptySearchStats() {
        if (this.statsDisplay) {
            this.statsDisplay.innerHTML = `
                <div class="font-semibold text-lg mb-2">Search Results Stats</div>
                <div class="text-gray-500 italic">No matching results found</div>
            `;
        }
        
        if (this.projectFailRateDisplay) {
            this.projectFailRateDisplay.innerHTML = `
                <div class="font-semibold text-lg mb-2">Search Results Project Fail Rates</div>
                <div class="text-gray-500 italic">No matching results found</div>
            `;
        }
    }
    
    // Helper method to format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Format as "Today", "Yesterday", or the actual date
        if (dateString === today.toISOString().split('T')[0]) {
            return "Today";
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric'
            });
        }
    }
    
    // Render an individual search result
    renderSearchResult(dateKey, id, note, formattedDate) {
        // Create result container
        const resultContainer = document.createElement('div');
        resultContainer.className = 'flex mb-4 p-4 rounded-lg shadow bg-white relative';
        
        // Date label
        const dateLabel = document.createElement('div');
        dateLabel.className = 'absolute top-2 right-2 text-xs bg-gray-200 px-2 py-1 rounded text-gray-700';
        dateLabel.textContent = formattedDate;
        resultContainer.appendChild(dateLabel);
        
        // Left sidebar with ID fields
        const leftSidebar = document.createElement('div');
        leftSidebar.className = 'flex flex-col mr-6 min-w-40 flex-shrink-0'; // Wider sidebar with flex-shrink-0
        
        // Note ID (number)
        const numberLabel = document.createElement('div');
        numberLabel.className = 'text-gray-600 font-bold mb-2';
        numberLabel.textContent = `Note #${id}`;
        leftSidebar.appendChild(numberLabel);
        
        // Project ID
        if (note.projectID) {
            const projectIDLabel = document.createElement('div');
            projectIDLabel.className = 'text-xs text-gray-500';
            projectIDLabel.textContent = 'Project ID:';
            
            const projectIDValue = document.createElement('div');
            projectIDValue.className = 'font-mono text-sm mb-2 break-all'; // Add break-all to prevent overflow
            projectIDValue.textContent = note.projectID;
            
            leftSidebar.appendChild(projectIDLabel);
            leftSidebar.appendChild(projectIDValue);
        }
        
        // Attempt ID
        if (note.attemptID) {
            const attemptIDLabel = document.createElement('div');
            attemptIDLabel.className = 'text-xs text-gray-500';
            attemptIDLabel.textContent = 'Attempt ID:';
            
            const attemptIDValue = document.createElement('div');
            attemptIDValue.className = 'font-mono text-sm mb-2 break-all'; // Add break-all to prevent overflow
            attemptIDValue.textContent = note.attemptID;
            
            leftSidebar.appendChild(attemptIDLabel);
            leftSidebar.appendChild(attemptIDValue);
        }
        
        // View full note button
        const viewButton = document.createElement('button');
        viewButton.className = 'mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded w-full'; // Make button full width
        viewButton.textContent = 'View Full Note';
        viewButton.addEventListener('click', () => {
            // Change to the date of this note and load all notes for that date
            this.dateSelector.value = dateKey;
            this.currentDate = dateKey;
            this.searchInput.value = '';
            this.isSearchActive = false;
            this.loadNotes();
            
            // Highlight the specific note
            setTimeout(() => {
                const noteElement = document.querySelector(`.flex[data-note-id="${id}"]`);
                if (noteElement) {
                    noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    noteElement.classList.add('ring-2', 'ring-blue-500');
                    setTimeout(() => {
                        noteElement.classList.remove('ring-2', 'ring-blue-500');
                    }, 2000);
                }
            }, 100);
        });
        leftSidebar.appendChild(viewButton);
        
        // Content preview
        const contentContainer = document.createElement('div');
        contentContainer.className = 'flex-grow overflow-hidden'; // Add overflow-hidden
        
        // Add note content preview
        const sections = [
            { label: 'Failing issues:', value: note.failingIssues, key: 'failingIssues' },
            { label: 'Non-failing issues:', value: note.nonFailingIssues, key: 'nonFailingIssues' },
            { label: 'Discussion:', value: note.discussion, key: 'discussion' }
        ];
        
        sections.forEach(section => {
            if (section.value && section.value.trim()) {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'mb-2';
                
                const label = document.createElement('div');
                label.className = 'font-bold text-sm text-gray-700';
                label.textContent = section.label;
                
                const content = document.createElement('div');
                content.className = 'text-sm text-gray-600 whitespace-pre-wrap break-words'; // Add break-words
                // Truncate long content
                content.textContent = section.value.length > 150 
                    ? section.value.substring(0, 150) + '...' 
                    : section.value;
                
                sectionDiv.appendChild(label);
                sectionDiv.appendChild(content);
                contentContainer.appendChild(sectionDiv);
            }
        });
        
        resultContainer.appendChild(leftSidebar);
        resultContainer.appendChild(contentContainer);
        this.container.appendChild(resultContainer);
    }

    // Add new method to create the off-platform section
    createOffPlatformSection() {
        // Get the dedicated container for off-platform time
        const offPlatformContainer = document.getElementById('offPlatformContainer');
        if (!offPlatformContainer) return;
        
        // Clear the container
        offPlatformContainer.innerHTML = '';
        
        // Create a sticky container for active timers
        const stickyContainer = document.createElement('div');
        stickyContainer.id = 'stickyTimerContainer';
        stickyContainer.className = 'hidden fixed top-0 left-0 right-0 bg-white shadow-md p-3 z-50 transition-all duration-300';
        document.body.appendChild(stickyContainer);
        
        // Create the main container for the off-platform section
        const offPlatformSection = document.createElement('div');
        offPlatformSection.className = 'mb-5 bg-white p-4 rounded-lg shadow off-platform-section';
        
        // Create header
        const header = document.createElement('h2');
        header.className = 'text-lg font-semibold text-gray-700 mb-3';
        header.textContent = 'Off-platform time';
        offPlatformSection.appendChild(header);
        
        // Create timer grid
        const timerGrid = document.createElement('div');
        timerGrid.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-3';
        
        // Create the three timers
        const categories = [
            { id: 'projectTraining', label: 'Project Training' },
            { id: 'sheetwork', label: 'Sheet Work' },
            { id: 'blocked', label: 'Blocked from Working' }
        ];
        
        categories.forEach(category => {
            const timerCard = this.createTimerCard(category.id, category.label);
            timerGrid.appendChild(timerCard);
        });
        
        offPlatformSection.appendChild(timerGrid);
        
        // Create total time display
        const totalSection = document.createElement('div');
        totalSection.className = 'bg-gray-50 p-3 rounded flex justify-between items-center';
        
        const totalLabel = document.createElement('span');
        totalLabel.className = 'font-semibold text-gray-700';
        totalLabel.textContent = 'Total off-platform time:';
        
        const totalTime = document.createElement('span');
        totalTime.className = 'text-xl font-mono font-semibold text-gray-800';
        totalTime.textContent = '00:00:00';
        
        // Store reference to the total time display
        this.offPlatformTimer.displayElements.total = totalTime;
        
        totalSection.appendChild(totalLabel);
        totalSection.appendChild(totalTime);
        offPlatformSection.appendChild(totalSection);
        
        // Add the off-platform section to its dedicated container
        offPlatformContainer.appendChild(offPlatformSection);
        
        // Load timer state from localStorage
        this.offPlatformTimer.loadTimerState();
        
        // Set up scroll event listener for sticky timer
        this.setupStickyTimerBehavior();
    }
    
    // Setup sticky timer behavior
    setupStickyTimerBehavior() {
        // Function to check if any timer is running
        const isAnyTimerRunning = () => {
            return Object.keys(this.offPlatformTimer.timers).some(
                category => this.offPlatformTimer.timers[category].startTime !== null
            );
        };
        
        // Function to update sticky container
        const updateStickyContainer = () => {
            const stickyContainer = document.getElementById('stickyTimerContainer');
            if (!stickyContainer) return;
            
            if (isAnyTimerRunning()) {
                // Find the active timer
                const activeCategory = Object.keys(this.offPlatformTimer.timers).find(
                    category => this.offPlatformTimer.timers[category].startTime !== null
                );
                
                if (activeCategory) {
                    // Clear previous content
                    stickyContainer.innerHTML = '';
                    
                    // Create a simplified version of the active timer
                    const activeTimer = document.createElement('div');
                    activeTimer.className = 'flex items-center justify-between max-w-screen-lg mx-auto';
                    
                    // Add category label
                    const categoryLabel = document.createElement('div');
                    categoryLabel.className = 'font-medium text-gray-700';
                    
                    // Convert camelCase to readable format
                    let readableCategory = activeCategory
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                    
                    categoryLabel.textContent = `${readableCategory} (running):`;
                    
                    // Add timer display
                    const timerDisplay = document.createElement('div');
                    timerDisplay.className = 'font-mono text-xl font-semibold text-green-600';
                    timerDisplay.textContent = this.offPlatformTimer.formatTime(
                        this.offPlatformTimer.getSeconds(activeCategory)
                    );
                    
                    // Store reference to update this display
                    this.offPlatformTimer.displayElements[`sticky_${activeCategory}`] = timerDisplay;
                    
                    // Add stop button
                    const stopButton = document.createElement('button');
                    stopButton.className = 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-100 py-1 px-3 rounded text-sm transition-colors';
                    stopButton.textContent = 'Stop';
                    stopButton.addEventListener('click', () => {
                        this.offPlatformTimer.stopTimer(activeCategory);
                        stickyContainer.classList.add('hidden');
                    });
                    
                    activeTimer.appendChild(categoryLabel);
                    activeTimer.appendChild(timerDisplay);
                    activeTimer.appendChild(stopButton);
                    stickyContainer.appendChild(activeTimer);
                    
                    // Show the sticky container when scrolled past the original timer
                    const offPlatformSection = document.querySelector('.off-platform-section');
                    if (offPlatformSection) {
                        const sectionBottom = offPlatformSection.getBoundingClientRect().bottom;
                        
                        if (sectionBottom < 0) {
                            stickyContainer.classList.remove('hidden');
                        } else {
                            stickyContainer.classList.add('hidden');
                        }
                    }
                }
            } else {
                // Hide the sticky container if no timer is running
                stickyContainer.classList.add('hidden');
            }
        };
        
        // Update on start and stop
        Object.keys(this.offPlatformTimer.timers).forEach(category => {
            this.offPlatformTimer.onStart(category, () => {
                // Update display references for the sticky timer
                if (this.offPlatformTimer.displayElements[`sticky_${category}`]) {
                    // Start a separate interval for the sticky display
                    const updateStickyDisplay = () => {
                        if (this.offPlatformTimer.displayElements[`sticky_${category}`]) {
                            this.offPlatformTimer.displayElements[`sticky_${category}`].textContent = 
                                this.offPlatformTimer.formatTime(this.offPlatformTimer.getSeconds(category));
                        }
                    };
                    
                    setInterval(updateStickyDisplay, 1000);
                    updateStickyDisplay();
                }
                
                updateStickyContainer();
            });
            
            this.offPlatformTimer.onStop(category, updateStickyContainer);
        });
        
        // Set up scroll event listener
        window.addEventListener('scroll', updateStickyContainer);
        
        // Initial check
        updateStickyContainer();
    }
    
    // Helper method to create a timer card
    createTimerCard(categoryId, label) {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 p-3 rounded-lg border border-gray-100 transition-all hover:shadow-sm relative group';
        
        // Create timer display - make it the focal point
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'font-mono text-center text-2xl font-semibold text-gray-800 my-2 py-2';
        timeDisplay.textContent = '00:00:00';
        
        // Create label
        const cardLabel = document.createElement('div');
        cardLabel.className = 'text-center text-sm font-medium text-gray-600 mb-2';
        cardLabel.textContent = label;
        
        // Store reference to the time display
        this.offPlatformTimer.displayElements[categoryId] = timeDisplay;
        
        // Add label and time display
        card.appendChild(cardLabel);
        card.appendChild(timeDisplay);
        
        // Create edit button for timer
        const editButton = document.createElement('button');
        editButton.className = 'absolute top-2 right-2 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity';
        editButton.innerHTML = '✎';
        editButton.title = 'Edit timer';
        editButton.addEventListener('click', () => {
            this.showEditTimerDialog(categoryId, label);
        });
        card.appendChild(editButton);
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex gap-2 mt-2';
        
        // Create start button
        const startButton = document.createElement('button');
        startButton.className = 'w-full bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 py-1 px-2 rounded text-sm transition-colors';
        startButton.textContent = 'Start';
        
        // Create stop button
        const stopButton = document.createElement('button');
        stopButton.className = 'w-full bg-red-100 hover:bg-red-100 text-red-700 border border-red-100 py-1 px-2 rounded text-sm transition-colors';
        stopButton.textContent = 'Stop';
        
        // Set initial button display based on timer state
        const isTimerRunning = !!this.offPlatformTimer.timers[categoryId].startTime;
        startButton.style.display = isTimerRunning ? 'none' : 'block';
        stopButton.style.display = isTimerRunning ? 'block' : 'none';
        
        // Start timer event listener
        startButton.addEventListener('click', () => {
            this.offPlatformTimer.startTimer(categoryId);
        });
        
        // Stop timer event listener
        stopButton.addEventListener('click', () => {
            this.offPlatformTimer.stopTimer(categoryId);
        });
        
        // Register UI update callbacks
        this.offPlatformTimer.onStart(categoryId, () => {
            // Visual feedback when started
            card.classList.add('ring-1', 'ring-green-200');
            
            // Update button visibility
            startButton.style.display = 'none';
            stopButton.style.display = 'block';
        });
        
        this.offPlatformTimer.onStop(categoryId, () => {
            // Visual feedback when stopped
            card.classList.remove('ring-1', 'ring-green-200');
            
            // Update button visibility
            startButton.style.display = 'block';
            stopButton.style.display = 'none';
        });
        
        // If timer is already running, update UI accordingly
        if (this.offPlatformTimer.timers[categoryId].startTime) {
            card.classList.add('ring-1', 'ring-green-200');
        }
        
        buttonContainer.appendChild(startButton);
        buttonContainer.appendChild(stopButton);
        card.appendChild(buttonContainer);
        
        return card;
    }
    
    // Display edit timer dialog
    showEditTimerDialog(categoryId, label) {
        // If timer is running, stop it first
        const wasRunning = !!this.offPlatformTimer.timers[categoryId].startTime;
        if (wasRunning) {
            this.offPlatformTimer.stopTimer(categoryId);
        }
        
        // Get current timer value
        const seconds = this.offPlatformTimer.getSeconds(categoryId);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'bg-white rounded-lg shadow-lg p-6 w-full max-w-md';
        
        // Dialog header
        const header = document.createElement('h3');
        header.className = 'text-lg font-semibold text-gray-800 mb-4';
        header.textContent = `Edit ${label} Timer`;
        
        // Create form for time input
        const form = document.createElement('form');
        form.className = 'space-y-4';
        
        // Time input container
        const timeInputContainer = document.createElement('div');
        timeInputContainer.className = 'flex gap-2 items-center justify-center';
        
        // Hours input
        const hoursInput = document.createElement('input');
        hoursInput.type = 'number';
        hoursInput.min = 0;
        hoursInput.value = hours;
        hoursInput.className = 'w-16 border border-gray-300 rounded px-2 py-1 text-center';
        
        // Minutes input
        const minutesInput = document.createElement('input');
        minutesInput.type = 'number';
        minutesInput.min = 0;
        minutesInput.max = 59;
        minutesInput.value = minutes;
        minutesInput.className = 'w-16 border border-gray-300 rounded px-2 py-1 text-center';
        
        // Seconds input
        const secondsInput = document.createElement('input');
        secondsInput.type = 'number';
        secondsInput.min = 0;
        secondsInput.max = 59;
        secondsInput.value = secs;
        secondsInput.className = 'w-16 border border-gray-300 rounded px-2 py-1 text-center';
        
        // Labels
        const hoursLabel = document.createElement('span');
        hoursLabel.className = 'text-gray-600';
        hoursLabel.textContent = 'hrs';
        
        const minutesLabel = document.createElement('span');
        minutesLabel.className = 'text-gray-600';
        minutesLabel.textContent = 'min';
        
        const secondsLabel = document.createElement('span');
        secondsLabel.className = 'text-gray-600';
        secondsLabel.textContent = 'sec';
        
        // Populate time input container
        timeInputContainer.appendChild(hoursInput);
        timeInputContainer.appendChild(hoursLabel);
        timeInputContainer.appendChild(minutesInput);
        timeInputContainer.appendChild(minutesLabel);
        timeInputContainer.appendChild(secondsInput);
        timeInputContainer.appendChild(secondsLabel);
        
        // Action buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex gap-2 justify-end mt-6';
        
        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            // If it was running, restart it
            if (wasRunning) {
                this.offPlatformTimer.startTimer(categoryId);
            }
            document.body.removeChild(overlay);
        });
        
        // Save button
        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.className = 'px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors';
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => {
            // Extract values
            const hrs = parseInt(hoursInput.value) || 0;
            const mins = parseInt(minutesInput.value) || 0;
            const seconds = parseInt(secondsInput.value) || 0;
            
            // Update the timer
            this.offPlatformTimer.editTimer(categoryId, hrs, mins, seconds);
            
            // If it was running, restart it
            if (wasRunning) {
                this.offPlatformTimer.startTimer(categoryId);
            }
            
            document.body.removeChild(overlay);
        });
        
        // Add buttons to container
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        
        // Assemble form
        form.appendChild(timeInputContainer);
        form.appendChild(buttonContainer);
        
        // Prevent form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveButton.click();
        });
        
        // Assemble dialog
        dialog.appendChild(header);
        dialog.appendChild(form);
        overlay.appendChild(dialog);
        
        // Add dialog to body
        document.body.appendChild(overlay);
        
        // Focus hours input
        hoursInput.focus();
        hoursInput.select();
    }
}

export default NoteApp;