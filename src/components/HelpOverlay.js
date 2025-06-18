/**
 * Help overlay component that displays all keyboard shortcuts
 */
export default class HelpOverlay {
    constructor() {
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
                    { key: 'Ctrl+Enter', description: 'Complete/save the current note' },
                    { key: 'Ctrl+X', description: 'Copy formatted note content to clipboard' },
                    { key: 'F1', description: 'Copy note IDs in template format and show cancel dialog' }
                ]
            },
            {
                category: 'System Prompt View',
                shortcuts: [
                    { key: 'Ctrl+X', description: 'Generate and copy setup prompt (in Code Setup area)' },
                    { key: 'Ctrl+X', description: 'Generate evaluation prompt (in Response areas)' }
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

        this.content.innerHTML = shortcuts.map(category => `
            <div class="border-b border-gray-200 pb-3">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">${category.category}</h3>
                <div class="space-y-1">
                    ${category.shortcuts.map(shortcut => `
                        <div class="flex justify-between items-center">
                            <span class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">${shortcut.key}</span>
                            <span class="text-sm text-gray-600 ml-4 flex-1">${shortcut.description}</span>
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