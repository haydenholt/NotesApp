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

    static showFeedback(element, successContent, originalContent, duration = 1000) {
        // Clear element and add success content
        element.textContent = '';
        if (typeof successContent === 'string') {
            // If it's a string, try to parse as HTML safely using DOMParser
            if (successContent.startsWith('<svg')) {
                // For SVG strings, use DOMParser for secure parsing
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(successContent, 'image/svg+xml');
                    const svg = doc.documentElement;
                    
                    // Check for parsing errors
                    const parseError = doc.querySelector('parsererror');
                    if (!parseError && svg && svg.tagName === 'svg') {
                        element.appendChild(svg.cloneNode(true));
                    } else {
                        // Fallback to text content if parsing fails
                        element.textContent = successContent;
                    }
                } catch (error) {
                    console.warn('Failed to parse SVG content safely:', error);
                    element.textContent = successContent;
                }
            } else {
                element.textContent = successContent;
            }
        } else {
            // If it's already a DOM element
            element.appendChild(successContent.cloneNode(true));
        }
        
        setTimeout(() => {
            element.textContent = '';
            if (typeof originalContent === 'string') {
                if (originalContent.startsWith('<svg')) {
                    // For SVG strings, use DOMParser for secure parsing
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(originalContent, 'image/svg+xml');
                        const svg = doc.documentElement;
                        
                        // Check for parsing errors
                        const parseError = doc.querySelector('parsererror');
                        if (!parseError && svg && svg.tagName === 'svg') {
                            element.appendChild(svg.cloneNode(true));
                        } else {
                            // Fallback to text content if parsing fails
                            element.textContent = originalContent;
                        }
                    } catch (error) {
                        console.warn('Failed to parse SVG content safely:', error);
                        element.textContent = originalContent;
                    }
                } else {
                    element.textContent = originalContent;
                }
            } else {
                element.appendChild(originalContent.cloneNode(true));
            }
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

    static saveScrollPosition() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    }

    static restoreScrollPosition(position, behavior = 'instant') {
        if (!position || typeof position.x === 'undefined' || typeof position.y === 'undefined') {
            return;
        }
        
        // Scroll immediately without delay
        window.scrollTo({
            left: position.x,
            top: position.y,
            behavior: behavior
        });
    }

    static preserveScrollDuring(operation) {
        const scrollPos = this.saveScrollPosition();
        const result = operation();
        
        // Handle both sync and async operations
        if (result && typeof result.then === 'function') {
            return result.then(res => {
                this.restoreScrollPosition(scrollPos);
                return res;
            });
        } else {
            this.restoreScrollPosition(scrollPos);
            return result;
        }
    }
}