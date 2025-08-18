/**
 * Help overlay component that displays all keyboard shortcuts
 */
import { ImportExportService } from '../../core/data/ImportExportService.js';
import { SecurityUtils } from '../../core/utils/SecurityUtils.js';

export default class HelpOverlay {
    constructor(themeManager = null) {
        this.themeManager = themeManager;
        this.overlay = document.getElementById('helpOverlay');
        this.content = document.getElementById('helpContent');
        this.closeButton = document.getElementById('closeHelpButton');
        this.fileInput = null; // Will be created dynamically
        
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
        
        // Add data management section
        const primaryButtonClasses = this.themeManager?.getPrimaryButtonClasses() || 'bg-blue-500 text-white hover:bg-blue-600';
        const secondaryButtonClasses = this.themeManager?.getSecondaryButtonClasses() || 'bg-gray-200 text-gray-700 hover:bg-gray-300';
        
        // Clear content and rebuild safely
        this.content.textContent = '';
        
        // Create shortcuts sections
        shortcuts.forEach(category => {
            const categoryDiv = SecurityUtils.createElement('div', '', `border-b ${borderClass} pb-3`);
            
            const titleH3 = SecurityUtils.createElement('h3', category.category, `text-lg font-semibold ${titleClass} mb-2`);
            categoryDiv.appendChild(titleH3);
            
            const shortcutsContainer = SecurityUtils.createElement('div', '', 'space-y-1');
            
            category.shortcuts.forEach(shortcut => {
                const shortcutDiv = SecurityUtils.createElement('div', '', 'flex justify-between items-center');
                
                const keySpan = SecurityUtils.createElement('span', shortcut.key, `${keyBgClass} px-2 py-1 rounded text-sm font-mono`);
                const descSpan = SecurityUtils.createElement('span', shortcut.description, `text-sm ${descClass} ml-4 flex-1`);
                
                shortcutDiv.appendChild(keySpan);
                shortcutDiv.appendChild(descSpan);
                shortcutsContainer.appendChild(shortcutDiv);
            });
            
            categoryDiv.appendChild(shortcutsContainer);
            this.content.appendChild(categoryDiv);
        });
        
        // Add data management section
        const dataManagementDiv = SecurityUtils.createElement('div', '', 'pt-3');
        const dataTitle = SecurityUtils.createElement('h3', 'Data Management', `text-lg font-semibold ${titleClass} mb-3`);
        dataManagementDiv.appendChild(dataTitle);
        
        const buttonContainer = SecurityUtils.createElement('div', '', 'flex gap-3 items-center');
        
        const exportBtn = SecurityUtils.createElement('button', 'Export All Data', `${primaryButtonClasses} px-4 py-2 rounded transition-colors`);
        exportBtn.id = 'exportDataBtn';
        
        const importBtn = SecurityUtils.createElement('button', 'Import Data', `${secondaryButtonClasses} px-4 py-2 rounded transition-colors`);
        importBtn.id = 'importDataBtn';
        
        const statusSpan = SecurityUtils.createElement('span', '', `text-sm ${descClass} ml-2`);
        statusSpan.id = 'importExportStatus';
        
        buttonContainer.appendChild(exportBtn);
        buttonContainer.appendChild(importBtn);
        buttonContainer.appendChild(statusSpan);
        
        dataManagementDiv.appendChild(buttonContainer);
        this.content.appendChild(dataManagementDiv);
        
        // Setup import/export buttons
        this.setupImportExportButtons();
    }
    
    setupImportExportButtons() {
        // Create hidden file input if it doesn't exist
        if (!this.fileInput) {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.accept = '.json';
            this.fileInput.style.display = 'none';
            document.body.appendChild(this.fileInput);
            
            this.fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await this.handleImport(file);
                }
                // Reset the input
                this.fileInput.value = '';
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }
        
        // Import button
        const importBtn = document.getElementById('importDataBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                if (confirm('This will replace all existing data. Are you sure you want to continue?')) {
                    this.fileInput.click();
                }
            });
        }
    }
    
    async handleExport() {
        const statusEl = document.getElementById('importExportStatus');
        try {
            const result = ImportExportService.exportData();
            if (statusEl) {
                statusEl.textContent = `✅ Exported ${result.keysExported} items to ${result.filename}`;
                statusEl.style.color = 'green';
                setTimeout(() => {
                    statusEl.textContent = '';
                }, 5000);
            }
        } catch (error) {
            if (statusEl) {
                statusEl.textContent = `❌ Export failed: ${error.message}`;
                statusEl.style.color = 'red';
            }
        }
    }
    
    async handleImport(file) {
        const statusEl = document.getElementById('importExportStatus');
        try {
            const result = await ImportExportService.importData(file);
            if (statusEl) {
                statusEl.textContent = `✅ Imported ${result.keysImported} items from ${result.filename}`;
                statusEl.style.color = 'green';
                setTimeout(() => {
                    // Reload the page to show imported data
                    window.location.reload();
                }, 2000);
            }
        } catch (error) {
            if (statusEl) {
                statusEl.textContent = `❌ Import failed: ${error.message}`;
                statusEl.style.color = 'red';
            }
        }
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