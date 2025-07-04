import { DOMHelpers } from '../../core/utils/DOMHelpers.js';
import { TimeFormatter } from '../../core/utils/TimeFormatter.js';
import Timer from '../components/Timer.js';

export class SearchResultsView {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.container = null;
        this.listeners = {
            resultClicked: []
        };
    }

    render(containerElement) {
        this.container = containerElement;
        this.clear();
    }

    renderSearchResults(results, query) {
        if (!this.container) return;

        this.clear();
        this.addSearchHeader(query, results.length);

        if (results.length === 0) {
            this.addNoResultsMessage();
        } else {
            results.forEach(result => this.addSearchResult(result));
            this.addResultsCount(results.length);
        }
    }

    addSearchHeader(query, count) {
        const heading = DOMHelpers.createElement('div', 
            this.themeManager.combineClasses(
                'w-full text-lg font-bold mb-4',
                this.themeManager.getColor('text', 'secondary')
            ),
            'Search Results'
        );
        this.container.appendChild(heading);
    }

    addNoResultsMessage() {
        const noResults = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'w-full text-center py-8',
                this.themeManager.getEmptyStateClasses().text
            ),
            'No matching notes found'
        );
        this.container.appendChild(noResults);
    }

    addResultsCount(count) {
        const countInfo = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'text-center mt-4 mb-6 text-sm',
                this.themeManager.getColor('text', 'muted')
            ),
            `Showing all ${count} matching notes`
        );
        this.container.appendChild(countInfo);
    }

    addSearchResult(result) {
        const { dateKey, id, note, formattedDate, displayIndex } = result;

        const resultContainer = this.createResultContainer(note, id);
        const leftSidebar = this.createLeftSidebar(note, id, dateKey, formattedDate, displayIndex);
        const contentContainer = this.createContentContainer(note);

        resultContainer.appendChild(leftSidebar);
        resultContainer.appendChild(contentContainer);
        this.container.appendChild(resultContainer);
    }

    createResultContainer(note, id) {
        const baseClasses = 'flex mb-4 p-4 rounded-lg shadow relative group';
        let bgClass;
        
        if (note.completed) {
            bgClass = note.canceled ? 
                this.themeManager.getColor('note', 'cancelled') : 
                this.themeManager.getColor('note', 'completed');
        } else {
            bgClass = this.themeManager.getColor('background', 'card');
        }

        const container = DOMHelpers.createElement('div', `${baseClasses} ${bgClass}`);
        container.dataset.noteId = id;
        return container;
    }

    createLeftSidebar(note, id, dateKey, formattedDate, displayIndex) {
        const leftSidebar = DOMHelpers.createElement('div', 'flex flex-col mr-4 min-w-32');

        leftSidebar.appendChild(this.createNumberDisplay(note, displayIndex, dateKey));
        leftSidebar.appendChild(this.createTimerDisplay(note));
        leftSidebar.appendChild(this.createDateLabel(formattedDate));
        leftSidebar.appendChild(this.createIdFields(note));
        leftSidebar.appendChild(this.createViewButton(dateKey, id));

        return leftSidebar;
    }

    createNumberDisplay(note, displayIndex, dateKey) {
        const numberDisplay = DOMHelpers.createElement('div', '', '');
        
        if (note.canceled) {
            numberDisplay.textContent = "Cancelled";
            numberDisplay.className = this.themeManager.combineClasses(
                'font-bold mb-2',
                this.themeManager.getColor('note', 'cancelledNumber')
            );
        } else {
            numberDisplay.textContent = String(displayIndex || 1);
            numberDisplay.className = this.themeManager.combineClasses(
                'font-bold mb-2',
                this.themeManager.getColor('text', 'tertiary')
            );
        }

        return numberDisplay;
    }

    createTimerDisplay(note) {
        let timerColorClass;
        if (note.completed) {
            timerColorClass = note.canceled ? 
                this.themeManager.getStatusClasses('error') : 
                this.themeManager.getStatusClasses('success');
        } else {
            timerColorClass = this.themeManager.getColor('timer', 'inactive');
        }

        const timerDisplay = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'font-mono text-base mb-3',
                timerColorClass
            ),
            '00:00:00'
        );

        const timer = new Timer(note.startTimestamp, note.endTimestamp);
        timer.displayElement = timerDisplay;
        timer.additionalTime = note.additionalTime || 0;
        timer.updateDisplay();

        return timerDisplay;
    }

    createDateLabel(formattedDate) {
        const dateLabel = DOMHelpers.createElement('div',
            this.themeManager.combineClasses(
                'font-mono text-xs px-2 py-1 rounded mb-3',
                this.themeManager.getColor('background', 'secondary'),
                this.themeManager.getColor('text', 'muted')
            ),
            formattedDate
        );
        return dateLabel;
    }

    createIdFields(note) {
        const idFieldsContainer = DOMHelpers.createElement('div', 'flex flex-col gap-1');

        const fields = [
            { value: note.projectID, label: 'Project ID:' },
            { value: note.attemptID, label: 'Attempt ID:' },
            { value: note.operationID, label: 'Operation ID:' }
        ];

        fields.forEach((field, index) => {
            const fieldElement = this.createIDField(field.value, field.label);
            if (fieldElement) {
                if (index > 0) {
                    const label = fieldElement.label;
                    label.className = this.themeManager.combineClasses(
                        'mt-1',
                        this.themeManager.getLabelClasses('small')
                    );
                }
                idFieldsContainer.appendChild(fieldElement.label);
                idFieldsContainer.appendChild(fieldElement.input);
            }
        });

        return idFieldsContainer;
    }

    createIDField(value, labelText) {
        if (!value) return null;

        const label = DOMHelpers.createElement('label', 
            this.themeManager.getLabelClasses('small'),
            labelText
        );

        const fieldContainer = DOMHelpers.createElement('div', 'flex items-center gap-2');

        const displayText = value.length > 5 ? value.slice(-5) : value;
        const textSpan = DOMHelpers.createElement('span',
            this.themeManager.combineClasses(
                'font-mono text-sm',
                this.themeManager.getColor('text', 'secondary')
            ),
            displayText
        );

        const copyBtn = this.createCopyButton(value, labelText);

        fieldContainer.appendChild(textSpan);
        fieldContainer.appendChild(copyBtn);

        return { label, input: fieldContainer };
    }

    createCopyButton(value, labelText) {
        const copyBtn = DOMHelpers.createElement('button',
            this.themeManager.combineClasses(
                'transition-colors',
                this.themeManager.getColor('text', 'tertiary'),
                `hover:${this.themeManager.getColor('text', 'secondary')}`
            )
        );

        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 3h6a2 2 0 012 2v0a2 2 0 01-2 2H9a2 2 0 01-2-2v0a2 2 0 012-2z" /></svg>';
        copyBtn.title = `Copy ${labelText}`;

        const originalIcon = copyBtn.innerHTML;

        copyBtn.addEventListener('click', () => {
            DOMHelpers.copyToClipboard(value).then(() => {
                const successIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ${this.themeManager.getStatusClasses('success')}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
                DOMHelpers.showFeedback(copyBtn, successIcon, originalIcon);
            }).catch(err => {
                console.error('Copy failed', err);
            });
        });

        return copyBtn;
    }

    createViewButton(dateKey, noteId) {
        const viewButton = DOMHelpers.createButton(
            'View Full',
            this.themeManager.combineClasses(
                'mt-3',
                this.themeManager.getPrimaryButtonClasses('sm')
            ),
            () => {
                this.notifyListeners('resultClicked', { dateKey, noteId });
            }
        );

        return viewButton;
    }

    createContentContainer(note) {
        const contentContainer = DOMHelpers.createElement('div', 'flex-grow flex flex-col gap-3');

        const sections = [
            { label: 'Failing issues:', value: note.failingIssues },
            { label: 'Non-failing issues:', value: note.nonFailingIssues },
            { label: 'Discussion:', value: note.discussion }
        ];

        sections.forEach(section => {
            const sectionDiv = DOMHelpers.createElement('div', 'flex flex-col');

            const label = DOMHelpers.createElement('div',
                this.themeManager.combineClasses(
                    'font-bold mb-1',
                    this.themeManager.getColor('text', 'secondary')
                ),
                section.label
            );

            const textarea = DOMHelpers.createTextarea(
                this.themeManager.combineClasses(
                    'w-full p-2 border rounded text-base min-h-5 resize-none overflow-hidden',
                    this.themeManager.getColor('border', 'primary'),
                    this.themeManager.getColor('text', 'muted'),
                    this.themeManager.getColor('background', 'secondary')
                ),
                section.value || ''
            );

            textarea.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
            textarea.disabled = true;

            setTimeout(() => {
                DOMHelpers.autoResizeTextarea(textarea);
            }, 0);

            sectionDiv.appendChild(label);
            sectionDiv.appendChild(textarea);
            contentContainer.appendChild(sectionDiv);
        });

        return contentContainer;
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in SearchResultsView ${event} listener:`, error);
                }
            });
        }
    }
}