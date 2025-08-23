import { SecureStorage } from './SecureStorage.js';

export class CustomTemplateManager {
    constructor() {
        this.storageKey = 'systemPromptTemplates';
        this.versionKey = 'systemPromptTemplatesVersion';
        this.currentVersion = 1;
        
        // Initialize templates (migrate if needed)
        this.initializeTemplates();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async initializeTemplates() {
        const version = await SecureStorage.getItem(this.versionKey);
        const storedData = await SecureStorage.getItem(this.storageKey);
        
        // Initialize with defaults if:
        // 1. No stored data exists (first-time user)
        // 2. Version is outdated
        // 3. Stored templates array is empty
        if (!storedData || !version || parseInt(version) < this.currentVersion) {
            await this.migrateToVersion1();
        } else {
            // Check if existing templates are empty and reinitialize if needed
            const existingTemplates = await this.getTemplates();
            if (existingTemplates.length === 0) {
                await this.migrateToVersion1();
            }
        }
    }

    async migrateToVersion1() {
        const templates = await this.getTemplates();
        const existingCustomTemplates = templates.filter(t => !t.isDefault);
        const defaultTemplates = this.getDefaultTemplates();
        
        // Combine existing custom templates with fresh default templates
        const allTemplates = [...defaultTemplates, ...existingCustomTemplates];
        
        await this.saveTemplates(allTemplates);
        await SecureStorage.setItem(this.versionKey, this.currentVersion.toString());
    }

    async getAllTemplates() {
        return await this.getTemplates();
    }

    async getTemplates() {
        try {
            const data = await SecureStorage.getItem(this.storageKey);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return parsed.templates || [];
        } catch (error) {
            console.error('Failed to load templates:', error);
            return [];
        }
    }

    async saveTemplates(templates) {
        try {
            const data = { templates };
            await SecureStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save templates:', error);
            return false;
        }
    }

    async createTemplate(templateData) {
        const { name, description, placeholders, template } = templateData;
        
        if (!name || !template) {
            throw new Error('Name and template content are required');
        }

        const newTemplate = {
            id: this.generateId(),
            name: name.trim(),
            description: description?.trim() || '',
            placeholders: placeholders || [],
            template: template.trim(),
            isDefault: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const templates = await this.getTemplates();
        templates.push(newTemplate);
        
        if (await this.saveTemplates(templates)) {
            return newTemplate;
        } else {
            throw new Error('Failed to save template');
        }
    }

    async updateTemplate(id, templateData) {
        const templates = await this.getTemplates();
        const index = templates.findIndex(t => t.id === id);
        
        if (index === -1) {
            throw new Error('Template not found');
        }

        const updatedTemplate = {
            ...templates[index],
            ...templateData,
            updatedAt: Date.now()
        };

        templates[index] = updatedTemplate;
        
        if (await this.saveTemplates(templates)) {
            return updatedTemplate;
        } else {
            throw new Error('Failed to update template');
        }
    }

    async deleteTemplate(id) {
        const templates = await this.getTemplates();
        const filteredTemplates = templates.filter(t => t.id !== id);
        
        if (filteredTemplates.length === templates.length) {
            throw new Error('Template not found');
        }

        return await this.saveTemplates(filteredTemplates);
    }

    async getTemplateById(id) {
        const allTemplates = await this.getAllTemplates();
        return allTemplates.find(t => t.id === id);
    }

    async resetTemplateToDefault(id) {
        const template = await this.getTemplateById(id);
        
        if (!template || !template.isDefault) {
            throw new Error('Template is not a default template');
        }
        
        // Find the original default template
        const defaultTemplates = this.getDefaultTemplates();
        const originalTemplate = defaultTemplates.find(t => t.id === id);
        
        if (!originalTemplate) {
            throw new Error('Original default template not found');
        }
        
        // Update with original content but keep user's name/description if modified
        const resetData = {
            ...originalTemplate,
            name: template.name, // Keep user's name if they changed it
            description: template.description, // Keep user's description if they changed it
            updatedAt: Date.now()
        };
        
        return await this.updateTemplate(id, resetData);
    }

    async generatePromptFromTemplate(templateId, placeholderValues) {
        const template = await this.getTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        let generatedPrompt = template.template;
        for (const placeholder of template.placeholders) {
            const value = placeholderValues[placeholder.name];
            generatedPrompt = generatedPrompt.replace(
                new RegExp(`{{${placeholder.name}}}`, 'g'), 
                value || ''
            );
        }

        return generatedPrompt;
    }

    validateTemplate(template) {
        const errors = [];
        
        if (!template.name || template.name.trim() === '') {
            errors.push('Template name is required');
        }

        if (!template.template || template.template.trim() === '') {
            errors.push('Template content is required');
        }

        const placeholderPattern = /{{([^}]+)}}/g;
        const templatePlaceholders = [...template.template.matchAll(placeholderPattern)]
            .map(match => match[1].trim());
        
        const definedPlaceholders = template.placeholders.map(p => p.name);
        
        const undefinedPlaceholders = templatePlaceholders.filter(
            p => !definedPlaceholders.includes(p)
        );
        
        if (undefinedPlaceholders.length > 0) {
            errors.push(`Undefined placeholders: ${undefinedPlaceholders.join(', ')}`);
        }

        return errors;
    }

    getDefaultTemplates() {
        return [
            {
                id: 'builtin-code-setup',
                name: 'Code Setup',
                description: 'Generate environment setup instructions for code',
                placeholders: [
                    {
                        name: 'CODE_PLACEHOLDER',
                        description: 'Paste your code here',
                        type: 'textarea'
                    }
                ],
                template: `I will provide you with a prompt. Your job is to explain how to setup my environment to run the code in the prompt.
- Provide any npm, pip or sudo installation commands along with any commands to setup the project, such as \`npm init -y\`, \`mkdir\`, \`touch\` etc.
- Provide the run commands, using node, python3, g++, or gcc depending on the language.
- Assume an environment of WSL Ubuntu, and that the user has the basics already installed, such as Python, npm, react, pip, g++, gcc, etc.
- Do not include commands for pasting in the provided code to the files, I can do that on my own. Commands like \`cat\` should only be used for very short config files when necessary.
- Put each command in its own code block so I can copy them easier. Chain similar commands using \`&&\` where appropriate.
- If necessary, provide a graph of the file structure.
- Do not actually answer anything else in the prompt, I just want to know how to run the code.
- Keep it short, without any extra information.

Got it? Here is the prompt. 
<prompt>
{{CODE_PLACEHOLDER}}
</prompt>`,
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'builtin-response-evaluation-standard',
                name: 'Response Evaluation (Standard)',
                description: 'Evaluate AI responses for code review with thorough analysis',
                placeholders: [
                    {
                        name: 'PROMPT_PLACEHOLDER',
                        description: 'Original Prompt',
                        type: 'textarea'
                    },
                    {
                        name: 'RESPONSE_PLACEHOLDER',
                        description: 'AI Response',
                        type: 'textarea'
                    }
                ],
                template: `You are a senior software engineer whose goal is to provide insightful, constructive, and technically detailed code reviews for code responses provided with a prompt. You are given a prompt and a response in XML format.

Review the response for:
1. **Code Correctness** - Assess if the code executes correctly, handles edge cases, and produces the intended output.
2. **Instruction Following** - Ensure that the response fulfills all explicit requests in the prompt. Additionally, identify any implicit expectations that, while not stated in the prompt, would be important for a complete response.
3. **Documentation Accuracy** - All comments and explanations should be fully accurate and not misleading. Additionally, comments should not describe any changes made to the code, and should instead be framed as original.

Offer a thorough evaluation for each dimension and, where applicable, provide examples to illustrate recommended improvements or corrections.
Be very analytical in your evaluation, and provide a summary of the biggest flaws at the end. 
<prompt>
{{PROMPT_PLACEHOLDER}}
</prompt>
<response>
{{RESPONSE_PLACEHOLDER}}
</response>`,
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'builtin-response-evaluation-rubric',
                name: 'Response Evaluation (Rubric)',
                description: 'Evaluate AI responses with detailed rubric breakdown',
                placeholders: [
                    {
                        name: 'PROMPT_PLACEHOLDER',
                        description: 'Original Prompt',
                        type: 'textarea'
                    },
                    {
                        name: 'RESPONSE_PLACEHOLDER',
                        description: 'AI Response',
                        type: 'textarea'
                    }
                ],
                template: `You are a senior software engineer whose goal is to provide insightful, constructive, and technically detailed code reviews for code responses provided with a prompt. You are given a prompt and a response in an XML format.

Your job is to:

1. Break the original prompt into its individual requirements/requests
2. For each requirement:
   a. Restate it succinctly
   b. Rate how well the response addresses it (1-5 scale)
   c. Check for correctness of implementation
   d. Verify accuracy of any comments/explanations related to that requirement
   e. Note any issues or improvements needed

3. Identify any requirements that were missed entirely
4. Check for any factual errors or misleading statements in explanations
5. Provide an overall assessment with key recommendations

### Output Format (table example)

Requirement | Addressed? | Correctness | Comment Accuracy | Rating | Notes
------------|------------|-------------|------------------|--------|-------
Create login function | ✔ | Correct | Accurate | 4/5 | Missing error handling
Add validation | ✔ | Minor bug | Misleading | 2/5 | Regex explanation wrong
Return user object | ✘ | — | — | 0/5 | Completely missing
... | ... | ... | ... | ... | ...

**Overall Assessment:**
- Average Score: X.X/5  
- Requirements missed: [list any]
- Biggest correctness issues: [list key problems]
- Comment/explanation problems: [list inaccuracies]
- Key recommendations: [actionable improvements]

Be very critical in your evaluation. Rate 1 = completely wrong/missing, 5 = perfectly implemented.

<prompt>
{{PROMPT_PLACEHOLDER}}
</prompt>
<response>
{{RESPONSE_PLACEHOLDER}}
</response>`,
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'builtin-content-comparison',
                name: 'Content Comparison',
                description: 'Compare two responses for differences and accuracy',
                placeholders: [
                    {
                        name: 'RESPONSE_A_PLACEHOLDER',
                        description: 'First response to compare',
                        type: 'textarea'
                    },
                    {
                        name: 'RESPONSE_B_PLACEHOLDER',
                        description: 'Second response to compare',
                        type: 'textarea'
                    }
                ],
                template: `You are an expert computer-science content comparator. You will be given two blocks of text, Response A and Response B. Your job is to:

1. Break each response into its individual claims or steps.  
2. For each claim/step:
   a. Restate it succinctly.  
   b. Indicate whether it appears in A, in B, or in both.  
   c. Judge whether the wording or logic is functionally equivalent.  
   d. Check for any factual errors or logical missteps in that claim.
3. Identify any claims that appear in one response but not the other.  
4. Summarize any mismatches in logic or missing details.  
5. At the end, answer:
   • "Functionally identical?" (Yes/No)  
   • "Any false or misleading statements?" (Yes/No)  
   • If "No" to either, list the specific points of difference or error.

### Output format (table example)

Claim/Step                  | In A? | In B? | Equivalent? | False? | Comments  
-----------------------------|-------|-------|-------------|--------|---------  
All inputs = 1               |  ✔    | ✔     | Yes         | No     | —  
y₁ = AND(x₁,x₂) → 1          |  ✔    | ✔     | Yes         | No     | —  
MUX second data input = XOR  |  ✘    | ✘     | —           | No     | Both skip naming it  
…                            | …     | …     | …           | …      | …  

Functionally identical? Yes  
Any false statements? No  

If you find any mismatches or errors, call them out in the table and the final summary.

### Inputs
<ResponseA>
{{RESPONSE_A_PLACEHOLDER}}
</ResponseA>

<ResponseB>
{{RESPONSE_B_PLACEHOLDER}}
</ResponseB>`,
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];
    }
}

export default CustomTemplateManager;