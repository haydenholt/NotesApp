export class DOMHelpers {
    static createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    static createButton(text, className, clickHandler) {
        const button = this.createElement('button', className, text);
        if (clickHandler) button.addEventListener('click', clickHandler);
        return button;
    }

    static createInput(type, className, value = '') {
        const input = document.createElement('input');
        input.type = type;
        input.className = className;
        input.value = value;
        return input;
    }

    static createTextarea(className, value = '', placeholder = '') {
        const textarea = document.createElement('textarea');
        textarea.className = className;
        textarea.value = value;
        textarea.placeholder = placeholder;
        return textarea;
    }

    static autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    static copyToClipboard(text, fallbackElement = null) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return Promise.resolve();
        }
    }

    static showFeedback(element, successIcon, originalIcon, duration = 1000) {
        element.innerHTML = successIcon;
        setTimeout(() => {
            element.innerHTML = originalIcon;
        }, duration);
    }

    static scrollToElement(element, behavior = 'smooth', block = 'start') {
        element.scrollIntoView({ behavior, block });
    }

    static addHighlight(element, className = 'ring-1 ring-gray-300', duration = 2000) {
        const classes = className.split(' ');
        element.classList.add(...classes);
        setTimeout(() => {
            element.classList.remove(...classes);
        }, duration);
    }

    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
}