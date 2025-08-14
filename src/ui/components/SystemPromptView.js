import { CustomTemplateManager } from '../../core/data/CustomTemplateManager.js';

export class SystemPromptView {
    constructor(containerId, themeManager = null) {
        this.container = document.getElementById(containerId);
        this.themeManager = themeManager;
        this.templateManager = new CustomTemplateManager();
        this.currentTemplateId = null;
        this.isEditorOpen = false;
        this.editingTemplateId = null;
        
        if (!this.container) {
            console.error("System Prompt View container not found!");
            return;
        }
        this.render();
        this.initializeSystemPromptHandlers();
    }

    render() {
        const focusClasses = this.themeManager ? this.themeManager.getFocusClasses().combined : 'focus:outline-none';
        const primaryButtonClasses = this.themeManager ? this.themeManager.getPrimaryButtonClasses() : 'bg-blue-600 hover:bg-blue-700';
        const secondaryButtonClasses = this.themeManager ? this.themeManager.getSecondaryButtonClasses() : 'bg-gray-500 hover:bg-gray-600';
        const cardClasses = this.themeManager ? this.themeManager.getCardClasses() : 'bg-white border border-gray-200';
        const inputClasses = this.themeManager ? this.themeManager.getInputClasses() : 'border border-gray-300 rounded-md';
        const textareaClasses = this.themeManager ? this.themeManager.getTextareaClasses() : 'border border-gray-300 rounded-md';
        
        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                ${this.renderTemplateManagementSection(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses)}
                ${this.renderCurrentTemplateSection(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses)}
                ${this.renderTemplateEditor(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses)}
            </div>
            ${this.renderToastNotification()}
        `;
    }

    renderTemplateManagementSection(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses) {
        const templates = this.templateManager.getAllTemplates();
        const customTemplates = templates.filter(t => !t.isBuiltIn);
        
        return `
            <div class="${cardClasses} shadow-sm rounded-md p-6 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-medium text-gray-700">System Prompt Templates</h2>
                    <div class="flex gap-2">
                        <button id="createTemplateBtn" class="${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Create New Template
                        </button>
                        <button id="importTemplatesBtn" class="${secondaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Import
                        </button>
                        <button id="exportTemplatesBtn" class="${secondaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm" ${customTemplates.length === 0 ? 'disabled' : ''}>
                            Export
                        </button>
                    </div>
                </div>
                
                <div class="mb-4">
                    <label for="templateSelector" class="block text-sm font-medium text-gray-700 mb-2">Select Template:</label>
                    <select id="templateSelector" class="${inputClasses} w-full p-2 text-sm">
                        <option value="">Choose a template...</option>
                        <optgroup label="Built-in Templates">
                            ${templates.filter(t => t.isBuiltIn).map(t => 
                                `<option value="${t.id}">${t.name}</option>`
                            ).join('')}
                        </optgroup>
                        ${customTemplates.length > 0 ? `
                        <optgroup label="Custom Templates">
                            ${customTemplates.map(t => 
                                `<option value="${t.id}">${t.name}</option>`
                            ).join('')}
                        </optgroup>
                        ` : ''}
                    </select>
                </div>
                
                ${customTemplates.length > 0 ? `
                <div class="">
                    <h3 class="text-sm font-medium text-gray-700 mb-2">Custom Templates:</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        ${customTemplates.map(t => `
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">${t.name}</p>
                                    <p class="text-xs text-gray-500 truncate">${t.description || 'No description'}</p>
                                </div>
                                <div class="flex gap-1 ml-2">
                                    <button class="editTemplateBtn text-blue-600 hover:text-blue-800 text-xs p-1" data-template-id="${t.id}" title="Edit">
                                        ✏️
                                    </button>
                                    <button class="deleteTemplateBtn text-red-600 hover:text-red-800 text-xs p-1" data-template-id="${t.id}" title="Delete">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderCurrentTemplateSection(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) {
        if (!this.currentTemplateId) {
            return '';
        }
        
        const template = this.templateManager.getTemplateById(this.currentTemplateId);
        if (!template) {
            return '';
        }
        
        return `
            <div class="${cardClasses} shadow-sm rounded-md p-6 mb-6" id="currentTemplateSection">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-medium text-gray-700">${template.name}</h2>
                    <button id="clearTemplateBtn" class="${secondaryButtonClasses} text-white font-medium py-1 px-2 rounded-md transition-colors text-xs">
                        Clear Selection
                    </button>
                </div>
                
                ${template.description ? `
                <p class="text-sm text-gray-600 mb-4">${template.description}</p>
                ` : ''}
                
                <div class="space-y-4 mb-6" id="templateInputs">
                    ${template.placeholders.map(placeholder => {
                        const isTextarea = placeholder.type === 'textarea';
                        const fieldClass = isTextarea ? textareaClasses : inputClasses;
                        const heightClass = isTextarea ? 'h-32' : 'h-10';
                        const element = isTextarea ? 'textarea' : 'input';
                        const typeAttr = isTextarea ? '' : 'type="text"';
                        
                        return `
                            <div>
                                <label for="placeholder_${placeholder.name}" class="block text-sm font-medium text-gray-700 mb-2">
                                    ${placeholder.description || placeholder.name} ${placeholder.required ? '<span class="text-red-500">*</span>' : ''}
                                </label>
                                <${element} id="placeholder_${placeholder.name}" 
                                    ${typeAttr}
                                    class="w-full ${heightClass} p-3 ${fieldClass} ${focusClasses} text-sm" 
                                    placeholder="${placeholder.description || placeholder.name}..."
                                    data-placeholder-name="${placeholder.name}"
                                    ${placeholder.required ? 'required' : ''}>
                                ${isTextarea ? `</textarea>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="flex gap-3 justify-between">
                    <button id="copyTemplatePromptBtn" class="${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                        Copy Generated Prompt
                    </button>
                    <button id="clearTemplateInputsBtn" class="${secondaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                        Clear Inputs
                    </button>
                </div>
            </div>
        `;
    }

    renderTemplateEditor(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) {
        if (!this.isEditorOpen) {
            return '';
        }
        
        const template = this.editingTemplateId ? this.templateManager.getTemplateById(this.editingTemplateId) : null;
        const isEditing = !!template;
        
        return `
            <div class="${cardClasses} shadow-lg rounded-md p-6 mb-6 border-2 border-blue-200" id="templateEditor">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-medium text-gray-700">${isEditing ? 'Edit Template' : 'Create New Template'}</h2>
                    <button id="closeEditorBtn" class="${secondaryButtonClasses} text-white font-medium py-1 px-2 rounded-md transition-colors text-xs">
                        ✕ Close
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label for="templateName" class="block text-sm font-medium text-gray-700 mb-2">Template Name <span class="text-red-500">*</span></label>
                        <input type="text" id="templateName" class="w-full h-10 p-3 ${inputClasses} ${focusClasses} text-sm" 
                            placeholder="Enter template name..." value="${isEditing ? template.name : ''}" required>
                    </div>
                    
                    <div>
                        <label for="templateDescription" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea id="templateDescription" class="w-full h-20 p-3 ${textareaClasses} ${focusClasses} text-sm" 
                            placeholder="Enter template description...">${isEditing ? template.description : ''}</textarea>
                    </div>
                    
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-sm font-medium text-gray-700">Placeholders</label>
                            <button id="addPlaceholderBtn" class="${secondaryButtonClasses} text-white font-medium py-1 px-2 rounded-md transition-colors text-xs">
                                + Add Placeholder
                            </button>
                        </div>
                        <div id="placeholderList" class="space-y-2">
                            ${isEditing ? template.placeholders.map((p, index) => this.renderPlaceholderEditor(p, index, inputClasses, secondaryButtonClasses, focusClasses)).join('') : ''}
                        </div>
                    </div>
                    
                    <div>
                        <label for="templateContent" class="block text-sm font-medium text-gray-700 mb-2">Template Content <span class="text-red-500">*</span></label>
                        <textarea id="templateContent" class="w-full h-48 p-3 ${textareaClasses} ${focusClasses} text-sm font-mono" 
                            placeholder="Enter your template content using {{PLACEHOLDER_NAME}} syntax..." required>${isEditing ? template.template : ''}</textarea>
                        <p class="text-xs text-gray-500 mt-1">Use {{PLACEHOLDER_NAME}} to insert placeholders. Make sure placeholder names match exactly.</p>
                    </div>
                    
                    <div class="flex gap-3 justify-end">
                        <button id="saveTemplateBtn" class="${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            ${isEditing ? 'Update Template' : 'Save Template'}
                        </button>
                        <button id="cancelEditorBtn" class="${secondaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPlaceholderEditor(placeholder, index, inputClasses, secondaryButtonClasses, focusClasses) {
        return `
            <div class="flex gap-2 items-end p-3 bg-gray-50 rounded border" data-placeholder-index="${index}">
                <div class="flex-1">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" class="placeholderName w-full h-8 p-2 ${inputClasses} ${focusClasses} text-xs" 
                        value="${placeholder ? placeholder.name : ''}" placeholder="PLACEHOLDER_NAME">
                </div>
                <div class="flex-2">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" class="placeholderDescription w-full h-8 p-2 ${inputClasses} ${focusClasses} text-xs" 
                        value="${placeholder ? placeholder.description : ''}" placeholder="Description for users">
                </div>
                <div class="">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select class="placeholderType h-8 p-1 ${inputClasses} text-xs">
                        <option value="input" ${placeholder && placeholder.type === 'input' ? 'selected' : ''}>Input</option>
                        <option value="textarea" ${placeholder && placeholder.type === 'textarea' ? 'selected' : ''}>Textarea</option>
                    </select>
                </div>
                <div class="flex items-center">
                    <label class="flex items-center text-xs text-gray-700">
                        <input type="checkbox" class="placeholderRequired mr-1" ${placeholder && placeholder.required ? 'checked' : ''}>
                        Required
                    </label>
                </div>
                <button class="removePlaceholderBtn ${secondaryButtonClasses} text-white h-8 px-2 rounded text-xs">
                    ✕
                </button>
            </div>
        `;
    }
    
    renderToastNotification() {
        return `
            <div id="toast-notification" class="fixed bottom-4 right-4 p-4 rounded-md shadow-lg text-white text-sm transition-opacity duration-300 ease-in-out opacity-0 z-50">
                <span id="toast-message"></span>
            </div>
        `;
    }

    showToast(message, type = 'success') {
        const toastElement = document.getElementById('toast-notification');
        const toastMessageElement = document.getElementById('toast-message');

        if (!toastElement || !toastMessageElement) {
            console.error('Toast elements not found!');
            return;
        }

        toastMessageElement.textContent = message;
        const primaryBg = this.themeManager ? this.themeManager.getNestedColor('button', 'primary', 'bg') : 'bg-gray-600';
        toastElement.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500', primaryBg);

        if (type === 'success') {
            toastElement.classList.add('bg-green-500');
        } else if (type === 'error') {
            toastElement.classList.add('bg-red-500');
        } else if (type === 'warning') {
            toastElement.classList.add('bg-yellow-500');
        } else if (type === 'info') {
            toastElement.classList.add(primaryBg);
        } else {
            toastElement.classList.add('bg-gray-700');
        }

        toastElement.classList.remove('opacity-0');
        toastElement.classList.add('opacity-100');

        setTimeout(() => {
            toastElement.classList.remove('opacity-100');
            toastElement.classList.add('opacity-0');
        }, 3000);
    }

    initializeSystemPromptHandlers() {
        this.initializeTemplateManagement();
        this.initializeTemplateEditor();
        this.initializeTemplateUsage();
    }
    
    initializeTemplateManagement() {
        const templateSelector = document.getElementById('templateSelector');
        const createTemplateBtn = document.getElementById('createTemplateBtn');
        const importTemplatesBtn = document.getElementById('importTemplatesBtn');
        const exportTemplatesBtn = document.getElementById('exportTemplatesBtn');
        
        if (templateSelector) {
            templateSelector.addEventListener('change', (e) => {
                this.selectTemplate(e.target.value);
            });
        }
        
        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', () => {
                this.openTemplateEditor();
            });
        }
        
        if (importTemplatesBtn) {
            importTemplatesBtn.addEventListener('click', () => {
                this.openImportDialog();
            });
        }
        
        if (exportTemplatesBtn) {
            exportTemplatesBtn.addEventListener('click', () => {
                this.exportTemplates();
            });
        }
        
        document.querySelectorAll('.editTemplateBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.getAttribute('data-template-id');
                this.openTemplateEditor(templateId);
            });
        });
        
        document.querySelectorAll('.deleteTemplateBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.getAttribute('data-template-id');
                this.deleteTemplate(templateId);
            });
        });
    }
    
    initializeTemplateEditor() {
        const closeEditorBtn = document.getElementById('closeEditorBtn');
        const cancelEditorBtn = document.getElementById('cancelEditorBtn');
        const saveTemplateBtn = document.getElementById('saveTemplateBtn');
        const addPlaceholderBtn = document.getElementById('addPlaceholderBtn');
        
        if (closeEditorBtn) {
            closeEditorBtn.addEventListener('click', () => {
                this.closeTemplateEditor();
            });
        }
        
        if (cancelEditorBtn) {
            cancelEditorBtn.addEventListener('click', () => {
                this.closeTemplateEditor();
            });
        }
        
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', () => {
                this.saveTemplate();
            });
        }
        
        if (addPlaceholderBtn) {
            addPlaceholderBtn.addEventListener('click', () => {
                this.addPlaceholder();
            });
        }
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('removePlaceholderBtn')) {
                e.target.closest('[data-placeholder-index]').remove();
            }
        });
    }
    
    initializeTemplateUsage() {
        const copyTemplatePromptBtn = document.getElementById('copyTemplatePromptBtn');
        const clearTemplateInputsBtn = document.getElementById('clearTemplateInputsBtn');
        const clearTemplateBtn = document.getElementById('clearTemplateBtn');
        
        if (copyTemplatePromptBtn) {
            copyTemplatePromptBtn.addEventListener('click', () => {
                this.copyGeneratedPrompt();
            });
        }
        
        if (clearTemplateInputsBtn) {
            clearTemplateInputsBtn.addEventListener('click', () => {
                this.clearTemplateInputs();
            });
        }
        
        if (clearTemplateBtn) {
            clearTemplateBtn.addEventListener('click', () => {
                this.clearTemplateSelection();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'x') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.hasAttribute('data-placeholder-name')) {
                    e.preventDefault();
                    this.copyGeneratedPrompt();
                }
            }
            if (e.ctrlKey && e.key === 't' && !this.isEditorOpen) {
                e.preventDefault();
                this.openTemplateEditor();
            }
        });
    }
    
    selectTemplate(templateId) {
        if (!templateId) {
            this.currentTemplateId = null;
            this.render();
            return;
        }
        
        this.currentTemplateId = templateId;
        this.render();
        this.initializeSystemPromptHandlers();
    }
    
    clearTemplateSelection() {
        this.currentTemplateId = null;
        this.render();
        this.initializeSystemPromptHandlers();
        this.showToast('Template selection cleared.', 'info');
    }
    
    openTemplateEditor(templateId = null) {
        this.isEditorOpen = true;
        this.editingTemplateId = templateId;
        this.render();
        this.initializeSystemPromptHandlers();
        
        if (!templateId) {
            this.addPlaceholder();
        }
        
        document.getElementById('templateEditor')?.scrollIntoView({ behavior: 'smooth' });
    }
    
    closeTemplateEditor() {
        this.isEditorOpen = false;
        this.editingTemplateId = null;
        this.render();
        this.initializeSystemPromptHandlers();
    }
    
    addPlaceholder() {
        const placeholderList = document.getElementById('placeholderList');
        if (!placeholderList) return;
        
        const index = placeholderList.children.length;
        const focusClasses = this.themeManager ? this.themeManager.getFocusClasses().combined : 'focus:outline-none';
        const inputClasses = this.themeManager ? this.themeManager.getInputClasses() : 'border border-gray-300 rounded-md';
        const secondaryButtonClasses = this.themeManager ? this.themeManager.getSecondaryButtonClasses() : 'bg-gray-500 hover:bg-gray-600';
        
        const placeholderHtml = this.renderPlaceholderEditor(null, index, inputClasses, secondaryButtonClasses, focusClasses);
        placeholderList.insertAdjacentHTML('beforeend', placeholderHtml);
    }
    
    saveTemplate() {
        try {
            const templateName = document.getElementById('templateName').value.trim();
            const templateDescription = document.getElementById('templateDescription').value.trim();
            const templateContent = document.getElementById('templateContent').value.trim();
            
            if (!templateName || !templateContent) {
                this.showToast('Template name and content are required.', 'error');
                return;
            }
            
            const placeholders = [];
            const placeholderElements = document.querySelectorAll('#placeholderList > div');
            
            for (const element of placeholderElements) {
                const name = element.querySelector('.placeholderName').value.trim();
                const description = element.querySelector('.placeholderDescription').value.trim();
                const type = element.querySelector('.placeholderType').value;
                const required = element.querySelector('.placeholderRequired').checked;
                
                if (name) {
                    placeholders.push({ name, description, type, required });
                }
            }
            
            const templateData = {
                name: templateName,
                description: templateDescription,
                template: templateContent,
                placeholders: placeholders
            };
            
            const errors = this.templateManager.validateTemplate(templateData);
            if (errors.length > 0) {
                this.showToast(`Template validation failed: ${errors.join(', ')}`, 'error');
                return;
            }
            
            if (this.editingTemplateId) {
                this.templateManager.updateTemplate(this.editingTemplateId, templateData);
                this.showToast('Template updated successfully!', 'success');
            } else {
                this.templateManager.createTemplate(templateData);
                this.showToast('Template created successfully!', 'success');
            }
            
            this.closeTemplateEditor();
        } catch (error) {
            this.showToast(`Error saving template: ${error.message}`, 'error');
        }
    }
    
    deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            return;
        }
        
        try {
            this.templateManager.deleteTemplate(templateId);
            this.showToast('Template deleted successfully.', 'success');
            
            if (this.currentTemplateId === templateId) {
                this.currentTemplateId = null;
            }
            
            this.render();
            this.initializeSystemPromptHandlers();
        } catch (error) {
            this.showToast(`Error deleting template: ${error.message}`, 'error');
        }
    }
    
    copyGeneratedPrompt() {
        if (!this.currentTemplateId) {
            this.showToast('No template selected.', 'error');
            return;
        }
        
        try {
            const placeholderValues = {};
            const inputs = document.querySelectorAll('#templateInputs [data-placeholder-name]');
            
            for (const input of inputs) {
                const placeholderName = input.getAttribute('data-placeholder-name');
                placeholderValues[placeholderName] = input.value;
            }
            
            const generatedPrompt = this.templateManager.generatePromptFromTemplate(
                this.currentTemplateId, 
                placeholderValues
            );
            
            navigator.clipboard.writeText(generatedPrompt)
                .then(() => {
                    this.showToast('Generated prompt copied to clipboard!', 'success');
                })
                .catch(err => {
                    this.fallbackCopyTextToClipboard(generatedPrompt, 'Copy Generated Prompt', true);
                });
        } catch (error) {
            this.showToast(`Error generating prompt: ${error.message}`, 'error');
        }
    }
    
    clearTemplateInputs() {
        const inputs = document.querySelectorAll('#templateInputs [data-placeholder-name]');
        for (const input of inputs) {
            input.value = '';
        }
        this.showToast('Template inputs cleared.', 'info');
    }
    
    openImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const result = this.templateManager.importTemplates(e.target.result);
                        this.showToast(`Import successful! ${result.imported} templates imported${result.skipped > 0 ? `, ${result.skipped} skipped` : ''}.`, 'success');
                        this.render();
                        this.initializeSystemPromptHandlers();
                    } catch (error) {
                        this.showToast(`Import failed: ${error.message}`, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    exportTemplates() {
        try {
            const jsonData = this.templateManager.exportTemplates();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'system-prompt-templates.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showToast('Templates exported successfully!', 'success');
        } catch (error) {
            this.showToast(`Export failed: ${error.message}`, 'error');
        }
    }

    fallbackCopyTextToClipboard(text, originalButtonText = 'Copy Prompt', isError = false) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showToast(isError ? 'Fallback copy success, but an error occurred initially.' : 'Copied (Fallback)!', isError ? 'warning' : 'success');
            } else {
                this.showToast('Copy Failed (Fallback).', 'error');
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
            this.showToast('Copy Failed (Fallback).', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

export default SystemPromptView;