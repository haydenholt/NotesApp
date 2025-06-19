import Timer from '../components/Timer.js';
import OffPlatformTimer from './OffPlatformTimer.js';
import Note from './Note.js'
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
        this.editingNotes = {}; // Track which notes are being edited (vs. new notes), per date
        
        // Initialize date
        const today = new Date().toLocaleDateString('sv-SE');
        
        this.dateSelector.value = today;
        this.currentDate = today;
        
        // Initialize off-platform timer with current date
        this.offPlatformTimer = new OffPlatformTimer();
        this.offPlatformTimer.currentDate = this.currentDate;
    
        // Set up event listeners
        this.dateSelector.addEventListener('change', () => {
            // Update current date immediately
            this.currentDate = this.dateSelector.value;
            
            // Update off-platform timer date immediately
            this.offPlatformTimer.currentDate = this.currentDate;
            
            // Only reload notes if not in search mode
            if (this.searchInput.value.trim() === '') {
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
            
            // Load timer state asynchronously to avoid blocking UI
            setTimeout(() => {
                this.offPlatformTimer.loadTimerState();
            }, 0);
        });
        
        // Add date navigation buttons
        this.addDateNavigationButtons();
        
        // Set up search functionality with debounce
        let searchDebounceTimer;
        const searchDebounceDelay = 300; // ms
        
        this.searchInput.addEventListener('input', () => {
            const query = this.searchInput.value.trim();
            
            // Clear existing timer
            clearTimeout(searchDebounceTimer);
            
            if (query === '') {
                // For empty query, reset immediately (no debounce needed)
                // Show the off-platform container again
                const offPlatformContainer = document.getElementById('offPlatformContainer');
                if (offPlatformContainer) {
                    offPlatformContainer.style.display = '';
                }
                
                // Show the date and total time bar again
                const dateTimeBar = document.getElementById('totalTime').parentElement;
                if (dateTimeBar) {
                    dateTimeBar.style.display = '';
                }
                
                this.loadNotes();
                this.createOffPlatformSection();
            } else if (query !== '') {
                // For non-empty query, debounce the expensive search operation
                searchDebounceTimer = setTimeout(() => {
                    this.searchNotes(query);
                }, searchDebounceDelay);
            }
        });
        
        this.clearSearchButton.addEventListener('click', () => {
            this.searchInput.value = '';
            // Reset search
            // Show the off-platform container again
            const offPlatformContainer = document.getElementById('offPlatformContainer');
            if (offPlatformContainer) {
                offPlatformContainer.style.display = '';
            }
            
            // Show the date and total time bar again
            const dateTimeBar = document.getElementById('totalTime').parentElement;
            if (dateTimeBar) {
                dateTimeBar.style.display = '';
            }
            
            this.loadNotes();
            this.createOffPlatformSection();
        });
    
        // Load notes and create off-platform section
        this.loadNotes();
        this.updateTotalTime();
        
        // Make the app instance globally available for the Timer class
        window.app = this;
        
        // Create the off-platform section after window.app is set
        setTimeout(() => {
            this.createOffPlatformSection();
        }, 0);

    }
    
    // New method to add date navigation buttons
    addDateNavigationButtons() {
        // Create wrapper for the date picker and buttons
        const dateNavContainer = document.createElement('div');
        dateNavContainer.className = 'flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm';
        
        // Previous day button
        const prevDayButton = document.createElement('button');
        prevDayButton.innerHTML = '‹'; // Left chevron
        prevDayButton.className = 'px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-r border-gray-200 transition-colors';
        prevDayButton.title = 'Previous day';
        prevDayButton.addEventListener('click', () => {
            // note timers state is resumed per-note now
            const currentDate = new Date(this.dateSelector.value);
            currentDate.setDate(currentDate.getDate() - 1);
            this.dateSelector.value = currentDate.toISOString().split('T')[0];
            this.currentDate = this.dateSelector.value;
            
            // Update off-platform timer date immediately
            this.offPlatformTimer.currentDate = this.currentDate;
            
            // Only reload notes if not in search mode
            if (this.searchInput.value.trim() === '') {
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
            
            // Load timer state asynchronously to avoid blocking UI
            setTimeout(() => {
                this.offPlatformTimer.loadTimerState();
            }, 0);
        });
        
        // Next day button
        const nextDayButton = document.createElement('button');
        nextDayButton.innerHTML = '›'; // Right chevron
        nextDayButton.className = 'px-3 py-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l border-gray-200 transition-colors';
        nextDayButton.title = 'Next day';
        nextDayButton.addEventListener('click', () => {
            // note timers state is resumed per-note now
            const currentDate = new Date(this.dateSelector.value);
            currentDate.setDate(currentDate.getDate() + 1);
            this.dateSelector.value = currentDate.toISOString().split('T')[0];
            this.currentDate = this.dateSelector.value;
            
            // Update off-platform timer date immediately
            this.offPlatformTimer.currentDate = this.currentDate;
            
            // Only reload notes if not in search mode
            if (this.searchInput.value.trim() === '') {
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
            
            // Load timer state asynchronously to avoid blocking UI
            setTimeout(() => {
                this.offPlatformTimer.loadTimerState();
            }, 0);
        });
        
        // Replace the date selector with our new container
        const parent = this.dateSelector.parentNode;
        const originalDateSelector = this.dateSelector;
        
        // Remove the original date selector from DOM
        parent.removeChild(originalDateSelector);
        
        // Style the date selector to remove default browser border
        originalDateSelector.className = 'px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset text-gray-700 min-w-32';
        
        // Add elements to the container
        dateNavContainer.appendChild(prevDayButton);
        dateNavContainer.appendChild(originalDateSelector);
        dateNavContainer.appendChild(nextDayButton);
        
        // Add the container to the parent
        parent.appendChild(dateNavContainer);
    }

    getNextNoteNumber() {
        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        // Find the lowest available number (no gaps), treating cancelled as used
        let nextNumber = 1;
        while (savedNotes.hasOwnProperty(nextNumber)) {
            nextNumber++;
        }
        return nextNumber;
    }

    loadNotes() {
        // No longer stopping all note timers
        // Clear the notes container
        this.container.innerHTML = '';
        this.notes = [];

        // Get saved notes and clean up any potentially corrupt entries
        let savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        Object.keys(savedNotes).forEach(key => {
            const note = savedNotes[key];
            if (!note || typeof note !== 'object') {
                delete savedNotes[key];
            }
        });
        localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
        
        const sortedNotes = Object.entries(savedNotes)
            .sort(([a], [b]) => parseInt(a) - parseInt(b));

        if (sortedNotes.length === 0) {
            this.createNewNote(1);
        } else {
            // Instantiate notes by ID only, with Note constructor handling data loading
            sortedNotes.forEach(([id]) => {
                this.createNewNote(parseInt(id));
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

        window.scrollTo(0, 0);
    }

    deleteNote(number) {
        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        delete savedNotes[number];
        localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
        
        // Option to renumber all notes to fix any gaps
        this.renumberNotes();
        
        this.loadNotes();
        // After deleting, scroll to bottom to show latest notes
        const lastNote = this.container.lastElementChild;
        if (lastNote) lastNote.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    /**
     * Mark a note as being edited (prevents auto-creating a new note when completed via ctrl+Enter)
     */
    markNoteAsEditing(number) {
        if (!this.editingNotes[this.currentDate]) {
            this.editingNotes[this.currentDate] = {};
        }
        this.editingNotes[this.currentDate][number] = true;
    }

    /**
     * Creates a new note using the Note class wrapper.
     */
    createNewNote(number) {
        // Compute ordinal for display based on existing non-cancelled notes
        const displayIndex = this.notes.filter(n => !n.canceled).length + 1;
        const note = new Note(number, this.currentDate, displayIndex, {
            enableEditing: this.enableNoteEditing.bind(this),
            completeEditing: this.completeNoteEditing.bind(this),
            deleteNote: this.deleteNote.bind(this),
            markEditing: this.markNoteAsEditing.bind(this)
        });
        // Append to DOM and track in app
        this.container.appendChild(note.container);
        this.notes.push(note);
        return note;
    }

    completeNoteEditing(number, canceled = false) {
        const noteIndex = this.notes.findIndex(n => n.container.dataset.noteId == number);
        if (noteIndex === -1) {
            return;
        }

        const note = this.notes[noteIndex];
        
        const isCanceled = canceled || note.canceled;
        
        // Disable all textareas and ID fields (UI updates)
        Object.values(note.elements).forEach(element => {
            if (element.tagName === 'TEXTAREA') {
                element.disabled = true;
                element.classList.remove('text-black');
                element.classList.add('text-gray-500');
                element.classList.remove('pb-6');
            }
        });
        note.elements.attemptID.disabled = true;
        note.elements.attemptID.classList.remove('text-black');
        note.elements.attemptID.classList.add('text-gray-500', 'bg-gray-100');
        note.elements.projectID.disabled = true;
        note.elements.projectID.classList.remove('text-black');
        note.elements.projectID.classList.add('text-gray-500', 'bg-gray-100');
        note.elements.operationID.disabled = true;
        note.elements.operationID.classList.remove('text-black');
        note.elements.operationID.classList.add('text-gray-500', 'bg-gray-100');
        
        // UI styling for note container and number display based on isCanceled
        note.container.classList.remove('bg-white', 'bg-gray-50', 'bg-red-50');
        const numberDisplay = note.container.querySelector('.font-bold.mb-2');
        if (isCanceled) {
            note.container.classList.add('bg-red-50');
            if (numberDisplay) {
                numberDisplay.textContent = 'Cancelled';
                numberDisplay.classList.remove('text-gray-600');
                numberDisplay.classList.add('text-red-600');
            }
        } else {
            note.container.classList.add('bg-gray-50');
            if (numberDisplay && numberDisplay.textContent === 'Cancelled') {
                 const nonCancelledNotes = this.notes.filter(n => !n.canceled && n.container.dataset.noteId <= number);
                 numberDisplay.textContent = String(nonCancelledNotes.length); 
                 numberDisplay.classList.remove('text-red-600');
                 numberDisplay.classList.add('text-gray-600');
            }
        }
        
        // Update in-memory note object properties
        note.completed = true;
        note.canceled = isCanceled;
        
        // Sync and update in-memory timer properties
        note.timer.completed = true;
        if (!note.timer.endTimestamp && note.timer.hasStarted) {
            note.timer.stop();
        }
        note.timer.hasStarted = true; // Ensure hasStarted is true
        
        // Update timer display UI
        const timerDisplay = note.timer.displayElement;
        timerDisplay.classList.remove('text-gray-600', 'text-green-600', 'text-red-600');
        if (isCanceled) {
            timerDisplay.classList.add('text-red-600');
        } else {
            timerDisplay.classList.add('text-green-600');
        }

        // Explicitly update the note in the this.notes array with the modified object
        this.notes[noteIndex] = note;

        // Update the saved state in localStorage
        const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
        if (savedNotes[number]) {
            savedNotes[number].completed = note.completed; // Use updated in-memory state
            savedNotes[number].endTimestamp = note.timer.endTimestamp;
            savedNotes[number].hasStarted = note.timer.hasStarted;
            savedNotes[number].canceled = note.canceled; // Use updated in-memory state
            
            localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
            
            // Update button visibility (UI)
            note.saveButton.style.display = 'none';
            note.editButton.style.display = 'block';
            
            // Update statistics (UI)
            this.updateStatistics();
            this.updateProjectFailRates();
            
            // Logic for creating a new note if needed
            if (this.searchInput.value.trim() !== '') {
                this.searchNotes(this.searchInput.value);
            } else if (!this.isSearchActive) {
                const hasInProgressNote = this.notes.some(n => !n.completed && (n.elements.failingIssues.value.trim() !== '' || n.elements.nonFailingIssues.value.trim() !== '' || n.elements.discussion.value.trim() !== '' || n.elements.projectID.value.trim() !== '' || n.elements.attemptID.value.trim() !== ''));
                const hasEmptyNote = this.notes.some(n => !n.completed && n.elements.failingIssues.value.trim() === '' && n.elements.nonFailingIssues.value.trim() === '' && n.elements.discussion.value.trim() === '' && n.elements.projectID.value.trim() === '' && n.elements.attemptID.value.trim() === '');
                if (!hasEmptyNote && !hasInProgressNote) { 
                    // Append a new note and scroll it into view
                    const newNote = this.createNewNote(this.getNextNoteNumber());
                    newNote.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Focus the first textarea of the newly created note
                    newNote.elements.failingIssues.focus();
                }
            }
            
            // Clear editing flag
            if (this.editingNotes[this.currentDate] && this.editingNotes[this.currentDate][number]) {
                delete this.editingNotes[this.currentDate][number];
            }
        } else {
            // Note not found in savedNotes
        }
    }

    enableNoteEditing(number) {
        const note = this.notes.find(n => n.container.dataset.noteId == number);
        if (!note) return;
        
        const isCompleted = note.completed; // Use the note property instead of checking CSS
        if (isCompleted) {
            // Mark this note as being edited (not a new note), with date context
            if (!this.editingNotes[this.currentDate]) {
                this.editingNotes[this.currentDate] = {};
            }
            this.editingNotes[this.currentDate][number] = true;
            
            
            // Enable all textareas
            Object.values(note.elements).forEach(element => {
                if (element.tagName === 'TEXTAREA') {
                    element.disabled = false;
                    element.classList.remove('text-gray-500');
                    element.classList.add('text-black');
                    element.classList.add('pb-6'); // Changed to smaller padding
                }
            });
            
            // Enable ID fields
            note.elements.attemptID.disabled = false;
            note.elements.attemptID.classList.remove('text-gray-500', 'bg-gray-100');
            note.elements.attemptID.classList.add('text-black');
            
            note.elements.projectID.disabled = false;
            note.elements.projectID.classList.remove('text-gray-500', 'bg-gray-100');
            note.elements.projectID.classList.add('text-black');
            
            note.elements.operationID.disabled = false;
            note.elements.operationID.classList.remove('text-gray-500', 'bg-gray-100');
            note.elements.operationID.classList.add('text-black');
            
            note.container.classList.remove('bg-white', 'bg-gray-50', 'bg-red-50');
            note.container.classList.add('bg-white');
            
            // Update note object property
            note.completed = false;
            // Important: Preserve the canceled state even though we're editing
            // We'll use this when re-completing the note
            
            // Sync with timer
            note.timer.completed = false;
            // Make sure hasStarted is true when editing a completed note
            note.timer.hasStarted = true;
            
            const timerDisplay = note.timer.displayElement;
            timerDisplay.classList.remove('text-green-600', 'text-red-600');
            timerDisplay.classList.add('text-gray-600');
            
            // Focus the first textarea
            note.elements.failingIssues.focus();
            
            // Update the saved state
            const savedNotes = JSON.parse(localStorage.getItem(this.currentDate) || '{}');
            if (savedNotes[number]) {
                savedNotes[number].completed = false;
                savedNotes[number].hasStarted = true; // Ensure hasStarted is saved as true
                // This will be used when the note is completed again
                localStorage.setItem(this.currentDate, JSON.stringify(savedNotes));
            }
            
            // Restart timer regardless of endTimestamp
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
            const onPlatformSeconds = this.notes.reduce((total, note) => total + note.timer.getSeconds(), 0);
            const offPlatformSeconds = this.offPlatformTimer ? this.offPlatformTimer.getTotalSeconds() : 0;
            const totalSeconds = onPlatformSeconds + offPlatformSeconds;
            
            this.totalTimeDisplay.innerHTML = `
                <div class="flex items-center justify-between gap-4">
                    <div class="text-sm text-gray-600 space-y-1">
                        <div>On-platform: ${new Timer().formatTime(onPlatformSeconds)}</div>
                        <div>Off-platform: ${new Timer().formatTime(offPlatformSeconds)}</div>
                    </div>
                    <div class="font-semibold text-lg">Total: ${new Timer().formatTime(totalSeconds)}</div>
                </div>
            `;
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
            // Use the note completed property instead of checking CSS
            const isCompleted = note.completed;
            const isCanceled = note.canceled;
            
            // Only count if the note is completed AND not cancelled
            if (isCompleted && !isCanceled) {
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
            
            // Skip cancelled notes for project statistics
            if (note.canceled) return;
            
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

    // Add search functionality
    searchNotes(query) {
        query = query.trim().toLowerCase();
        
        // Set search active flag
        // Now implicit based on query
        
        // No longer stopping all note timers
        
        // Hide the off-platform section during search
        const offPlatformContainer = document.getElementById('offPlatformContainer');
        if (offPlatformContainer) {
            offPlatformContainer.style.display = 'none';
        }
        
        // Hide the date and total time bar during search
        const dateTimeBar = document.getElementById('totalTime').parentElement;
        if (dateTimeBar) {
            dateTimeBar.style.display = 'none';
        }
        
        // Clear the current container and update originalNotes
        if (query !== '') {
            this.container.innerHTML = '';
            
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
                
                Object.entries(notesForDate)
                    .sort(([a], [b]) => parseInt(b, 10) - parseInt(a, 10))
                    .forEach(([id, note]) => {
                        const projectID = (note.projectID || '').toLowerCase();
                        const attemptID = (note.attemptID || '').toLowerCase();
                        const operationID = (note.operationID || '').toLowerCase();
                        
                        if (projectID.includes(query) || operationID.includes(query) || attemptID.includes(query)) {
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
            // Show the off-platform container again
            if (offPlatformContainer) {
                offPlatformContainer.style.display = '';
            }
            
            // Show the date and total time bar again
            const dateTimeBar = document.getElementById('totalTime').parentElement;
            if (dateTimeBar) {
                dateTimeBar.style.display = '';
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
            
            // Only count if the note is completed AND not cancelled
            if (note.completed && !note.canceled) {
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
            
            // Skip cancelled notes for project statistics
            if (note.canceled) return;
            
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

        // Fallback: parse and render in local format
        const [yearStr, monthStr, dayStr] = dateString.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const day = parseInt(dayStr, 10);
        const date = new Date(year, month, day);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Render an individual search result
    renderSearchResult(dateKey, id, note, formattedDate) {
        // Create result container with styling matching regular notes
        const resultContainer = document.createElement('div');
        resultContainer.className = 'flex mb-4 p-4 rounded-lg shadow relative group ' +
            (note.completed ?
                (note.canceled ? 'bg-red-50' : 'bg-gray-50') :
                'bg-white');
        resultContainer.dataset.noteId = id;

        // Left sidebar with number, timer and ID fields (matching regular notes)
        const leftSidebar = document.createElement('div');
        leftSidebar.className = 'flex flex-col mr-4 min-w-32';

        // Note number display
        const numberDisplay = document.createElement('div');
        if (note.canceled) {
            numberDisplay.textContent = "Cancelled";
            numberDisplay.className = 'text-red-600 font-bold mb-2';
        } else {
            // Compute display index for non-canceled notes
            const saved = JSON.parse(localStorage.getItem(dateKey) || '{}');
            const nonCanceledIds = Object.entries(saved)
                .filter(([, data]) => !data.canceled)
                .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
                .map(([nid]) => nid);
            const idx = nonCanceledIds.indexOf(String(id));
            const displayIndex = idx !== -1 ? idx + 1 : nonCanceledIds.length + 1;
            numberDisplay.textContent = String(displayIndex);
            numberDisplay.className = 'text-gray-600 font-bold mb-2';
        }
        leftSidebar.appendChild(numberDisplay);

        // Timer display
        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'font-mono text-base mb-3 ' + 
            (note.completed ? 
                (note.canceled ? 'text-red-600' : 'text-green-600') : 
                'text-gray-600');
        timerDisplay.textContent = '00:00:00';
        leftSidebar.appendChild(timerDisplay);
        const timer = new Timer(note.startTimestamp, note.endTimestamp);
        timer.displayElement = timerDisplay;
        timer.additionalTime = note.additionalTime || 0;
        timer.updateDisplay();

        // Date label (placed after timer)
        const dateLabel = document.createElement('div');
        dateLabel.className = 'font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded mb-3';
        dateLabel.textContent = formattedDate;
        leftSidebar.appendChild(dateLabel);

        // Create ID fields container (vertical layout like regular notes)
        const idFieldsContainer = document.createElement('div');
        idFieldsContainer.className = 'flex flex-col gap-1';
        
        // Create ID field with copy functionality
        const createIDField = (value, labelText) => {
            if (!value) return null;

            const label = document.createElement('label');
            label.className = 'text-xs text-gray-500';
            label.textContent = labelText;
            
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'flex items-center gap-2';
            
            const displayText = value.length > 5 ? value.slice(-5) : value;
            const textSpan = document.createElement('span');
            textSpan.className = 'font-mono text-sm text-gray-700';
            textSpan.textContent = displayText;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'text-gray-600 hover:text-gray-800 transition-colors';
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 3h6a2 2 0 012 2v0a2 2 0 01-2 2H9a2 2 0 01-2-2v0a2 2 0 012-2z" /></svg>';
            copyBtn.title = `Copy ${labelText}`;
            const originalIcon = copyBtn.innerHTML;
            
            copyBtn.addEventListener('click', () => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(value).catch(err => console.error('Copy failed', err));
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = value;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }
                // Show feedback with checkmark
                copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalIcon;
                }, 1000);
            });
            
            fieldContainer.appendChild(textSpan);
            fieldContainer.appendChild(copyBtn);
            
            return { label, input: fieldContainer };
        };
        
        // Add ID fields in order like regular notes
        const projectField = createIDField(note.projectID, 'Project ID:');
        if (projectField) {
            idFieldsContainer.appendChild(projectField.label);
            idFieldsContainer.appendChild(projectField.input);
        }
        
        const attemptField = createIDField(note.attemptID, 'Attempt ID:');
        if (attemptField) {
            const label = document.createElement('label');
            label.className = 'text-xs text-gray-500 mt-1';
            label.textContent = 'Attempt ID:';
            idFieldsContainer.appendChild(label);
            idFieldsContainer.appendChild(attemptField.input);
        }
        
        const operationField = createIDField(note.operationID, 'Operation ID:');
        if (operationField) {
            const label = document.createElement('label');
            label.className = 'text-xs text-gray-500 mt-1';
            label.textContent = 'Operation ID:';
            idFieldsContainer.appendChild(label);
            idFieldsContainer.appendChild(operationField.input);
        }
        
        leftSidebar.appendChild(idFieldsContainer);

        // View full note button at bottom of sidebar
        const viewButton = document.createElement('button');
        viewButton.className = 'mt-3 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded';
        viewButton.textContent = 'View Full';
        viewButton.addEventListener('click', () => {
            // Change to the date of this note and load all notes for that date
            this.dateSelector.value = dateKey;
            this.currentDate = dateKey;
            this.searchInput.value = '';
            this.isSearchActive = false;
            
            // Restore the calendar bar visibility
            const dateTimeBar = document.getElementById('totalTime').parentElement;
            if (dateTimeBar) {
                dateTimeBar.style.display = '';
            }
            
            // Ensure off-platform container is visible
            const offPlatformContainer = document.getElementById('offPlatformContainer');
            if (offPlatformContainer) {
                offPlatformContainer.style.display = '';
            }
            
            this.loadNotes();
            this.createOffPlatformSection();
            
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
        // Content container (matching regular notes layout)
        const contentContainer = document.createElement('div');
        contentContainer.className = 'flex-grow flex flex-col gap-3';

        // Create the three sections (matching regular notes)
        const sections = [
            { label: 'Failing issues:', value: note.failingIssues, key: 'failingIssues' },
            { label: 'Non-failing issues:', value: note.nonFailingIssues, key: 'nonFailingIssues' },
            { label: 'Discussion:', value: note.discussion, key: 'discussion' }
        ];

        sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'flex flex-col';

            const label = document.createElement('div');
            label.className = 'font-bold mb-1 text-gray-700';
            label.textContent = section.label;

            const textarea = document.createElement('textarea');
            textarea.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
            textarea.className = 'w-full p-2 border border-gray-300 rounded text-base min-h-5 resize-none overflow-hidden text-gray-500';
            textarea.value = section.value || '';
            textarea.disabled = true;
            
            // Auto-resize textarea based on content
            setTimeout(() => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }, 0);

            sectionDiv.appendChild(label);
            sectionDiv.appendChild(textarea);
            contentContainer.appendChild(sectionDiv);
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
        const stickyContainer = document.getElementById('stickyTimerContainer') || document.createElement('div');
        if (!document.getElementById('stickyTimerContainer')) {
            stickyContainer.id = 'stickyTimerContainer';
            stickyContainer.className = 'hidden fixed top-0 left-0 right-0 bg-white shadow-md p-3 z-50 transition-all duration-300';
            document.body.appendChild(stickyContainer);
        } else {
            stickyContainer.innerHTML = '';
        }
        
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
        
        // Add the off-platform section to its dedicated container
        offPlatformContainer.appendChild(offPlatformSection);
        
        // Ensure current date is set before loading state
        this.offPlatformTimer.currentDate = this.currentDate;
        
        // Load timer state from localStorage and update displays
        this.offPlatformTimer.loadTimerState();
        
        // Make sure all displays are updated
        Object.keys(this.offPlatformTimer.timers).forEach(category => {
            this.offPlatformTimer.updateDisplay(category);
        });
        this.offPlatformTimer.updateTotalDisplay();
        
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
                // Create and store a reference to the sticky update interval
                if (!this.stickyUpdateIntervals) {
                    this.stickyUpdateIntervals = {};
                }
                
                // Clear any existing interval for this category
                if (this.stickyUpdateIntervals[category]) {
                    clearInterval(this.stickyUpdateIntervals[category]);
                }
                
                // Update display references for the sticky timer
                updateStickyContainer();
                
                // Start a dedicated interval for updating the sticky display that runs independently
                this.stickyUpdateIntervals[category] = setInterval(() => {
                    if (this.offPlatformTimer.displayElements[`sticky_${category}`]) {
                        this.offPlatformTimer.displayElements[`sticky_${category}`].textContent = 
                            this.offPlatformTimer.formatTime(this.offPlatformTimer.getSeconds(category));
                    }
                    
                    // Also check if we need to update visibility
                    const stickyContainer = document.getElementById('stickyTimerContainer');
                    if (stickyContainer) {
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
                }, 1000);
            });
            
            this.offPlatformTimer.onStop(category, () => {
                // Clear the sticky update interval when the timer stops
                if (this.stickyUpdateIntervals && this.stickyUpdateIntervals[category]) {
                    clearInterval(this.stickyUpdateIntervals[category]);
                    this.stickyUpdateIntervals[category] = null;
                }
                
                updateStickyContainer();
            });
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
        
        // Prevent form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveButton.click();
        });
        
        // Assemble form
        form.appendChild(timeInputContainer);
        form.appendChild(buttonContainer);
        
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

    // New method to export all notes to CSV
    exportToCSV() {
        const csvRows = [];
        const headers = ['Date', 'Note ID', 'Project ID', 'Attempt ID', 'Operation ID', 'Start Timestamp', 'End Timestamp', 'Duration', 'Canceled'];
        csvRows.push(headers.join(','));

        // Iterate through all dates and notes
        for (const dateKey in localStorage) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                const notesForDate = JSON.parse(localStorage.getItem(dateKey) || '{}');
                Object.entries(notesForDate).forEach(([noteId, note]) => {
                    // Only include completed notes (canceled or not)
                    if (note.completed) {
                        const startDate = note.startTimestamp ? new Date(note.startTimestamp).toLocaleString() : '';
                        const endDate = note.endTimestamp ? new Date(note.endTimestamp).toLocaleString() : '';
                        
                        const duration = this.calculateDuration(note.startTimestamp, note.endTimestamp, note.additionalTime);
                        const canceled = note.canceled ? 'Yes' : 'No';
                        
                        const row = [
                            dateKey,
                            noteId,
                            note.projectID,
                            note.attemptID,
                            note.operationID,
                            startDate,
                            endDate,
                            duration,
                            canceled
                        ];
                        csvRows.push(row.join(','));
                    }
                });
            }
        }

        // Create and download the CSV file
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'notes_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Helper method to calculate duration
    calculateDuration(startTimestamp, endTimestamp, additionalTime) {
        if (startTimestamp && endTimestamp) {
            const start = new Date(startTimestamp);
            const end = new Date(endTimestamp);
            const diff = end - start;
            const seconds = Math.floor(diff / 1000);
            return this.formatTime(seconds);
        } else if (additionalTime) {
            return this.formatTime(additionalTime);
        }
        return '';
    }

    // Helper method to format time
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

export default NoteApp;