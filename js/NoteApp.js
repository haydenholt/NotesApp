import Timer from './Timer.js';

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
        
        // Initialize date
        const today = new Date().toISOString().split('T')[0];
        this.dateSelector.value = today;
        this.currentDate = today;

        // Set up event listeners
        this.dateSelector.addEventListener('change', () => {
            this.currentDate = this.dateSelector.value;
            this.loadNotes();
        });

        this.loadNotes();
        this.updateTotalTime();
        
        // Make the app instance globally available for the Timer class
        window.app = this;
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
        this.stopAllTimers();
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
                    projectID
                );
            });

            // If all notes are completed, create a new one
            const allCompleted = sortedNotes.every(([, note]) => note.completed);
            if (allCompleted) {
                this.createNewNote(this.getNextNoteNumber());
            }
        }
        
        // Update statistics after loading notes
        this.updateStatistics();
        this.updateProjectFailRates();
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

    createNewNote(number, failingIssues = '', nonFailingIssues = '', discussion = '', startTimestamp = null, endTimestamp = null, completed = false, attemptID = '', projectID = '') {
        // Create the note container with Tailwind classes
        const noteContainer = document.createElement('div');
        noteContainer.className = 'flex mb-4 bg-white p-4 rounded-lg shadow relative group ' + (completed ? 'bg-gray-50' : '');
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

        // Timer display
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
        projectIDInput.placeholder = 'Enter ID';
        projectIDInput.value = projectID;
        projectIDInput.disabled = completed;
        
        idFieldsContainer.appendChild(attemptIDLabel);
        idFieldsContainer.appendChild(attemptIDInput);
        idFieldsContainer.appendChild(projectIDLabel);
        idFieldsContainer.appendChild(projectIDInput);
        
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
            const adjustHeight = () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            };

            textarea.addEventListener('input', () => {
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
            if (e.ctrlKey && e.key === 'c') {
                // Don't prevent default to allow normal copy behavior in addition to our custom one
                const text = this.getFormattedNoteText(
                    sectionElements.failingIssues.value,
                    sectionElements.nonFailingIssues.value,
                    sectionElements.discussion.value,
                    attemptIDInput.value,
                    projectIDInput.value
                );
                
                navigator.clipboard.writeText(text)
                    .then(() => console.log('Text copied to clipboard'))
                    .catch(err => console.error('Failed to copy: ', err));
            }
        });

        // Handle Ctrl+Enter key for completion
        contentContainer.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                if (hasStarted && !completed) {
                    e.preventDefault();
                    timer.stop();
                    noteContainer.classList.add('bg-gray-50');
                    
                    // Disable all textareas
                    Object.values(sectionElements).forEach(textarea => {
                        textarea.disabled = true;
                    });
                    
                    // Disable ID fields
                    attemptIDInput.disabled = true;
                    projectIDInput.disabled = true;
                    
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

    getFormattedNoteText(failingIssues, nonFailingIssues, discussion, attemptID, projectID) {
        // Create an array to hold non-empty sections
        const sections = [];
        
        // Add IDs if they exist
        if (attemptID.trim() || projectID.trim()) {
            let idText = '';
            if (attemptID.trim()) {
                idText += `Attempt ID: ${attemptID}`;
            }
            if (projectID.trim()) {
                if (idText) idText += '\n';
                idText += `Project ID: ${projectID}`;
            }
            sections.push(idText);
        }
        
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
        const noteElements = this.notes.find(note => 
            note.container.dataset.noteId == number)?.elements;
        
        if (!noteElements) return;

        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        savedNotes[number] = { 
            failingIssues: noteElements.failingIssues.value,
            nonFailingIssues: noteElements.nonFailingIssues.value,
            discussion: noteElements.discussion.value,
            attemptID: noteElements.attemptID.value,
            projectID: noteElements.projectID.value,
            startTimestamp, 
            endTimestamp, 
            completed 
        };
        localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
        
        // Update statistics after saving
        this.updateStatistics();
        this.updateProjectFailRates();
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
            
            // Focus the first textarea
            note.elements.failingIssues.focus();
            
            // Update the saved state
            const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
            if (savedNotes[number]) {
                savedNotes[number].completed = false;
                localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
            }
            
            // Restart timer if needed
            if (!note.timer.endTimestamp) {
                this.stopAllTimers();
                note.timer.startDisplay();
            }
            
            // Update button visibility
            note.editButton.style.display = 'none';
            note.saveButton.style.display = 'block';
            
            // Update statistics
            this.updateStatistics();
            this.updateProjectFailRates();
        }
    }

    stopAllTimers() {
        this.notes.forEach(note => note.timer.stopDisplay());
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
            const hasFailing = note.elements.failingIssues.value.trim() !== '';
            const hasNonFailing = note.elements.nonFailingIssues.value.trim() !== '';
            
            if (hasFailing) {
                failedCount++;
            } else if (hasNonFailing) {
                nonFailedCount++;
            } else {
                noIssueCount++;
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
                    <div class="text-2xl text-gray-700">${noIssueCount - 1}</div>
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
                projectStats[projectID] = { total: 0, failed: 0 };
            }
            
            projectStats[projectID].total++;
            
            if (note.elements.failingIssues.value.trim() !== '') {
                projectStats[projectID].failed++;
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
                
                html += `
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="font-medium">${projectID}</span>
                            <span>${failRate}% (${stats.failed}/${stats.total})</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="bg-red-600 h-2.5 rounded-full" style="width: ${failRate}%"></div>
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        }
        
        this.projectFailRateDisplay.innerHTML = html;
    }
}

export default NoteApp;