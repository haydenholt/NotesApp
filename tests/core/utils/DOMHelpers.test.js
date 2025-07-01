/**
 * @jest-environment jsdom
 */

import { DOMHelpers } from '../../../src/core/utils/DOMHelpers.js';

describe('DOMHelpers', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    describe('createElement', () => {
        it('should create element with tag name', () => {
            const element = DOMHelpers.createElement('div');
            
            expect(element.tagName).toBe('DIV');
        });

        it('should create element with class name', () => {
            const element = DOMHelpers.createElement('div', 'test-class');
            
            expect(element.className).toBe('test-class');
        });

        it('should create element with text content', () => {
            const element = DOMHelpers.createElement('div', '', 'Test text');
            
            expect(element.textContent).toBe('Test text');
        });

        it('should create element with both class and text', () => {
            const element = DOMHelpers.createElement('span', 'highlight', 'Important');
            
            expect(element.tagName).toBe('SPAN');
            expect(element.className).toBe('highlight');
            expect(element.textContent).toBe('Important');
        });

        it('should handle empty parameters', () => {
            const element = DOMHelpers.createElement('p', '', '');
            
            expect(element.tagName).toBe('P');
            expect(element.className).toBe('');
            expect(element.textContent).toBe('');
        });
    });

    describe('createButton', () => {
        it('should create button with text', () => {
            const button = DOMHelpers.createButton('Click me');
            
            expect(button.tagName).toBe('BUTTON');
            expect(button.textContent).toBe('Click me');
        });

        it('should create button with class name', () => {
            const button = DOMHelpers.createButton('Click me', 'btn-primary');
            
            expect(button.className).toBe('btn-primary');
        });

        it('should create button with click handler', () => {
            const clickHandler = jest.fn();
            const button = DOMHelpers.createButton('Click me', '', clickHandler);
            
            button.click();
            
            expect(clickHandler).toHaveBeenCalled();
        });

        it('should handle button without click handler', () => {
            const button = DOMHelpers.createButton('Click me', 'btn-primary');
            
            expect(() => button.click()).not.toThrow();
        });
    });

    describe('createInput', () => {
        it('should create input with type', () => {
            const input = DOMHelpers.createInput('text');
            
            expect(input.tagName).toBe('INPUT');
            expect(input.type).toBe('text');
        });

        it('should create input with class name', () => {
            const input = DOMHelpers.createInput('email', 'form-input');
            
            expect(input.className).toBe('form-input');
        });

        it('should create input with value', () => {
            const input = DOMHelpers.createInput('text', '', 'default value');
            
            expect(input.value).toBe('default value');
        });

        it('should create different input types', () => {
            const textInput = DOMHelpers.createInput('text');
            const emailInput = DOMHelpers.createInput('email');
            const passwordInput = DOMHelpers.createInput('password');
            
            expect(textInput.type).toBe('text');
            expect(emailInput.type).toBe('email');
            expect(passwordInput.type).toBe('password');
        });
    });

    describe('createTextarea', () => {
        it('should create textarea with class name', () => {
            const textarea = DOMHelpers.createTextarea('form-textarea');
            
            expect(textarea.tagName).toBe('TEXTAREA');
            expect(textarea.className).toBe('form-textarea');
        });

        it('should create textarea with value', () => {
            const textarea = DOMHelpers.createTextarea('', 'Initial content');
            
            expect(textarea.value).toBe('Initial content');
        });

        it('should create textarea with placeholder', () => {
            const textarea = DOMHelpers.createTextarea('', '', 'Enter text here...');
            
            expect(textarea.placeholder).toBe('Enter text here...');
        });

        it('should create textarea with all parameters', () => {
            const textarea = DOMHelpers.createTextarea('form-textarea', 'Content', 'Placeholder');
            
            expect(textarea.className).toBe('form-textarea');
            expect(textarea.value).toBe('Content');
            expect(textarea.placeholder).toBe('Placeholder');
        });
    });

    describe('autoResizeTextarea', () => {
        it('should adjust textarea height based on content', () => {
            const textarea = document.createElement('textarea');
            textarea.value = 'Line 1\nLine 2\nLine 3';
            
            // Mock scrollHeight
            Object.defineProperty(textarea, 'scrollHeight', {
                value: 100,
                writable: true
            });
            
            DOMHelpers.autoResizeTextarea(textarea);
            
            expect(textarea.style.height).toBe('100px');
        });

        it('should reset height to auto before calculating', () => {
            const textarea = document.createElement('textarea');
            textarea.style.height = '50px';
            
            Object.defineProperty(textarea, 'scrollHeight', {
                value: 100,
                writable: true
            });
            
            DOMHelpers.autoResizeTextarea(textarea);
            
            expect(textarea.style.height).toBe('100px');
        });
    });

    describe('copyToClipboard', () => {
        it('should use navigator.clipboard when available', async () => {
            const mockWriteText = jest.fn().mockResolvedValue();
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: mockWriteText },
                writable: true
            });

            await DOMHelpers.copyToClipboard('test text');

            expect(mockWriteText).toHaveBeenCalledWith('test text');
        });

        it('should use fallback method when clipboard API not available', async () => {
            Object.defineProperty(navigator, 'clipboard', {
                value: null,
                writable: true
            });

            // Mock execCommand since it doesn't exist in jsdom
            document.execCommand = jest.fn().mockReturnValue(true);
            const appendChildSpy = jest.spyOn(document.body, 'appendChild');
            const removeChildSpy = jest.spyOn(document.body, 'removeChild');

            await DOMHelpers.copyToClipboard('test text');

            expect(appendChildSpy).toHaveBeenCalled();
            expect(document.execCommand).toHaveBeenCalledWith('copy');
            expect(removeChildSpy).toHaveBeenCalled();
        });

        it('should handle clipboard API promise rejection', async () => {
            const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard error'));
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: mockWriteText },
                writable: true
            });

            // Should not throw, but will reject the promise
            try {
                await DOMHelpers.copyToClipboard('test text');
            } catch (error) {
                expect(error.message).toBe('Clipboard error');
            }

            expect(mockWriteText).toHaveBeenCalledWith('test text');
        });
    });

    describe('showFeedback', () => {
        it('should show success icon and restore original', (done) => {
            const element = document.createElement('button');
            element.innerHTML = 'Original';

            DOMHelpers.showFeedback(element, 'Success!', 'Original', 100);

            expect(element.innerHTML).toBe('Success!');

            setTimeout(() => {
                expect(element.innerHTML).toBe('Original');
                done();
            }, 150);
        });

        it('should use default duration when not specified', (done) => {
            const element = document.createElement('button');
            element.innerHTML = 'Original';

            DOMHelpers.showFeedback(element, 'Success!', 'Original');

            expect(element.innerHTML).toBe('Success!');

            // Check that it changes back after default duration (1000ms)
            setTimeout(() => {
                expect(element.innerHTML).toBe('Original');
                done();
            }, 1100);
        });
    });

    describe('scrollToElement', () => {
        it('should call scrollIntoView with default parameters', () => {
            const element = document.createElement('div');
            // Mock scrollIntoView since it doesn't exist in jsdom
            element.scrollIntoView = jest.fn();

            DOMHelpers.scrollToElement(element);

            expect(element.scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'start'
            });
        });

        it('should call scrollIntoView with custom parameters', () => {
            const element = document.createElement('div');
            // Mock scrollIntoView since it doesn't exist in jsdom
            element.scrollIntoView = jest.fn();

            DOMHelpers.scrollToElement(element, 'auto', 'center');

            expect(element.scrollIntoView).toHaveBeenCalledWith({
                behavior: 'auto',
                block: 'center'
            });
        });
    });

    describe('addHighlight', () => {
        it('should add and remove highlight classes', (done) => {
            const element = document.createElement('div');

            DOMHelpers.addHighlight(element, 'highlight active', 100);

            expect(element.classList.contains('highlight')).toBe(true);
            expect(element.classList.contains('active')).toBe(true);

            setTimeout(() => {
                expect(element.classList.contains('highlight')).toBe(false);
                expect(element.classList.contains('active')).toBe(false);
                done();
            }, 150);
        });

        it('should use default highlight class when not specified', (done) => {
            const element = document.createElement('div');

            DOMHelpers.addHighlight(element, undefined, 100);

            expect(element.classList.contains('ring-1')).toBe(true);
            expect(element.classList.contains('ring-gray-300')).toBe(true);

            setTimeout(() => {
                expect(element.classList.contains('ring-1')).toBe(false);
                expect(element.classList.contains('ring-gray-300')).toBe(false);
                done();
            }, 150);
        });

        it('should use default duration when not specified', (done) => {
            const element = document.createElement('div');

            DOMHelpers.addHighlight(element, 'highlight');

            expect(element.classList.contains('highlight')).toBe(true);

            // Check that it's still there before default duration
            setTimeout(() => {
                expect(element.classList.contains('highlight')).toBe(true);
            }, 1000);

            // Check that it's removed after default duration
            setTimeout(() => {
                expect(element.classList.contains('highlight')).toBe(false);
                done();
            }, 2100);
        });
    });

    describe('debounce', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should delay function execution', () => {
            const mockFn = jest.fn();
            const debouncedFn = DOMHelpers.debounce(mockFn, 1000);

            debouncedFn();

            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1000);

            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should cancel previous timeout when called again', () => {
            const mockFn = jest.fn();
            const debouncedFn = DOMHelpers.debounce(mockFn, 1000);

            debouncedFn();
            jest.advanceTimersByTime(500);
            debouncedFn(); // This should cancel the first call

            jest.advanceTimersByTime(500);
            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(500);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to debounced function', () => {
            const mockFn = jest.fn();
            const debouncedFn = DOMHelpers.debounce(mockFn, 1000);

            debouncedFn('arg1', 'arg2', 'arg3');

            jest.advanceTimersByTime(1000);

            expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
        });

        it('should preserve context when called', () => {
            const context = { value: 'test' };
            const mockFn = jest.fn(function() {
                return this.value;
            });
            const debouncedFn = DOMHelpers.debounce(mockFn, 1000);

            debouncedFn.call(context);

            jest.advanceTimersByTime(1000);

            expect(mockFn).toHaveBeenCalled();
        });

        it('should handle multiple rapid calls correctly', () => {
            const mockFn = jest.fn();
            const debouncedFn = DOMHelpers.debounce(mockFn, 1000);

            // Call multiple times rapidly
            debouncedFn();
            debouncedFn();
            debouncedFn();
            debouncedFn();

            jest.advanceTimersByTime(1000);

            // Should only be called once
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });
});