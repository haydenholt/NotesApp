/**
 * SecureStorage - Centralized encrypted localStorage wrapper
 * Provides transparent encryption/decryption for all localStorage operations
 * Uses AES-GCM 256-bit encryption via Web Crypto API
 */
export class SecureStorage {
    static ENCRYPTION_KEY = '_secure_storage_key';
    static ENCRYPTION_SALT = '_secure_storage_salt';
    static STORAGE_PREFIX = '_encrypted_';
    static initialized = false;
    static cryptoKey = null;

    /**
     * Initialize the secure storage system
     * Must be called before any storage operations
     */
    static async initialize() {
        if (this.initialized) {
            return true;
        }

        try {
            // Check if we have an existing key
            const existingKey = localStorage.getItem(this.ENCRYPTION_KEY);
            const existingSalt = localStorage.getItem(this.ENCRYPTION_SALT);

            if (existingKey && existingSalt) {
                // Import existing key
                this.cryptoKey = await this.importKey(existingKey);
            } else {
                // Generate new key
                await this.generateNewKey();
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize SecureStorage:', error);
            throw new Error('SecureStorage initialization failed');
        }
    }

    /**
     * Generate and store a new encryption key
     */
    static async generateNewKey() {
        try {
            // Generate a random 256-bit key
            this.cryptoKey = await crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true, // extractable
                ['encrypt', 'decrypt']
            );

            // Export and store the key
            const exportedKey = await crypto.subtle.exportKey('jwk', this.cryptoKey);
            
            // Generate and store salt
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const saltBase64 = btoa(String.fromCharCode(...salt));

            // Store key and salt (these are the only unencrypted items)
            localStorage.setItem(this.ENCRYPTION_KEY, JSON.stringify(exportedKey));
            localStorage.setItem(this.ENCRYPTION_SALT, saltBase64);

            return true;
        } catch (error) {
            console.error('Failed to generate encryption key:', error);
            throw error;
        }
    }

    /**
     * Import a key from storage
     */
    static async importKey(keyData) {
        try {
            const jwkKey = JSON.parse(keyData);
            return await crypto.subtle.importKey(
                'jwk',
                jwkKey,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                false,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Failed to import key:', error);
            throw error;
        }
    }

    /**
     * Encrypt a string value
     */
    static async encrypt(plaintext) {
        if (!this.initialized) {
            await this.initialize();
        }

        if (plaintext === null || plaintext === undefined) {
            return null;
        }

        try {
            // Convert string to bytes
            const encoder = new TextEncoder();
            const data = encoder.encode(String(plaintext));

            // Generate a random IV for this encryption
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // Encrypt the data
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.cryptoKey,
                data
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedData), iv.length);

            // Convert to base64 for storage
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt a string value
     */
    static async decrypt(ciphertext) {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!ciphertext) {
            return null;
        }

        try {
            // Convert from base64
            const combined = new Uint8Array(
                atob(ciphertext).split('').map(c => c.charCodeAt(0))
            );

            // Extract IV (first 12 bytes) and encrypted data
            const iv = combined.slice(0, 12);
            const encryptedData = combined.slice(12);

            // Decrypt the data
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.cryptoKey,
                encryptedData
            );

            // Convert back to string
            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Store an encrypted item in localStorage
     */
    static async setItem(key, value) {
        if (!this.initialized) {
            await this.initialize();
        }

        // Don't encrypt our own keys
        if (key === this.ENCRYPTION_KEY || key === this.ENCRYPTION_SALT) {
            localStorage.setItem(key, value);
            return;
        }

        try {
            // Convert value to string if needed
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            
            // Encrypt the value
            const encryptedValue = await this.encrypt(stringValue);
            
            // Store with encrypted prefix
            localStorage.setItem(this.STORAGE_PREFIX + key, encryptedValue);
        } catch (error) {
            console.error('Failed to store encrypted item:', error);
            throw error;
        }
    }

    /**
     * Retrieve and decrypt an item from localStorage
     */
    static async getItem(key) {
        if (!this.initialized) {
            await this.initialize();
        }

        // Don't decrypt our own keys
        if (key === this.ENCRYPTION_KEY || key === this.ENCRYPTION_SALT) {
            return localStorage.getItem(key);
        }

        try {
            // Get encrypted value
            const encryptedValue = localStorage.getItem(this.STORAGE_PREFIX + key);
            
            if (encryptedValue === null) {
                return null;
            }

            // Decrypt the value
            const decryptedValue = await this.decrypt(encryptedValue);
            
            return decryptedValue;
        } catch (error) {
            console.error('Failed to retrieve encrypted item:', error);
            return null;
        }
    }

    /**
     * Remove an item from localStorage
     */
    static removeItem(key) {
        // Don't remove our own keys
        if (key === this.ENCRYPTION_KEY || key === this.ENCRYPTION_SALT) {
            return;
        }

        localStorage.removeItem(this.STORAGE_PREFIX + key);
    }

    /**
     * Clear all encrypted items (but keep encryption keys)
     */
    static clear() {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Get all keys (without the encrypted prefix)
     */
    static getAllKeys() {
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.STORAGE_PREFIX)) {
                keys.push(key.substring(this.STORAGE_PREFIX.length));
            }
        }

        return keys;
    }

    /**
     * Check if a key exists
     */
    static async hasItem(key) {
        return localStorage.getItem(this.STORAGE_PREFIX + key) !== null;
    }

    /**
     * Get the number of stored items
     */
    static get length() {
        return this.getAllKeys().length;
    }

    /**
     * Get a key by index (for iteration)
     */
    static key(index) {
        const keys = this.getAllKeys();
        return keys[index] || null;
    }

    /**
     * Export all data (decrypted) for backup
     */
    static async exportAll() {
        if (!this.initialized) {
            await this.initialize();
        }

        const data = {};
        const keys = this.getAllKeys();

        for (const key of keys) {
            const value = await this.getItem(key);
            try {
                // Try to parse as JSON if possible
                data[key] = JSON.parse(value);
            } catch {
                // Store as string if not JSON
                data[key] = value;
            }
        }

        return data;
    }

    /**
     * Import data (will be encrypted)
     */
    static async importAll(data) {
        if (!this.initialized) {
            await this.initialize();
        }

        for (const [key, value] of Object.entries(data)) {
            await this.setItem(key, value);
        }
    }

    /**
     * Reset encryption system (generates new key, clears all data)
     */
    static async reset() {
        // Clear all encrypted data
        this.clear();
        
        // Remove old keys
        localStorage.removeItem(this.ENCRYPTION_KEY);
        localStorage.removeItem(this.ENCRYPTION_SALT);
        
        // Reset state
        this.initialized = false;
        this.cryptoKey = null;
        
        // Reinitialize with new key
        return await this.initialize();
    }

    /**
     * Check if encryption is supported in this browser
     */
    static isSupported() {
        return 'crypto' in window && 'subtle' in crypto;
    }

    /**
     * Get encryption status information
     */
    static getStatus() {
        return {
            initialized: this.initialized,
            hasKey: localStorage.getItem(this.ENCRYPTION_KEY) !== null,
            isSupported: this.isSupported(),
            itemCount: this.length
        };
    }
}