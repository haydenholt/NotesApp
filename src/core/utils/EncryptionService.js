/**
 * Client-side encryption service for transparent data protection
 * Uses Web Crypto API with auto-generated keys - no user passwords required
 */
export class EncryptionService {
    static ENCRYPTION_KEY = 'app_encryption_key';
    static ENCRYPTION_VERSION = 'app_encryption_version';
    static CURRENT_VERSION = 1;

    /**
     * Initialize encryption service and ensure key exists
     */
    static async initialize() {
        try {
            if (!this.hasEncryptionKey()) {
                await this.generateAndStoreKey();
            }
            return true;
        } catch (error) {
            console.error('Failed to initialize encryption service:', error);
            return false;
        }
    }

    /**
     * Check if encryption key exists in localStorage
     */
    static hasEncryptionKey() {
        return localStorage.getItem(this.ENCRYPTION_KEY) !== null;
    }

    /**
     * Generate and store a new encryption key
     */
    static async generateAndStoreKey() {
        try {
            // Generate a 256-bit AES key
            const key = await crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true, // extractable
                ['encrypt', 'decrypt']
            );

            // Export key to store it
            const keyData = await crypto.subtle.exportKey('jwk', key);
            
            // Store the key and version
            localStorage.setItem(this.ENCRYPTION_KEY, JSON.stringify(keyData));
            localStorage.setItem(this.ENCRYPTION_VERSION, this.CURRENT_VERSION.toString());
            
            return true;
        } catch (error) {
            console.error('Failed to generate encryption key:', error);
            return false;
        }
    }

    /**
     * Get the encryption key from localStorage
     */
    static async getEncryptionKey() {
        try {
            const keyData = localStorage.getItem(this.ENCRYPTION_KEY);
            if (!keyData) {
                throw new Error('No encryption key found');
            }

            const jwkKey = JSON.parse(keyData);
            return await crypto.subtle.importKey(
                'jwk',
                jwkKey,
                'AES-GCM',
                false,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Failed to get encryption key:', error);
            throw error;
        }
    }

    /**
     * Encrypt a string value
     */
    static async encrypt(plaintext) {
        if (!plaintext || typeof plaintext !== 'string') {
            return plaintext; // Return as-is for empty/non-string values
        }

        try {
            const key = await this.getEncryptionKey();
            const encoder = new TextEncoder();
            const data = encoder.encode(plaintext);

            // Generate a random 12-byte IV for GCM
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // Encrypt the data
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                data
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            // Convert to base64 for storage
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption failed:', error);
            return plaintext; // Fallback to plaintext if encryption fails
        }
    }

    /**
     * Decrypt a string value
     */
    static async decrypt(ciphertext) {
        if (!ciphertext || typeof ciphertext !== 'string') {
            return ciphertext; // Return as-is for empty/non-string values
        }

        try {
            const key = await this.getEncryptionKey();
            
            // Convert from base64
            const combined = new Uint8Array(
                atob(ciphertext).split('').map(c => c.charCodeAt(0))
            );

            // Extract IV (first 12 bytes) and encrypted data
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            // Decrypt the data
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encrypted
            );

            // Convert back to string
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            return ciphertext; // Fallback to returning the ciphertext
        }
    }

    /**
     * Encrypt an object's sensitive fields
     */
    static async encryptObject(obj, fieldsToEncrypt = []) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const encrypted = { ...obj };
        
        for (const field of fieldsToEncrypt) {
            if (encrypted[field]) {
                encrypted[field] = await this.encrypt(encrypted[field]);
            }
        }

        return encrypted;
    }

    /**
     * Decrypt an object's encrypted fields
     */
    static async decryptObject(obj, fieldsToDecrypt = []) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const decrypted = { ...obj };
        
        for (const field of fieldsToDecrypt) {
            if (decrypted[field]) {
                decrypted[field] = await this.decrypt(decrypted[field]);
            }
        }

        return decrypted;
    }

    /**
     * Check if data appears to be encrypted (base64 format check)
     */
    static isEncrypted(data) {
        if (!data || typeof data !== 'string') {
            return false;
        }

        // Basic check for base64 format (simplified)
        try {
            return btoa(atob(data)) === data && data.length > 16; // Minimum length for encrypted data
        } catch {
            return false;
        }
    }

    /**
     * Get encryption status and statistics
     */
    static getEncryptionInfo() {
        return {
            hasKey: this.hasEncryptionKey(),
            version: localStorage.getItem(this.ENCRYPTION_VERSION) || 'none',
            currentVersion: this.CURRENT_VERSION,
            isSupported: 'crypto' in window && 'subtle' in crypto
        };
    }

    /**
     * Reset encryption (generate new key) - will require data re-encryption
     */
    static async resetEncryption() {
        try {
            localStorage.removeItem(this.ENCRYPTION_KEY);
            localStorage.removeItem(this.ENCRYPTION_VERSION);
            return await this.generateAndStoreKey();
        } catch (error) {
            console.error('Failed to reset encryption:', error);
            return false;
        }
    }
}