/**
 * Security utilities for input sanitization and safe rendering
 */
export class SecurityUtils {
    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} str - The string to escape
     * @returns {string} - The escaped string
     */
    static escapeHtml(str) {
        if (str === null || str === undefined) return '';
        
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    /**
     * Sanitize user input by removing HTML tags and dangerous characters
     * @param {string} input - The input to sanitize
     * @returns {string} - The sanitized input
     */
    static sanitizeInput(input) {
        if (!input) return '';
        
        // Convert to string and remove all HTML tags
        let sanitized = String(input).replace(/<[^>]*>/g, '');
        
        // Remove any script-related strings
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        
        // Trim whitespace
        return sanitized.trim();
    }

    /**
     * Validate and sanitize JSON data from localStorage
     * @param {string} key - The localStorage key
     * @param {object} schema - Optional schema for validation
     * @returns {object|null} - The parsed and validated data, or null if invalid
     */
    static validateStorageData(key, schema = null) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            
            // Basic type validation
            if (typeof parsed !== 'object' || parsed === null) {
                console.warn(`Invalid data type for key ${key}`);
                return null;
            }
            
            // Schema validation if provided
            if (schema) {
                if (!this.validateSchema(parsed, schema)) {
                    console.warn(`Data for key ${key} does not match schema`);
                    return null;
                }
            }
            
            return parsed;
        } catch (error) {
            console.error(`Error parsing data for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Basic schema validation
     * @param {object} data - Data to validate
     * @param {object} schema - Schema definition
     * @returns {boolean} - Whether data matches schema
     */
    static validateSchema(data, schema) {
        for (const key in schema) {
            if (schema.hasOwnProperty(key)) {
                const expectedType = schema[key];
                const actualType = typeof data[key];
                
                if (expectedType === 'optional') continue;
                
                if (data[key] === undefined || data[key] === null) {
                    if (expectedType !== 'optional') return false;
                } else if (actualType !== expectedType) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Sanitize note data before saving
     * @param {object} noteData - The note data to sanitize
     * @returns {object} - The sanitized note data
     */
    static sanitizeNoteData(noteData) {
        const sanitized = {};
        
        // Define allowed fields and their types
        const allowedFields = {
            discussion: 'string',
            failingIssues: 'string',
            nonFailingIssues: 'string',
            projectID: 'string',
            attemptID: 'string',
            operationID: 'string',
            startTimestamp: 'number',
            endTimestamp: 'number',
            completed: 'boolean',
            canceled: 'boolean',
            additionalTime: 'number',
            hasStarted: 'boolean',
            seconds: 'number'
        };
        
        for (const field in allowedFields) {
            if (noteData.hasOwnProperty(field)) {
                const expectedType = allowedFields[field];
                const value = noteData[field];
                
                if (expectedType === 'string') {
                    sanitized[field] = this.sanitizeInput(value);
                } else if (expectedType === 'number') {
                    sanitized[field] = Number(value) || 0;
                } else if (expectedType === 'boolean') {
                    sanitized[field] = Boolean(value);
                } else {
                    sanitized[field] = value;
                }
            }
        }
        
        return sanitized;
    }

    /**
     * Create a text node safely
     * @param {string} text - The text content
     * @returns {Text} - A text node
     */
    static createTextNode(text) {
        return document.createTextNode(String(text || ''));
    }

    /**
     * Set element text content safely
     * @param {HTMLElement} element - The element to update
     * @param {string} text - The text content
     */
    static setTextContent(element, text) {
        if (element) {
            element.textContent = String(text || '');
        }
    }

    /**
     * Create element with safe text content
     * @param {string} tagName - The HTML tag name
     * @param {string} text - The text content
     * @param {string} className - Optional CSS classes
     * @returns {HTMLElement} - The created element
     */
    static createElement(tagName, text = '', className = '') {
        const element = document.createElement(tagName);
        if (text) {
            element.textContent = String(text);
        }
        if (className) {
            element.className = className;
        }
        return element;
    }

    /**
     * Safely append HTML structure using DOM methods
     * @param {HTMLElement} parent - The parent element
     * @param {Array} structure - Array of element definitions
     */
    static appendStructure(parent, structure) {
        if (!parent || !Array.isArray(structure)) return;
        
        structure.forEach(item => {
            if (typeof item === 'string') {
                parent.appendChild(this.createTextNode(item));
            } else if (item && typeof item === 'object') {
                const element = this.createElement(
                    item.tag || 'div',
                    item.text || '',
                    item.className || ''
                );
                
                if (item.attributes) {
                    Object.entries(item.attributes).forEach(([key, value]) => {
                        if (key !== 'innerHTML' && key !== 'innerText') {
                            element.setAttribute(key, String(value));
                        }
                    });
                }
                
                if (item.children) {
                    this.appendStructure(element, item.children);
                }
                
                parent.appendChild(element);
            }
        });
    }

    /**
     * Validate and sanitize a URL
     * @param {string} url - The URL to validate
     * @returns {string|null} - The sanitized URL or null if invalid
     */
    static sanitizeUrl(url) {
        if (!url) return null;
        
        try {
            const parsed = new URL(url);
            // Only allow http and https protocols
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return null;
            }
            return parsed.toString();
        } catch {
            return null;
        }
    }

    /**
     * Create a safe CSV field value
     * @param {string} field - The field value
     * @returns {string} - The escaped CSV field
     */
    static escapeCsvField(field) {
        if (!field) return '';
        const str = String(field).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? 
            `"${str}"` : str;
    }
}