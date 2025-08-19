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
        this.render().catch(console.error);
        this.initializeSystemPromptHandlers();
        
        // Listen for theme changes
        document.addEventListener('themeChanged', () => {
            this.render().catch(console.error);
        });
    }

    async render() {
        const focusClasses = this.themeManager ? this.themeManager.getFocusClasses().combined : 'focus:outline-none';
        const primaryButtonClasses = this.themeManager ? this.themeManager.getPrimaryButtonClasses() : 'bg-blue-600 hover:bg-blue-700';
        const secondaryButtonClasses = this.themeManager ? this.themeManager.getSecondaryButtonClasses() : 'bg-gray-500 hover:bg-gray-600';
        const cardClasses = this.themeManager ? this.themeManager.getCardClasses() : 'bg-white border border-gray-200';
        const inputClasses = this.themeManager ? this.themeManager.getInputClasses() : 'border border-gray-300 rounded-md';
        const textareaClasses = this.themeManager ? this.themeManager.getTextareaClasses() : 'border border-gray-300 rounded-md';
        
        const templateManagementSection = await this.renderTemplateManagementSection(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses);
        const templateEditor = await this.renderTemplateEditor(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses);
        
        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                ${templateManagementSection}
                ${templateEditor}
            </div>
            ${this.renderToastNotification()}
        `;
        
        // Populate existing placeholders if editing
        await this.populateExistingPlaceholders();
    }

    async renderTemplateManagementSection(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) {
        const templates = await this.templateManager.getAllTemplates();
        
        // Group evaluation templates
        const standardEval = templates.find(t => t.id === 'builtin-response-evaluation-standard');
        const rubricEval = templates.find(t => t.id === 'builtin-response-evaluation-rubric');
        const otherTemplates = templates.filter(t => 
            t.id !== 'builtin-response-evaluation-standard' && 
            t.id !== 'builtin-response-evaluation-rubric'
        );
        
        return `
            <div class="max-w-4xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-lg font-medium text-gray-700">System Prompt Templates</h2>
                    <button id="createTemplateBtn" class="${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                        Create New Template
                    </button>
                </div>
                
                <div class="space-y-6">
                    ${standardEval && rubricEval ? this.renderCombinedEvaluationTemplate(standardEval, rubricEval, primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) : ''}
                    ${otherTemplates.map(template => this.renderTemplateCard(template, primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses)).join('')}
                </div>
            </div>
        `;
    }

    renderCombinedEvaluationTemplate(standardTemplate, rubricTemplate, primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) {
        const templateId = 'response-evaluation-combined';
        const textSecondaryColor = this.themeManager ? this.themeManager.getColor('text', 'secondary') : 'text-gray-800';
        const textMutedColor = this.themeManager ? this.themeManager.getColor('text', 'muted') : 'text-gray-600';
        
        return `
            <div class="${cardClasses} rounded-lg p-6 mb-6" data-combined-eval="true">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-lg font-medium ${textSecondaryColor}">Response Evaluation</h3>
                        </div>
                        <p class="text-sm mt-1 ${textMutedColor}">Evaluate AI responses for code review with optional rubric mode</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="editTemplateBtn text-blue-600 hover:text-blue-800 text-sm p-1" data-template-id="${templateId}" title="Edit">
                            ✎
                        </button>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="rubricEvalToggle_${templateId}" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                        <label for="rubricEvalToggle_${templateId}" class="text-sm text-gray-700 cursor-pointer">Use Rubric Evaluation (detailed breakdown)</label>
                    </div>
                    
                    <div class="mb-4">
                        <label for="evalPromptInput_${templateId}" class="block text-sm font-medium text-gray-700 mb-2">Original Prompt to AI:</label>
                        <textarea id="evalPromptInput_${templateId}" class="w-full h-32 p-3 ${textareaClasses} ${focusClasses} text-sm" placeholder="Paste the original prompt..."></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label for="evalResponse1Input_${templateId}" class="block text-sm font-medium text-gray-700 mb-2">AI's Response 1:</label>
                            <textarea id="evalResponse1Input_${templateId}" class="w-full h-32 p-3 ${textareaClasses} ${focusClasses} text-sm" data-template-id="${templateId}" placeholder="Paste AI's first response..."></textarea>
                        </div>
                        <div>
                            <label for="evalResponse2Input_${templateId}" class="block text-sm font-medium text-gray-700 mb-2">AI's Response 2:</label>
                            <textarea id="evalResponse2Input_${templateId}" class="w-full h-32 p-3 ${textareaClasses} ${focusClasses} text-sm" data-template-id="${templateId}" placeholder="Paste AI's second response..."></textarea>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 justify-between">
                        <button class="copyEvaluationPromptBtn ${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm" data-template-id="${templateId}">
                            Copy Evaluation Prompt
                        </button>
                        <button class="clearEvaluationInputsBtn ${secondaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm" data-template-id="${templateId}">
                            Clear
                        </button>
                    </div>
                </div>
                
                <!-- Hidden data attributes to store actual template IDs -->
                <div class="hidden" data-standard-template-id="${standardTemplate.id}" data-rubric-template-id="${rubricTemplate.id}"></div>
            </div>
        `;
    }

    renderTemplateCard(template, primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) {
        const badgeClasses = this.themeManager ? this.themeManager.getStatusClasses('info') : 'bg-blue-100 text-blue-800';
        const textSecondaryColor = this.themeManager ? this.themeManager.getColor('text', 'secondary') : 'text-gray-800';
        const textMutedColor = this.themeManager ? this.themeManager.getColor('text', 'muted') : 'text-gray-600';
        
        return `
            <div class="${cardClasses} rounded-lg p-6 mb-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-lg font-medium ${textSecondaryColor}">${template.name}</h3>
                            ${template.isDefault ? `<span class="text-xs px-2 py-1 rounded ${badgeClasses}">Default</span>` : ''}
                        </div>
                        ${template.description ? `<p class="text-sm mt-1 ${textMutedColor}">${template.description}</p>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button class="editTemplateBtn text-blue-600 hover:text-blue-800 text-sm p-1" data-template-id="${template.id}" title="Edit">
                            ✎
                        </button>
                        ${template.isDefault ? `<button class="resetTemplateBtn text-green-600 hover:text-green-800 text-sm p-1" data-template-id="${template.id}" title="Reset to Default">↻</button>` : ''}
                        <button class="deleteTemplateBtn text-red-600 hover:text-red-800 text-sm p-1" data-template-id="${template.id}" title="Delete">×</button>
                    </div>
                </div>

                ${this.renderStandardTemplateInputs(template, primaryButtonClasses, secondaryButtonClasses, inputClasses, textareaClasses, focusClasses)}
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

    async renderTemplateEditor(primaryButtonClasses, secondaryButtonClasses, cardClasses, inputClasses, textareaClasses, focusClasses) {
        if (!this.isEditorOpen) {
            return '';
        }
        
        const template = this.editingTemplateId ? await this.templateManager.getTemplateById(this.editingTemplateId) : null;
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
                                <!-- Placeholders will be populated via DOM methods -->
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
                                      required>${isEditing ? template.template || '' : ''}</textarea>
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
        // Only initialize once to avoid duplicate listeners
        if (this._handlersInitialized) {
            return;
        }
        this._handlersInitialized = true;
        
        this.initializeTemplateManagement();
        this.initializeTemplateEditor();
        this.initializeTemplateUsage();
    }
    
    initializeTemplateManagement() {
        // Use event delegation to handle dynamically created buttons
        this.container.addEventListener('click', (e) => {
            // Handle create template button
            if (e.target.id === 'createTemplateBtn') {
                this.openTemplateEditor();
                return;
            }
            
            // Handle edit template buttons
            if (e.target.closest('.editTemplateBtn')) {
                const templateId = e.target.closest('.editTemplateBtn').getAttribute('data-template-id');
                this.openTemplateEditor(templateId);
                return;
            }
            
            // Handle delete template buttons
            if (e.target.closest('.deleteTemplateBtn')) {
                const templateId = e.target.closest('.deleteTemplateBtn').getAttribute('data-template-id');
                this.deleteTemplate(templateId).catch(console.error);
                return;
            }
            
            // Handle reset template buttons
            if (e.target.closest('.resetTemplateBtn')) {
                const templateId = e.target.closest('.resetTemplateBtn').getAttribute('data-template-id');
                this.resetTemplate(templateId).catch(console.error);
                return;
            }
        });
    }
    
    initializeTemplateEditor() {
        // Use event delegation for template editor buttons
        this.container.addEventListener('click', (e) => {
            // Handle close editor button
            if (e.target.id === 'closeEditorBtn' || e.target.closest('#closeEditorBtn')) {
                this.closeTemplateEditor();
                return;
            }
            
            // Handle cancel editor button
            if (e.target.id === 'cancelEditorBtn') {
                this.closeTemplateEditor();
                return;
            }
            
            // Handle save template button
            if (e.target.id === 'saveTemplateBtn') {
                this.saveTemplate().catch(console.error);
                return;
            }
            
            // Handle add placeholder button
            if (e.target.id === 'addPlaceholderBtn') {
                this.addPlaceholder();
                return;
            }
            
            // Handle clicking on overlay to close
            if (e.target.id === 'templateEditorOverlay') {
                // Check if we're not dragging/resizing
                if (!this._isDragging) {
                    this.closeTemplateEditor();
                }
                return;
            }
        });
        
        // Track dragging state for overlay click handling
        this.container.addEventListener('mousedown', (e) => {
            if (e.target.closest('#templateEditor')) {
                this._isDragging = true;
                this._dragStartTime = Date.now();
            }
        });
        
        // Reset dragging state (only add once)
        if (!this._mouseupInitialized) {
            this._mouseupInitialized = true;
            document.addEventListener('mouseup', () => {
                setTimeout(() => {
                    this._isDragging = false;
                    this._dragStartTime = 0;
                }, 200);
            });
        }
        
        
        // Handle removePlaceholderBtn using event delegation on document (only once)
        if (!this._removePlaceholderInitialized) {
            this._removePlaceholderInitialized = true;
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('removePlaceholderBtn')) {
                    e.target.closest('[data-placeholder-index]').remove();
                }
            });
        }
    }
    
    initializeTemplateUsage() {
        // Use event delegation for template usage buttons
        this.container.addEventListener('click', (e) => {
            // Handle copy template prompt buttons
            if (e.target.closest('.copyTemplatePromptBtn')) {
                const templateId = e.target.closest('.copyTemplatePromptBtn').getAttribute('data-template-id');
                this.copyGeneratedPrompt(templateId).catch(console.error);
                return;
            }
            
            // Handle clear template inputs buttons
            if (e.target.closest('.clearTemplateInputsBtn')) {
                const templateId = e.target.closest('.clearTemplateInputsBtn').getAttribute('data-template-id');
                this.clearTemplateInputs(templateId);
                return;
            }
            
            // Handle copy evaluation prompt buttons
            if (e.target.closest('.copyEvaluationPromptBtn')) {
                const templateId = e.target.closest('.copyEvaluationPromptBtn').getAttribute('data-template-id');
                this.copyEvaluationPrompt(templateId);
                return;
            }
            
            // Handle clear evaluation inputs buttons
            if (e.target.closest('.clearEvaluationInputsBtn')) {
                const templateId = e.target.closest('.clearEvaluationInputsBtn').getAttribute('data-template-id');
                this.clearEvaluationInputs(templateId);
                return;
            }
        });
        
        // Keyboard shortcuts - only add once
        if (!this._keyboardInitialized) {
            this._keyboardInitialized = true;
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'x') {
                    const activeElement = document.activeElement;
                    if (activeElement && activeElement.hasAttribute('data-template-id')) {
                        e.preventDefault();
                        const templateId = activeElement.getAttribute('data-template-id');
                        if (activeElement.id.includes('evalPromptInput') || activeElement.id.includes('evalResponse')) {
                            this.copyEvaluationPrompt(templateId).catch(console.error);
                        } else {
                            this.copyGeneratedPrompt(templateId).catch(console.error);
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
    }
    
    openTemplateEditor(templateId = null) {
        // Handle combined evaluation template
        if (templateId === 'response-evaluation-combined') {
            const combinedCard = document.querySelector('[data-combined-eval="true"]');
            if (combinedCard) {
                const rubricToggle = combinedCard.querySelector(`#rubricEvalToggle_${templateId}`);
                const useRubric = rubricToggle ? rubricToggle.checked : false;
                
                // Get the actual template ID based on checkbox state
                const hiddenDiv = combinedCard.querySelector('.hidden');
                if (hiddenDiv) {
                    const actualTemplateId = useRubric 
                        ? hiddenDiv.getAttribute('data-rubric-template-id')
                        : hiddenDiv.getAttribute('data-standard-template-id');
                    
                    if (actualTemplateId) {
                        templateId = actualTemplateId;
                    }
                }
            }
        }
        
        this.isEditorOpen = true;
        this.editingTemplateId = templateId;
        
        this.render();
        
        // For new templates, add a placeholder
        if (!templateId) {
            setTimeout(() => {
                this.addPlaceholder();
            }, 100);
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
    }
    
    addPlaceholder() {
        const placeholderList = document.getElementById('placeholderList');
        if (!placeholderList) return;
        
        const index = placeholderList.children.length;
        const focusClasses = this.themeManager ? this.themeManager.getFocusClasses().combined : 'focus:outline-none';
        const inputClasses = this.themeManager ? this.themeManager.getInputClasses() : 'border border-gray-300 rounded-md';
        const secondaryButtonClasses = this.themeManager ? this.themeManager.getSecondaryButtonClasses() : 'bg-gray-500 hover:bg-gray-600';
        
        const placeholderElement = this.createPlaceholderEditor(null, index, inputClasses, secondaryButtonClasses, focusClasses);
        placeholderList.appendChild(placeholderElement);
    }
    
    async saveTemplate() {
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
                await this.templateManager.updateTemplate(this.editingTemplateId, templateData);
                this.showToast('Template updated successfully!', 'success');
            } else {
                await this.templateManager.createTemplate(templateData);
                this.showToast('Template created successfully!', 'success');
            }
            
            this.closeTemplateEditor();
        } catch (error) {
            this.showToast(`Error saving template: ${error.message}`, 'error');
        }
    }
    
    async deleteTemplate(templateId) {
        // Find the template card
        const deleteBtn = document.querySelector(`[data-template-id="${templateId}"].deleteTemplateBtn`);
        if (!deleteBtn) return;
        
        const templateCard = deleteBtn.closest('.border');
        if (!templateCard) return;
        
        // Check if confirmation is already showing
        if (templateCard.querySelector('.delete-confirmation')) return;
        
        // Create inline confirmation using secure DOM methods
        const confirmationDiv = this.createDeleteConfirmation();
        
        templateCard.appendChild(confirmationDiv);
        
        // Handle confirmation actions
        const confirmBtn = confirmationDiv.querySelector('.confirm-delete');
        const cancelBtn = confirmationDiv.querySelector('.cancel-delete');
        
        confirmBtn.addEventListener('click', async () => {
            try {
                await this.templateManager.deleteTemplate(templateId);
                this.showToast('Template deleted successfully.', 'success');
                this.render().catch(console.error);
            } catch (error) {
                this.showToast(`Error deleting template: ${error.message}`, 'error');
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            templateCard.removeChild(confirmationDiv);
        });
    }
    
    async resetTemplate(templateId) {
        try {
            await this.templateManager.resetTemplateToDefault(templateId);
            this.showToast('Template reset to default successfully!', 'success');
            this.render().catch(console.error);
        } catch (error) {
            this.showToast(`Error resetting template: ${error.message}`, 'error');
        }
    }
    
    async copyGeneratedPrompt(templateId) {
        try {
            const placeholderValues = {};
            const inputs = document.querySelectorAll(`[data-template-id="${templateId}"][data-placeholder-name]`);
            
            for (const input of inputs) {
                const placeholderName = input.getAttribute('data-placeholder-name');
                placeholderValues[placeholderName] = input.value;
            }
            
            const generatedPrompt = await this.templateManager.generatePromptFromTemplate(
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

    async copyEvaluationPrompt(templateId) {
        try {
            // Handle combined evaluation template
            let actualTemplateId = templateId;
            if (templateId === 'response-evaluation-combined') {
                const combinedCard = document.querySelector('[data-combined-eval="true"]');
                if (combinedCard) {
                    const rubricToggle = combinedCard.querySelector(`#rubricEvalToggle_${templateId}`);
                    const useRubric = rubricToggle ? rubricToggle.checked : false;
                    
                    // Get the actual template ID based on checkbox state
                    const hiddenDiv = combinedCard.querySelector('.hidden');
                    if (hiddenDiv) {
                        actualTemplateId = useRubric 
                            ? hiddenDiv.getAttribute('data-rubric-template-id')
                            : hiddenDiv.getAttribute('data-standard-template-id');
                    }
                }
            }
            
            const originalPrompt = document.getElementById(`evalPromptInput_${templateId}`).value.trim();
            const aiResponse1 = document.getElementById(`evalResponse1Input_${templateId}`).value.trim();
            const aiResponse2 = document.getElementById(`evalResponse2Input_${templateId}`).value.trim();

            if (!originalPrompt) {
                this.showToast('Original prompt cannot be empty.', 'error');
                return;
            }

            let aiResponse = '';
            
            // Determine which response to use based on which textarea has focus or which has content
            const activeElement = document.activeElement;
            const isResponse1Focused = activeElement && activeElement.id === `evalResponse1Input_${templateId}`;
            const isResponse2Focused = activeElement && activeElement.id === `evalResponse2Input_${templateId}`;
            
            if (isResponse2Focused && aiResponse2) {
                // User is focused on Response 2 and it has content - use it
                aiResponse = aiResponse2;
            } else if (isResponse1Focused && aiResponse1) {
                // User is focused on Response 1 and it has content - use it
                aiResponse = aiResponse1;
            } else if (aiResponse2) {
                // Response 2 has content but user isn't focused on either - use Response 2
                aiResponse = aiResponse2;
            } else if (aiResponse1) {
                // Response 1 has content - use it as fallback
                aiResponse = aiResponse1;
            } else {
                this.showToast('At least one AI response is required.', 'error');
                return;
            }

            const placeholderValues = {
                'PROMPT_PLACEHOLDER': originalPrompt,
                'RESPONSE_PLACEHOLDER': aiResponse
            };

            const generatedPrompt = await this.templateManager.generatePromptFromTemplate(
                actualTemplateId,
                placeholderValues
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

    /**
     * Populate existing placeholders when editing a template
     */
    async populateExistingPlaceholders() {
        const placeholderList = document.getElementById('placeholderList');
        if (!placeholderList || !this.editingTemplateId) return;

        // Fetch the template being edited
        const template = await this.templateManager.getTemplateById(this.editingTemplateId);
        if (!template) return;

        // Get theme classes
        const focusClasses = this.themeManager ? this.themeManager.getFocusClasses().combined : 'focus:outline-none';
        const inputClasses = this.themeManager ? this.themeManager.getInputClasses() : 'border border-gray-300 rounded-md';
        const secondaryButtonClasses = this.themeManager ? this.themeManager.getSecondaryButtonClasses() : 'bg-gray-500 hover:bg-gray-600';

        // Clear existing content
        placeholderList.textContent = '';

        // Add existing placeholders if available
        if (template.placeholders && template.placeholders.length > 0) {
            template.placeholders.forEach((placeholder, index) => {
                const placeholderElement = this.createPlaceholderEditor(
                    placeholder, 
                    index, 
                    inputClasses, 
                    secondaryButtonClasses, 
                    focusClasses
                );
                placeholderList.appendChild(placeholderElement);
            });
        }
    }

    /**
     * Create a placeholder editor element using secure DOM methods
     */
    createPlaceholderEditor(placeholder, index, inputClasses, secondaryButtonClasses, focusClasses) {
        // Create main container
        const container = document.createElement('div');
        container.className = 'flex gap-3 items-end p-4';
        container.dataset.placeholderIndex = index.toString();

        // Create name input section
        const nameSection = document.createElement('div');
        nameSection.className = 'flex-1';
        
        const nameLabel = document.createElement('label');
        nameLabel.className = 'block text-xs font-semibold text-gray-700 mb-2';
        nameLabel.textContent = 'Placeholder Name';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = `placeholderName w-full h-10 p-3 ${inputClasses} ${focusClasses} text-sm`;
        nameInput.value = placeholder ? placeholder.name : '';
        nameInput.placeholder = 'e.g., USER_INPUT';
        
        nameSection.appendChild(nameLabel);
        nameSection.appendChild(nameInput);

        // Create description input section
        const descSection = document.createElement('div');
        descSection.className = 'flex-2';
        
        const descLabel = document.createElement('label');
        descLabel.className = 'block text-xs font-semibold text-gray-700 mb-2';
        descLabel.textContent = 'Label for User';
        
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = `placeholderDescription w-full h-10 p-3 ${inputClasses} ${focusClasses} text-sm`;
        descInput.value = placeholder ? placeholder.description : '';
        descInput.placeholder = 'e.g., Enter your text here';
        
        descSection.appendChild(descLabel);
        descSection.appendChild(descInput);

        // Create type select section
        const typeSection = document.createElement('div');
        typeSection.className = 'w-32';
        
        const typeLabel = document.createElement('label');
        typeLabel.className = 'block text-xs font-semibold text-gray-700 mb-2';
        typeLabel.textContent = 'Input Type';
        
        const typeSelect = document.createElement('select');
        typeSelect.className = `placeholderType w-full h-10 p-2 ${inputClasses} text-sm`;
        
        const inputOption = document.createElement('option');
        inputOption.value = 'input';
        inputOption.textContent = 'Single Line';
        if (placeholder && placeholder.type === 'input') {
            inputOption.selected = true;
        }
        
        const textareaOption = document.createElement('option');
        textareaOption.value = 'textarea';
        textareaOption.textContent = 'Multi-line';
        if (placeholder && placeholder.type === 'textarea') {
            textareaOption.selected = true;
        }
        
        typeSelect.appendChild(inputOption);
        typeSelect.appendChild(textareaOption);
        typeSection.appendChild(typeLabel);
        typeSection.appendChild(typeSelect);

        // Create remove button
        const removeButton = document.createElement('button');
        removeButton.className = `removePlaceholderBtn ${secondaryButtonClasses} text-white h-10 px-3 rounded-lg text-sm hover:bg-red-600 transition-colors`;
        removeButton.textContent = 'Remove';

        // Assemble the container
        container.appendChild(nameSection);
        container.appendChild(descSection);
        container.appendChild(typeSection);
        container.appendChild(removeButton);

        return container;
    }

    /**
     * Create delete confirmation dialog using secure DOM methods
     */
    createDeleteConfirmation() {
        // Create main container
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'delete-confirmation mt-4 p-4 bg-red-50 border border-red-200 rounded-md';

        // Create flex container
        const flexContainer = document.createElement('div');
        flexContainer.className = 'flex items-center justify-between';

        // Create text section
        const textSection = document.createElement('div');
        
        const title = document.createElement('h4');
        title.className = 'text-sm font-medium text-red-800';
        title.textContent = 'Delete Template';
        
        const description = document.createElement('p');
        description.className = 'text-xs text-red-600 mt-1';
        description.textContent = 'This action cannot be undone.';
        
        textSection.appendChild(title);
        textSection.appendChild(description);

        // Create button section
        const buttonSection = document.createElement('div');
        buttonSection.className = 'flex gap-2';
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'confirm-delete px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded';
        deleteButton.textContent = 'Delete';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-delete px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded';
        cancelButton.textContent = 'Cancel';
        
        buttonSection.appendChild(deleteButton);
        buttonSection.appendChild(cancelButton);

        // Assemble the confirmation dialog
        flexContainer.appendChild(textSection);
        flexContainer.appendChild(buttonSection);
        confirmationDiv.appendChild(flexContainer);

        return confirmationDiv;
    }
}

export default SystemPromptView;