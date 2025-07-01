import { DOMHelpers } from '../../core/utils/DOMHelpers.js';

export class ModalView {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.activeModal = null;
    }

    createTimerEditModal(category, label, currentHours, currentMinutes, currentSeconds) {
        return new Promise((resolve, reject) => {
            if (this.activeModal) {
                this.closeModal();
            }

            const overlay = DOMHelpers.createElement('div', 
                'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
            );

            const dialog = DOMHelpers.createElement('div', 
                this.themeManager.combineClasses(
                    'rounded-lg shadow-lg p-6 w-full max-w-md',
                    this.themeManager.getColor('background', 'card')
                )
            );

            const header = DOMHelpers.createElement('h3', 
                this.themeManager.combineClasses(
                    'text-lg font-semibold mb-4',
                    this.themeManager.getColor('text', 'primary')
                ),
                `Edit ${label} Timer`
            );

            const form = this.createTimeInputForm(currentHours, currentMinutes, currentSeconds);
            const buttonContainer = this.createModalButtons(
                () => {
                    const values = this.extractTimeValues(form);
                    this.closeModal();
                    resolve(values);
                },
                () => {
                    this.closeModal();
                    reject(new Error('User cancelled'));
                }
            );

            form.appendChild(buttonContainer);
            dialog.appendChild(header);
            dialog.appendChild(form);
            overlay.appendChild(dialog);

            document.body.appendChild(overlay);
            this.activeModal = overlay;

            const hoursInput = form.querySelector('input[data-time-part="hours"]');
            if (hoursInput) {
                hoursInput.focus();
                hoursInput.select();
            }
        });
    }

    createTimeInputForm(hours, minutes, seconds) {
        const form = DOMHelpers.createElement('form', 'space-y-4');

        const timeInputContainer = DOMHelpers.createElement('div', 
            'flex gap-2 items-center justify-center'
        );

        const inputClasses = this.themeManager.combineClasses(
            'w-16 rounded px-2 py-1 text-center border',
            this.themeManager.getColor('border', 'secondary')
        );

        const labelClasses = this.themeManager.getColor('text', 'tertiary');

        const hoursInput = DOMHelpers.createInput('number', inputClasses, hours);
        hoursInput.min = 0;
        hoursInput.dataset.timePart = 'hours';

        const minutesInput = DOMHelpers.createInput('number', inputClasses, minutes);
        minutesInput.min = 0;
        minutesInput.max = 59;
        minutesInput.dataset.timePart = 'minutes';

        const secondsInput = DOMHelpers.createInput('number', inputClasses, seconds);
        secondsInput.min = 0;
        secondsInput.max = 59;
        secondsInput.dataset.timePart = 'seconds';

        timeInputContainer.appendChild(hoursInput);
        timeInputContainer.appendChild(DOMHelpers.createElement('span', labelClasses, 'hrs'));
        timeInputContainer.appendChild(minutesInput);
        timeInputContainer.appendChild(DOMHelpers.createElement('span', labelClasses, 'min'));
        timeInputContainer.appendChild(secondsInput);
        timeInputContainer.appendChild(DOMHelpers.createElement('span', labelClasses, 'sec'));

        form.appendChild(timeInputContainer);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const saveButton = form.querySelector('[data-action="save"]');
            if (saveButton) saveButton.click();
        });

        return form;
    }

    createModalButtons(onSave, onCancel) {
        const buttonContainer = DOMHelpers.createElement('div', 
            'flex gap-2 justify-end mt-6'
        );

        const cancelButton = DOMHelpers.createButton(
            'Cancel',
            this.themeManager.getButtonClasses('secondary'),
            onCancel
        );

        const saveButton = DOMHelpers.createButton(
            'Save',
            this.themeManager.getButtonClasses('primary'),
            onSave
        );
        saveButton.dataset.action = 'save';

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);

        return buttonContainer;
    }

    extractTimeValues(form) {
        const hoursInput = form.querySelector('[data-time-part="hours"]');
        const minutesInput = form.querySelector('[data-time-part="minutes"]');
        const secondsInput = form.querySelector('[data-time-part="seconds"]');

        return {
            hours: parseInt(hoursInput.value) || 0,
            minutes: parseInt(minutesInput.value) || 0,
            seconds: parseInt(secondsInput.value) || 0
        };
    }

    closeModal() {
        if (this.activeModal) {
            document.body.removeChild(this.activeModal);
            this.activeModal = null;
        }
    }

    isModalOpen() {
        return !!this.activeModal;
    }
}