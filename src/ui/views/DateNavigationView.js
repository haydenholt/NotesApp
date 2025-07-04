import { DOMHelpers } from '../../core/utils/DOMHelpers.js';
import { DateUtils } from '../../core/utils/DateUtils.js';

export class DateNavigationView {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.container = null;
        this.dateSelector = null;
        this.listeners = {
            dateChanged: []
        };
    }

    render(parentElement, currentDate) {
        const dateSelector = parentElement.querySelector('#dateSelector');
        if (!dateSelector) {
            console.error('Date selector element not found');
            return;
        }

        this.dateSelector = dateSelector;
        this.dateSelector.value = currentDate;

        this.createNavigationContainer();
        this.setupEventListeners();
    }

    createNavigationContainer() {
        const containerClasses = this.themeManager.combineClasses(
            'flex items-center rounded-lg overflow-hidden shadow-sm border',
            this.themeManager.getColor('background', 'card'),
            this.themeManager.getColor('border', 'primary')
        );
        
        const dateNavContainer = DOMHelpers.createElement('div', containerClasses);

        const prevButton = this.createNavigationButton('‹', 'Previous day', -1);
        const nextButton = this.createNavigationButton('›', 'Next day', 1);

        this.styleDateSelector();

        const parent = this.dateSelector.parentNode;
        parent.removeChild(this.dateSelector);

        dateNavContainer.appendChild(prevButton);
        dateNavContainer.appendChild(this.dateSelector);
        dateNavContainer.appendChild(nextButton);

        parent.appendChild(dateNavContainer);
        this.container = dateNavContainer;
    }

    createNavigationButton(text, title, dayOffset) {
        const borderClass = dayOffset < 0 ? 'border-r' : 'border-l';
        const buttonClasses = this.themeManager.combineClasses(
            `px-3 py-2 ${borderClass} transition-colors`,
            this.themeManager.getColor('background', 'card'),
            this.themeManager.getColor('border', 'primary'),
            this.themeManager.getColor('text', 'secondary'),
            `hover:${this.themeManager.getColor('background', 'secondary')}`,
            `hover:${this.themeManager.getColor('text', 'primary')}`
        );

        const button = DOMHelpers.createButton(text, buttonClasses, () => {
            this.changeDate(dayOffset);
        });
        
        button.title = title;
        return button;
    }

    styleDateSelector() {
        const selectorClasses = this.themeManager.combineClasses(
            'px-3 py-2 min-w-32',
            this.themeManager.getFocusClasses().combined,
            this.themeManager.getColor('background', 'card'),
            this.themeManager.getColor('text', 'secondary')
        );
        
        this.dateSelector.className = selectorClasses;
    }

    changeDate(dayOffset) {
        const currentDate = this.dateSelector.value;
        const newDate = DateUtils.addDays(currentDate, dayOffset);
        this.dateSelector.value = newDate;
        
        this.notifyDateChange(newDate);
    }

    setupEventListeners() {
        this.dateSelector.addEventListener('change', () => {
            this.notifyDateChange(this.dateSelector.value);
        });
    }

    notifyDateChange(newDate) {
        this.notifyListeners('dateChanged', { newDate });
    }

    updateTheme() {
        if (!this.container) return;

        this.container.className = this.themeManager.combineClasses(
            'flex items-center rounded-lg overflow-hidden shadow-sm border',
            this.themeManager.getColor('background', 'card'),
            this.themeManager.getColor('border', 'primary')
        );

        const buttons = this.container.querySelectorAll('button');
        buttons.forEach((button, index) => {
            const borderClass = index === 0 ? 'border-r' : 'border-l';
            button.className = this.themeManager.combineClasses(
                `px-3 py-2 ${borderClass} transition-colors`,
                this.themeManager.getColor('background', 'card'),
                this.themeManager.getColor('border', 'primary'),
                this.themeManager.getColor('text', 'secondary'),
                `hover:${this.themeManager.getColor('background', 'secondary')}`,
                `hover:${this.themeManager.getColor('text', 'primary')}`
            );
        });

        this.styleDateSelector();
    }

    getCurrentDate() {
        return this.dateSelector ? this.dateSelector.value : null;
    }

    setCurrentDate(date) {
        if (this.dateSelector) {
            this.dateSelector.value = date;
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
                    console.error(`Error in DateNavigationView ${event} listener:`, error);
                }
            });
        }
    }
}