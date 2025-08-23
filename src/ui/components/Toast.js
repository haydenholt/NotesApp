export class Toast {
    constructor(themeManager = null) {
        this.themeManager = themeManager;
        this.toastElement = null;
        this.messageElement = null;
        this.timeoutId = null;
        this.createToastElement();
    }

    createToastElement() {
        // Create toast container
        this.toastElement = document.createElement('div');
        this.toastElement.id = 'toast-notification';
        this.toastElement.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white text-sm transition-all duration-300 ease-in-out opacity-0 transform translate-y-2 z-50';
        
        // Create message element
        this.messageElement = document.createElement('span');
        this.messageElement.id = 'toast-message';
        this.toastElement.appendChild(this.messageElement);
        
        // Add to body
        document.body.appendChild(this.toastElement);
    }

    show(message, type = 'success') {
        if (!this.toastElement || !this.messageElement) {
            console.error('Toast elements not found!');
            return;
        }

        // Clear any existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.messageElement.textContent = message;
        
        // Remove all existing color classes
        this.toastElement.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-gray-700');

        // Apply appropriate color based on type
        if (type === 'success') {
            this.toastElement.classList.add('bg-green-500');
        } else if (type === 'error') {
            this.toastElement.classList.add('bg-red-500');
        } else if (type === 'warning') {
            this.toastElement.classList.add('bg-yellow-500');
        } else if (type === 'info') {
            this.toastElement.classList.add('bg-blue-500');
        } else {
            this.toastElement.classList.add('bg-gray-700');
        }

        // Show toast with animation
        this.toastElement.classList.remove('opacity-0', 'translate-y-2');
        this.toastElement.classList.add('opacity-100', 'translate-y-0');

        // Auto-hide after 3 seconds
        this.timeoutId = setTimeout(() => {
            this.hide();
        }, 3000);
    }

    hide() {
        if (this.toastElement) {
            this.toastElement.classList.remove('opacity-100', 'translate-y-0');
            this.toastElement.classList.add('opacity-0', 'translate-y-2');
        }
    }

    destroy() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.toastElement && this.toastElement.parentNode) {
            this.toastElement.parentNode.removeChild(this.toastElement);
        }
        this.toastElement = null;
        this.messageElement = null;
    }
}