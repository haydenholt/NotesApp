import { CustomTemplateManager } from '../../core/data/CustomTemplateManager.js';

export class SystemPromptView {
    constructor(containerId, themeManager = null) {
        this.container = document.getElementById(containerId);
        this.themeManager = themeManager;
        this.templateManager = new CustomTemplateManager();
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
                ${this.renderTemplateManagementSection(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses)}
                ${this.renderTemplateEditor(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses)}
            </div>
            ${this.renderToastNotification()}
        `;
    }

    renderTemplateManagementSection(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) {
        const templates = this.templateManager.getAllTemplates();
        const customTemplates = templates.filter(t => !t.isBuiltIn);
        const builtInTemplates = templates.filter(t => t.isBuiltIn);
        
        const allTemplates = [...builtInTemplates, ...customTemplates];
        
        return `
            <div class="max-w-4xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-medium text-gray-700">System Prompt Templates</h2>
                    <button id="createTemplateBtn" class="${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                        Create New Template
                    </button>
                </div>
                
                <div class="space-y-6">
                    ${allTemplates.map(template => this.renderTemplateCard(template, primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses)).join('')}
                </div>
            </div>
        `;
    }

    renderTemplateCard(template, primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) {
        const isEvaluationTemplate = template.isEvaluationTemplate;
        
        return `
            <div class="border border-gray-300 rounded-lg p-6 bg-gray-50 mb-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-lg font-medium text-gray-800">${template.name}</h3>
                        </div>
                        ${template.description ? `<p class="text-sm text-gray-600 mt-1">${template.description}</p>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button class="editTemplateBtn text-blue-600 hover:text-blue-800 text-sm p-1" data-template-id="${template.id}" title="Edit">
                            ✎
                        </button>
                        <button class="deleteTemplateBtn text-red-600 hover:text-red-800 text-sm p-1" data-template-id="${template.id}" title="Delete">
                            ×
                        </button>
                    </div>
                </div>

                ${isEvaluationTemplate ? this.renderEvaluationTemplateInputs(template, primaryButtonClasses, secondaryButtonClasses, inputClasses, textareaClasses, focusClasses) : this.renderStandardTemplateInputs(template, primaryButtonClasses, secondaryButtonClasses, inputClasses, textareaClasses, focusClasses)}
            </div>
        `;
    }

    renderEvaluationTemplateInputs(template, primaryButtonClasses, secondaryButtonClasses, inputClasses, textareaClasses, focusClasses) {
        return `
            <div class="space-y-4">
                <div class="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="rubricEvalToggle_${template.id}" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="rubricEvalToggle_${template.id}" class="text-sm text-gray-700 cursor-pointer">Use Rubric Evaluation (detailed breakdown)</label>
                </div>
                
                <div class="mb-4">
                    <label for="evalPromptInput_${template.id}" class="block text-sm font-medium text-gray-700 mb-2">Original Prompt to AI:</label>
                    <textarea id="evalPromptInput_${template.id}" class="w-full h-32 p-3 ${textareaClasses} ${focusClasses} text-sm" placeholder="Paste the original prompt..."></textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label for="evalResponse1Input_${template.id}" class="block text-sm font-medium text-gray-700 mb-2">AI's Response 1:</label>
                        <textarea id="evalResponse1Input_${template.id}" class="w-full h-32 p-3 ${textareaClasses} ${focusClasses} text-sm" data-template-id="${template.id}" placeholder="Paste AI's first response..."></textarea>
                    </div>
                    <div>
                        <label for="evalResponse2Input_${template.id}" class="block text-sm font-medium text-gray-700 mb-2">AI's Response 2:</label>
                        <textarea id="evalResponse2Input_${template.id}" class="w-full h-32 p-3 ${textareaClasses} ${focusClasses} text-sm" data-template-id="${template.id}" placeholder="Paste AI's second response..."></textarea>
                    </div>
                </div>
                
                <div class="flex gap-3 justify-between">
                    <button class="copyEvaluationPromptBtn ${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm" data-template-id="${template.id}">
                        Copy Evaluation Prompt
                    </button>
                    <button class="clearEvaluationInputsBtn ${secondaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm" data-template-id="${template.id}">
                        Clear
                    </button>
                </div>
            </div>
        `;
    }

    renderStandardTemplateInputs(template, primaryButtonClasses, secondaryButtonClasses, inputClasses, textareaClasses, focusClasses) {
        return `
            <div class="space-y-4">
                ${template.placeholders.map(placeholder => {
                    const isTextarea = placeholder.type === 'textarea';
                    const fieldClass = isTextarea ? textareaClasses : inputClasses;
                    const heightClass = isTextarea ? 'h-32' : 'h-10';
                    const element = isTextarea ? 'textarea' : 'input';
                    const typeAttr = isTextarea ? '' : 'type="text"';
                    
                    return `
                        <div>
                            <label for="placeholder_${template.id}_${placeholder.name}" class="block text-sm font-medium text-gray-700 mb-2">
                                ${placeholder.description || placeholder.name}
                            </label>
                            <${element} id="placeholder_${template.id}_${placeholder.name}" 
                                ${typeAttr}
                                class="w-full ${heightClass} p-3 ${fieldClass} ${focusClasses} text-sm" 
                                placeholder="${placeholder.description || placeholder.name}..."
                                data-template-id="${template.id}"
                                data-placeholder-name="${placeholder.name}">${isTextarea ? `</textarea>` : ''}
                        </div>
                    `;
                }).join('')}
                
                <div class="flex gap-3 justify-between">
                    <button class="copyTemplatePromptBtn ${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm" data-template-id="${template.id}">
                        Copy Generated Prompt
                    </button>
                    <button class="clearTemplateInputsBtn ${secondaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm" data-template-id="${template.id}">
                        Clear
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
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" id="templateEditorOverlay">
                <div class="${cardClasses} rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl" id="templateEditor">
                    <!-- Header -->
                    <div class="flex justify-between items-center p-6 border-b border-gray-200">
                        <h2 class="text-xl font-bold text-gray-800">${isEditing ? 'Edit Template' : 'Create New Template'}</h2>
                        <button id="closeEditorBtn" class="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div class="p-6 space-y-6">
                        <!-- Basic Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label for="templateName" class="block text-sm font-semibold text-gray-700 mb-2">
                                    Template Name <span class="text-red-500">*</span>
                                </label>
                                <input type="text" id="templateName" 
                                       class="w-full h-12 p-4 ${inputClasses} ${focusClasses} text-sm" 
                                       placeholder="Enter a descriptive name for your template..." 
                                       value="${isEditing ? template.name : ''}" required>
                            </div>
                            <div>
                                <label for="templateDescription" class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <input type="text" id="templateDescription" 
                                       class="w-full h-12 p-4 ${inputClasses} ${focusClasses} text-sm" 
                                       placeholder="Brief description of what this template does..."
                                       value="${isEditing ? template.description : ''}">
                            </div>
                        </div>
                        
                        <!-- Placeholders Section -->
                        <div class="border-t border-gray-200 pt-6">
                            <div class="mb-4">
                                <h3 class="text-sm font-semibold text-gray-700">Placeholders</h3>
                                <p class="text-xs text-gray-500 mt-1">Define input fields that users will fill in</p>
                            </div>
                            <div id="placeholderList" class="space-y-4 mb-4">
                                ${isEditing && template.placeholders ? template.placeholders.map((p, index) => this.renderPlaceholderEditor(p, index, inputClasses, secondaryButtonClasses, focusClasses)).join('') : ''}
                            </div>
                            <div class="flex justify-center">
                                <button id="addPlaceholderBtn" class="${secondaryButtonClasses} text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                                    + Add Placeholder
                                </button>
                            </div>
                        </div>
                        
                        <!-- Template Content -->
                        <div class="border-t border-gray-200 pt-6">
                            <label for="templateContent" class="block text-sm font-semibold text-gray-700">
                                Template Content <span class="text-red-500">*</span>
                            </label>
                            <div class="mb-3">
                                <p class="text-xs text-yellow-600 mt-2">Use {{PLACEHOLDER_NAME}} syntax to insert user inputs. Make sure placeholder names match exactly what you define above.</p>
                            </div>
                            <textarea id="templateContent" 
                                      class="w-full min-h-96 p-4 ${textareaClasses} ${focusClasses} text-sm font-mono resize-y" 
                                      style="height: 384px;" 
                                      placeholder="You are a {{ROLE_PLACEHOLDER}} who specializes in {{SPECIALTY_PLACEHOLDER}}.

Your task is to {{TASK_PLACEHOLDER}}.

Requirements:
- Be thorough and accurate
- Provide specific examples
- Keep responses under 500 words

Input to process:
{{INPUT_PLACEHOLDER}}" 
                                      required>${isEditing ? (template.isEvaluationTemplate ? template.standardTemplate : template.template) || '' : ''}</textarea>
                        </div>
                        
                        <!-- Actions -->
                        <div class="flex justify-end gap-3 pt-8 mt-8 border-t border-gray-200">
                            <button id="cancelEditorBtn" class="${secondaryButtonClasses} text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm">
                                Cancel
                            </button>
                            <button id="saveTemplateBtn" class="${primaryButtonClasses} text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm">
                                ${isEditing ? 'Update Template' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPlaceholderEditor(placeholder, index, inputClasses, secondaryButtonClasses, focusClasses) {
        return `
            <div class="flex gap-3 items-end p-4" data-placeholder-index="${index}">
                <div class="flex-1">
                    <label class="block text-xs font-semibold text-gray-700 mb-2">Placeholder Name</label>
                    <input type="text" class="placeholderName w-full h-10 p-3 ${inputClasses} ${focusClasses} text-sm" 
                           value="${placeholder ? placeholder.name : ''}" 
                           placeholder="e.g., USER_INPUT">
                </div>
                <div class="flex-2">
                    <label class="block text-xs font-semibold text-gray-700 mb-2">Label for User</label>
                    <input type="text" class="placeholderDescription w-full h-10 p-3 ${inputClasses} ${focusClasses} text-sm" 
                           value="${placeholder ? placeholder.description : ''}" 
                           placeholder="e.g., Enter your text here">
                </div>
                <div class="w-32">
                    <label class="block text-xs font-semibold text-gray-700 mb-2">Input Type</label>
                    <select class="placeholderType w-full h-10 p-2 ${inputClasses} text-sm">
                        <option value="input" ${placeholder && placeholder.type === 'input' ? 'selected' : ''}>Single Line</option>
                        <option value="textarea" ${placeholder && placeholder.type === 'textarea' ? 'selected' : ''}>Multi-line</option>
                    </select>
                </div>
                <button class="removePlaceholderBtn ${secondaryButtonClasses} text-white h-10 px-3 rounded-lg text-sm hover:bg-red-600 transition-colors">
                    Remove
                </button>
            </div>
        `;
    }
    
    renderToastNotification() {
        return `
            <div id="toast-notification" class="fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white text-sm transition-all duration-300 ease-in-out opacity-0 transform translate-y-2 z-50">
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
        toastElement.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-gray-700');

        if (type === 'success') {
            toastElement.classList.add('bg-green-500');
        } else if (type === 'error') {
            toastElement.classList.add('bg-red-500');
        } else if (type === 'warning') {
            toastElement.classList.add('bg-yellow-500');
        } else if (type === 'info') {
            toastElement.classList.add('bg-blue-500');
        } else {
            toastElement.classList.add('bg-gray-700');
        }

        toastElement.classList.remove('opacity-0', 'translate-y-2');
        toastElement.classList.add('opacity-100', 'translate-y-0');

        setTimeout(() => {
            toastElement.classList.remove('opacity-100', 'translate-y-0');
            toastElement.classList.add('opacity-0', 'translate-y-2');
        }, 3000);
    }

    initializeSystemPromptHandlers() {
        this.initializeTemplateManagement();
        this.initializeTemplateEditor();
        this.initializeTemplateUsage();
    }
    
    initializeTemplateManagement() {
        const createTemplateBtn = document.getElementById('createTemplateBtn');
        
        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', () => {
                this.openTemplateEditor();
            });
        }
        
        document.querySelectorAll('.editTemplateBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.editTemplateBtn').getAttribute('data-template-id');
                this.openTemplateEditor(templateId);
            });
        });
        
        document.querySelectorAll('.deleteTemplateBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.deleteTemplateBtn').getAttribute('data-template-id');
                this.deleteTemplate(templateId);
            });
        });
    }
    
    initializeTemplateEditor() {
        const closeEditorBtn = document.getElementById('closeEditorBtn');
        const cancelEditorBtn = document.getElementById('cancelEditorBtn');
        const saveTemplateBtn = document.getElementById('saveTemplateBtn');
        const addPlaceholderBtn = document.getElementById('addPlaceholderBtn');
        const editorOverlay = document.getElementById('templateEditorOverlay');
        
        if (editorOverlay) {
            let dragStartTime = 0;
            let isDragging = false;
            
            // Track when user starts any kind of interaction within the modal
            const templateEditor = document.getElementById('templateEditor');
            if (templateEditor) {
                templateEditor.addEventListener('mousedown', (e) => {
                    dragStartTime = Date.now();
                    isDragging = true;
                });
                
                // Stop propagation to prevent overlay clicks
                templateEditor.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
            
            // Reset dragging state on any mouseup
            document.addEventListener('mouseup', () => {
                // Give a longer delay for resize operations
                setTimeout(() => {
                    isDragging = false;
                    dragStartTime = 0;
                }, 200);
            });
            
            editorOverlay.addEventListener('click', (e) => {
                // Only close if:
                // 1. Clicking directly on the overlay
                // 2. Not currently dragging/resizing
                // 3. Some time has passed since last mouse interaction
                const timeSinceInteraction = Date.now() - dragStartTime;
                if (e.target === editorOverlay && !isDragging && timeSinceInteraction > 200) {
                    this.closeTemplateEditor();
                }
            });
        }
        
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
        // Standard template handlers
        document.querySelectorAll('.copyTemplatePromptBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.copyTemplatePromptBtn').getAttribute('data-template-id');
                this.copyGeneratedPrompt(templateId);
            });
        });
        
        document.querySelectorAll('.clearTemplateInputsBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.clearTemplateInputsBtn').getAttribute('data-template-id');
                this.clearTemplateInputs(templateId);
            });
        });

        // Evaluation template handlers
        document.querySelectorAll('.copyEvaluationPromptBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.copyEvaluationPromptBtn').getAttribute('data-template-id');
                this.copyEvaluationPrompt(templateId);
            });
        });
        
        document.querySelectorAll('.clearEvaluationInputsBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateId = e.target.closest('.clearEvaluationInputsBtn').getAttribute('data-template-id');
                this.clearEvaluationInputs(templateId);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'x') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.hasAttribute('data-template-id')) {
                    e.preventDefault();
                    const templateId = activeElement.getAttribute('data-template-id');
                    if (activeElement.id.includes('evalPromptInput') || activeElement.id.includes('evalResponse')) {
                        this.copyEvaluationPrompt(templateId);
                    } else {
                        this.copyGeneratedPrompt(templateId);
                    }
                }
            }
            if (e.ctrlKey && e.key === 't' && !this.isEditorOpen) {
                e.preventDefault();
                this.openTemplateEditor();
            }
            if (e.key === 'Escape' && this.isEditorOpen) {
                e.preventDefault();
                this.closeTemplateEditor();
            }
        });
    }
    
    openTemplateEditor(templateId = null) {
        this.isEditorOpen = true;
        this.editingTemplateId = templateId;
        this.render();
        this.initializeSystemPromptHandlers();
        
        if (!templateId) {
            this.addPlaceholder();
        }
        
        // Focus on template name
        setTimeout(() => {
            const nameInput = document.getElementById('templateName');
            if (nameInput) nameInput.focus();
        }, 100);
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
                const nameInput = element.querySelector('.placeholderName');
                const descInput = element.querySelector('.placeholderDescription');
                const typeSelect = element.querySelector('.placeholderType');
                
                if (nameInput && descInput && typeSelect) {
                    const name = nameInput.value.trim();
                    const description = descInput.value.trim();
                    const type = typeSelect.value;
                    
                    if (name) {
                        placeholders.push({ name, description, type });
                    }
                }
            }
            
            // Get the current template if we're editing
            const currentTemplate = this.editingTemplateId ? this.templateManager.getTemplateById(this.editingTemplateId) : null;
            const isEvaluationTemplate = currentTemplate && currentTemplate.isEvaluationTemplate;
            
            let templateData;
            if (isEvaluationTemplate) {
                // For evaluation templates, update the standardTemplate but keep the rubricTemplate
                templateData = {
                    name: templateName,
                    description: templateDescription,
                    isEvaluationTemplate: true,
                    standardTemplate: templateContent,
                    rubricTemplate: currentTemplate.rubricTemplate, // Keep existing rubric template
                    placeholders: placeholders
                };
            } else {
                templateData = {
                    name: templateName,
                    description: templateDescription,
                    template: templateContent,
                    placeholders: placeholders
                };
            }
            
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
        // Find the template card
        const deleteBtn = document.querySelector(`[data-template-id="${templateId}"].deleteTemplateBtn`);
        if (!deleteBtn) return;
        
        const templateCard = deleteBtn.closest('.border');
        if (!templateCard) return;
        
        // Check if confirmation is already showing
        if (templateCard.querySelector('.delete-confirmation')) return;
        
        // Create inline confirmation
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'delete-confirmation mt-4 p-4 bg-red-50 border border-red-200 rounded-md';
        confirmationDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="text-sm font-medium text-red-800">Delete Template</h4>
                    <p class="text-xs text-red-600 mt-1">This action cannot be undone.</p>
                </div>
                <div class="flex gap-2">
                    <button class="confirm-delete px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded">
                        Delete
                    </button>
                    <button class="cancel-delete px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        templateCard.appendChild(confirmationDiv);
        
        // Handle confirmation actions
        const confirmBtn = confirmationDiv.querySelector('.confirm-delete');
        const cancelBtn = confirmationDiv.querySelector('.cancel-delete');
        
        confirmBtn.addEventListener('click', () => {
            try {
                this.templateManager.deleteTemplate(templateId);
                this.showToast('Template deleted successfully.', 'success');
                this.render();
                this.initializeSystemPromptHandlers();
            } catch (error) {
                this.showToast(`Error deleting template: ${error.message}`, 'error');
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            templateCard.removeChild(confirmationDiv);
        });
    }
    
    copyGeneratedPrompt(templateId) {
        try {
            const placeholderValues = {};
            const inputs = document.querySelectorAll(`[data-template-id="${templateId}"][data-placeholder-name]`);
            
            for (const input of inputs) {
                const placeholderName = input.getAttribute('data-placeholder-name');
                placeholderValues[placeholderName] = input.value;
            }
            
            const generatedPrompt = this.templateManager.generatePromptFromTemplate(
                templateId, 
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

    copyEvaluationPrompt(templateId) {
        try {
            const originalPrompt = document.getElementById(`evalPromptInput_${templateId}`).value.trim();
            const aiResponse1 = document.getElementById(`evalResponse1Input_${templateId}`).value.trim();
            const aiResponse2 = document.getElementById(`evalResponse2Input_${templateId}`).value.trim();
            const rubricToggle = document.getElementById(`rubricEvalToggle_${templateId}`);
            const useRubric = rubricToggle && rubricToggle.checked;

            if (!originalPrompt) {
                this.showToast('Original prompt cannot be empty.', 'error');
                return;
            }

            let aiResponse = '';
            if (aiResponse1) {
                aiResponse = aiResponse1;
            } else if (aiResponse2) {
                aiResponse = aiResponse2;
            } else {
                this.showToast('At least one AI response is required.', 'error');
                return;
            }

            const placeholderValues = {
                'PROMPT_PLACEHOLDER': originalPrompt,
                'RESPONSE_PLACEHOLDER': aiResponse
            };

            const generatedPrompt = this.templateManager.generatePromptFromTemplate(
                templateId,
                placeholderValues,
                useRubric
            );

            navigator.clipboard.writeText(generatedPrompt)
                .then(() => {
                    this.showToast('Evaluation prompt copied to clipboard!', 'success');
                })
                .catch(err => {
                    this.fallbackCopyTextToClipboard(generatedPrompt, 'Copy Evaluation Prompt', true);
                });
        } catch (error) {
            this.showToast(`Error generating evaluation prompt: ${error.message}`, 'error');
        }
    }
    
    clearTemplateInputs(templateId) {
        const inputs = document.querySelectorAll(`[data-template-id="${templateId}"][data-placeholder-name]`);
        for (const input of inputs) {
            input.value = '';
        }
        this.showToast('Template inputs cleared.', 'info');
    }

    clearEvaluationInputs(templateId) {
        document.getElementById(`evalPromptInput_${templateId}`).value = '';
        document.getElementById(`evalResponse1Input_${templateId}`).value = '';
        document.getElementById(`evalResponse2Input_${templateId}`).value = '';
        const checkbox = document.getElementById(`rubricEvalToggle_${templateId}`);
        if (checkbox) checkbox.checked = false;
        this.showToast('Evaluation inputs cleared.', 'info');
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