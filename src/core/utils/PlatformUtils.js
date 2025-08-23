/**
 * Platform detection and keyboard utilities
 */
export class PlatformUtils {
    /**
     * Check if running on macOS
     * @returns {boolean}
     */
    static isMac() {
        return /Mac|iPhone|iPod|iPad/i.test(navigator.platform) || 
               /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
    }

    /**
     * Get the appropriate modifier key for the platform
     * @returns {string} 'metaKey' for Mac, 'ctrlKey' for others
     */
    static getModifierKey() {
        return this.isMac() ? 'metaKey' : 'ctrlKey';
    }

    /**
     * Get the modifier key display name
     * @returns {string} '⌘' for Mac, 'Ctrl' for others
     */
    static getModifierDisplay() {
        return this.isMac() ? '⌘' : 'Ctrl';
    }

    /**
     * Check if the modifier key is pressed in an event
     * @param {KeyboardEvent} event
     * @returns {boolean}
     */
    static isModifierPressed(event) {
        return this.isMac() ? event.metaKey : event.ctrlKey;
    }

    /**
     * Create a keyboard event with the correct modifier
     * @param {string} key
     * @param {Object} options
     * @returns {KeyboardEvent}
     */
    static createKeyboardEvent(key, options = {}) {
        const modifierKey = this.getModifierKey();
        return new KeyboardEvent('keydown', {
            key,
            [modifierKey]: true,
            ...options
        });
    }
}