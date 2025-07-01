/**
 * Help overlay component that displays all keyboard shortcuts
 */
export default class HelpOverlay {
    constructor(themeManager = null) {
        this.themeManager = themeManager;
        this.overlay = document.getElementById('helpOverlay');
        this.content = document.getElementById('helpContent');
        this.closeButton = document.getElementById('closeHelpButton');
        
        // Only initialize if all required elements exist
        if (this.overlay && this.content && this.closeButton) {
            this.init();
        }
    }

    init() {
        this.setupEventListeners();
        this.renderContent();
    }

    setupEventListeners() {
        // Close on X button click
        this.closeButton.addEventListener('click', () => this.hide());
        
        // Close on overlay click (outside modal)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Handle help button clicks (use event delegation for dynamically created buttons)
        document.addEventListener('click', (e) => {
            if (e.target.matches('#helpButton') || e.target.matches('.helpButton')) {
                e.preventDefault();
                this.show();
            }
        });

        // Global keyboard listeners
        document.addEventListener('keydown', (e) => {
            // Show help with ? key
            if (e.key === '?' && !this.isInputField(e.target)) {
                e.preventDefault();
                this.show();
            }
            
            // Hide help with Escape
            if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
                this.hide();
            }
        });
    }

    isInNoteContext(element) {
        // Check if the focused element is within a note (where F1 has different behavior)
        return element.closest('.note') !== null || 
               element.id.includes('projectId') || 
               element.id.includes('operationId') || 
               element.id.includes('attemptId');
    }

    isInputField(element) {
        // Check if element is an input field where ? should type normally
        const inputTypes = ['input', 'textarea', 'select'];
        return inputTypes.includes(element.tagName.toLowerCase()) || 
               element.contentEditable === 'true';
    }

    renderContent() {
        const shortcuts = [
            {
                category: 'View Switching (Global)',
                shortcuts: [
                    { key: 'Ctrl+D', description: 'Toggle Diff Tool view' },
                    { key: 'Ctrl+P', description: 'Toggle System Prompt Generator view' },
                    { key: 'Ctrl+Y', description: 'Toggle Pay Analysis view' }
                ]
            },
            {
                category: 'Note Management',
                shortcuts: [
                    { key: 'Ctrl+Enter', description: 'Complete the current note' },
                    { key: 'Ctrl+X', description: 'Copy formatted feedback to clipboard' },
                    { key: 'Ctrl+Shift+V', description: 'Paste clipboard as formatted bullet point' },
                    { key: 'F1', description: 'Copy cancel message to clipboard and show cancel dialog' }
                ]
            },
            {
                category: 'System Prompt View',
                shortcuts: [
                    { key: 'Ctrl+X', description: 'Copy prompt to clipboard' },
                ]
            },
            {
                category: 'Help & Navigation',
                shortcuts: [
                    { key: '?', description: 'Show this help' },
                    { key: 'Escape', description: 'Close this help overlay' }
                ]
            }
        ];

        const borderClass = this.themeManager?.getColor('border', 'primary') || 'border-gray-200';
        const titleClass = this.themeManager?.getColor('text', 'secondary') || 'text-gray-700';
        const keyBgClass = this.themeManager?.getColor('background', 'secondary') || 'bg-gray-100';
        const descClass = this.themeManager?.getColor('text', 'secondary') || 'text-gray-600';
        
        this.content.innerHTML = shortcuts.map(category => `
            <div class="border-b ${borderClass} pb-3">
                <h3 class="text-lg font-semibold ${titleClass} mb-2">${category.category}</h3>
                <div class="space-y-1">
                    ${category.shortcuts.map(shortcut => `
                        <div class="flex justify-between items-center">
                            <span class="${keyBgClass} px-2 py-1 rounded text-sm font-mono">${shortcut.key}</span>
                            <span class="text-sm ${descClass} ml-4 flex-1">${shortcut.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    show() {
        this.overlay.classList.remove('hidden');
        // Focus the overlay for accessibility
        this.overlay.focus();
    }

    hide() {
        this.overlay.classList.add('hidden');
    }
}