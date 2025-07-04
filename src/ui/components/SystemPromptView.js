export class SystemPromptView {
    constructor(containerId, themeManager = null) {
        this.container = document.getElementById(containerId);
        this.themeManager = themeManager;
        if (!this.container) {
            console.error("System Prompt View container not found!");
            return;
        }
        this.render();
        this.initializeSystemPromptHandlers();
    }

    render() {
        // Get theme classes
        const focusClasses = this.themeManager ? this.themeManager.getFocusClasses().combined : 'focus:outline-none';
        const primaryButtonClasses = this.themeManager ? this.themeManager.getPrimaryButtonClasses() : 'bg-gray-600 hover:bg-gray-700';
        const primaryBg = this.themeManager ? this.themeManager.getNestedColor('button', 'primary', 'bg') : 'bg-gray-600';
        
        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto">

                <!-- System Prompt for Code Setup -->
                <div class="bg-white shadow-sm border border-gray-200 rounded-md p-6 mb-6">
                    <h2 class="text-lg font-medium mb-4 text-gray-700">Code Setup Prompt</h2>
                    <textarea id="systemPromptInputCode" class="w-full h-40 p-3 border border-gray-300 rounded-md ${focusClasses} text-sm" placeholder="Paste your code here..."></textarea>
                    <div class="mt-6 flex gap-3 justify-between">
                        <button id="copySystemPromptButton1" class="${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Copy Setup Prompt
                        </button>
                        <button id="clearSystemPromptButton1" class="bg-gray-500 hover:${primaryBg} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Clear
                        </button>
                    </div>
                </div>

                <!-- System Prompt for Prompt/Response Evaluation -->
                <div class="bg-white shadow-sm border border-gray-200 rounded-md p-6 mb-6">
                    <h2 class="text-lg font-medium mb-4 text-gray-700">Prompt/Response Evaluation Prompt</h2>

                    <div class="mb-4">
                        <label for="systemPromptInputPrompt2" class="block text-sm font-medium text-gray-700 mb-2">Original Prompt to AI:</label>
                        <textarea id="systemPromptInputPrompt2" class="w-full h-32 p-3 border border-gray-300 rounded-md ${focusClasses} text-sm" placeholder="Paste the original prompt..."></textarea>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label for="systemPromptInputResponse2_1" class="block text-sm font-medium text-gray-700 mb-2">AI's Response 1:</label>
                            <textarea id="systemPromptInputResponse2_1" class="w-full h-32 p-3 border border-gray-300 rounded-md ${focusClasses} text-sm" placeholder="Paste AI's first response..."></textarea>
                        </div>
                        <div>
                            <label for="systemPromptInputResponse2_2" class="block text-sm font-medium text-gray-700 mb-2">AI's Response 2:</label>
                            <textarea id="systemPromptInputResponse2_2" class="w-full h-32 p-3 border border-gray-300 rounded-md ${focusClasses} text-sm" placeholder="Paste AI's second response..."></textarea>
                        </div>
                    </div>
                    <div class="flex gap-3 justify-between">
                        <button id="copySystemPromptButton2" class="${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Copy Evaluation Prompt
                        </button>
                        <button id="clearSystemPromptButton2" class="bg-gray-500 hover:${primaryBg} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Clear
                        </button>
                    </div>
                </div>

                <!-- System Prompt for Content Comparison -->
                <div class="bg-white shadow-sm border border-gray-200 rounded-md p-6">
                    <h2 class="text-lg font-medium mb-4 text-gray-700">Content Comparison Prompt</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label for="systemPromptInputResponseA" class="block text-sm font-medium text-gray-700 mb-2">Response A:</label>
                            <textarea id="systemPromptInputResponseA" class="w-full h-40 p-3 border border-gray-300 rounded-md ${focusClasses} text-sm" placeholder="Paste Response A here..."></textarea>
                        </div>
                        <div>
                            <label for="systemPromptInputResponseB" class="block text-sm font-medium text-gray-700 mb-2">Response B:</label>
                            <textarea id="systemPromptInputResponseB" class="w-full h-40 p-3 border border-gray-300 rounded-md ${focusClasses} text-sm" placeholder="Paste Response B here..."></textarea>
                        </div>
                    </div>
                    <div class="flex gap-3 justify-between">
                        <button id="copySystemPromptButton3" class="${primaryButtonClasses} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Copy Comparison Prompt
                        </button>
                        <button id="clearSystemPromptButton3" class="bg-gray-500 hover:${primaryBg} text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Clear
                        </button>
                    </div>
                </div>
            </div>
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
        toastElement.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500', primaryBg); // Remove existing color classes

        if (type === 'success') {
            toastElement.classList.add('bg-green-500');
        } else if (type === 'error') {
            toastElement.classList.add('bg-red-500');
        } else if (type === 'warning') {
            toastElement.classList.add('bg-yellow-500'); // Or another color for warning
        } else if (type === 'info') {
            toastElement.classList.add(primaryBg);
        } else {
            toastElement.classList.add('bg-gray-700'); // Default
        }

        toastElement.classList.remove('opacity-0');
        toastElement.classList.add('opacity-100');

        setTimeout(() => {
            toastElement.classList.remove('opacity-100');
            toastElement.classList.add('opacity-0');
        }, 3000);
    }

    _copyEvaluationContent(originalPrompt, aiResponse, buttonElement, successMessage, systemTemplate, emptyFieldMessage) {
        if (originalPrompt.trim() === '') {
            this.showToast('Original prompt cannot be empty.', 'error');
            return;
        }
        if (aiResponse.trim() === '') {
            this.showToast(emptyFieldMessage || 'AI Response field cannot be empty.', 'error');
            return;
        }

        let generatedPrompt = systemTemplate
            .replace('{{PROMPT_PLACEHOLDER}}', originalPrompt)
            .replace('{{RESPONSE_PLACEHOLDER}}', aiResponse);

        if (!generatedPrompt || generatedPrompt.trim() === '') {
            this.showToast('Cannot copy empty content', 'error');
            return;
        }
        navigator.clipboard.writeText(generatedPrompt)
            .then(() => {
                this.showToast(successMessage, 'success');
            })
            .catch(err => {
                this.fallbackCopyTextToClipboard(generatedPrompt, 'Copy Evaluation Prompt', true);
            });
    }

    initializeSystemPromptHandlers() {
        // --- First System Prompt (Code Setup) --- 
        const systemPromptInputCode = document.getElementById('systemPromptInputCode');
        const copySystemPromptButton1 = document.getElementById('copySystemPromptButton1');
        const clearSystemPromptButton1 = document.getElementById('clearSystemPromptButton1');

        const systemPromptTemplate1 = `
I will provide you with a prompt. Your job is to explain how to setup my environment to run the code in the prompt.
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
</prompt>
        `.trim();

        if (copySystemPromptButton1 && systemPromptInputCode) {
            copySystemPromptButton1.addEventListener('click', () => {
                const userCode = systemPromptInputCode.value;
                if (userCode.trim() === '') {
                    this.showToast('Please paste code first.', 'warning');
                    return;
                }
                const generatedPrompt = systemPromptTemplate1.replace('{{CODE_PLACEHOLDER}}', userCode);
                
                if (!generatedPrompt || generatedPrompt.trim() === '') {
                    this.showToast('Cannot copy empty content', 'error');
                    return;
                }
                navigator.clipboard.writeText(generatedPrompt)
                    .then(() => {
                        this.showToast('Setup prompt copied!', 'success');
                    })
                    .catch(err => {
                        this.fallbackCopyTextToClipboard(generatedPrompt, 'Copy Setup Prompt', true);
                    });
            });

            systemPromptInputCode.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'x') {
                    e.preventDefault();
                    copySystemPromptButton1.click();
                }
            });
        }

        if (clearSystemPromptButton1 && systemPromptInputCode) {
            clearSystemPromptButton1.addEventListener('click', () => {
                systemPromptInputCode.value = '';
                this.showToast('Code input cleared.', 'info');
            });
        }

        // --- Second System Prompt (Prompt/Response Evaluation) --
        const systemPromptInputPrompt2 = document.getElementById('systemPromptInputPrompt2');
        const systemPromptInputResponse2_1 = document.getElementById('systemPromptInputResponse2_1');
        const systemPromptInputResponse2_2 = document.getElementById('systemPromptInputResponse2_2');
        const copySystemPromptButton2 = document.getElementById('copySystemPromptButton2');
        const clearSystemPromptButton2 = document.getElementById('clearSystemPromptButton2');

        const systemPromptTemplate2 = `
You are a senior software engineer whose goal is to provide insightful, constructive, and technically detailed code reviews for code responses provided with a prompt. You are given a prompt and a response in an XML format.

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
</response>
        `.trim();

        if (copySystemPromptButton2 && systemPromptInputPrompt2 && systemPromptInputResponse2_1 && systemPromptInputResponse2_2) {
            copySystemPromptButton2.addEventListener('click', () => {
                const originalPrompt = systemPromptInputPrompt2.value;
                const aiResponse1 = systemPromptInputResponse2_1.value;
                const aiResponse2 = systemPromptInputResponse2_2.value;

                if (originalPrompt.trim() === '') {
                    this.showToast('Prompt is empty!', 'error');
                    return;
                }

                if (aiResponse1.trim() !== '') {
                    this._copyEvaluationContent(originalPrompt, aiResponse1, copySystemPromptButton2, 'Copied (Prompt + R1)!', systemPromptTemplate2, 'Response 1 is empty.'); 
                } else if (aiResponse2.trim() !== '') {
                    this._copyEvaluationContent(originalPrompt, aiResponse2, copySystemPromptButton2, 'Copied (Prompt + R2)!', systemPromptTemplate2, 'Response 2 is empty.');
                } else {
                    this.showToast('Both Response fields are empty!', 'error');
                }
            });

            systemPromptInputPrompt2.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'x') {
                    e.preventDefault();
                    this.showToast('Ctrl+X disabled for prompt. Use in response fields.', 'warning');
                }
            });

            systemPromptInputResponse2_1.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'x') {
                    e.preventDefault();
                    const promptText = systemPromptInputPrompt2.value;
                    const responseText = systemPromptInputResponse2_1.value;
                    this._copyEvaluationContent(promptText, responseText, copySystemPromptButton2, 'Copied (Prompt + R1)!', systemPromptTemplate2, 'Fill Prompt & Response 1');
                }
            });

            systemPromptInputResponse2_2.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'x') {
                    e.preventDefault();
                    const promptText = systemPromptInputPrompt2.value;
                    const responseText = systemPromptInputResponse2_2.value;
                    this._copyEvaluationContent(promptText, responseText, copySystemPromptButton2, 'Copied (Prompt + R2)!', systemPromptTemplate2, 'Fill Prompt & Response 2');
                }
            });
        }

        if (clearSystemPromptButton2 && systemPromptInputPrompt2 && systemPromptInputResponse2_1 && systemPromptInputResponse2_2) {
            clearSystemPromptButton2.addEventListener('click', () => {
                systemPromptInputPrompt2.value = '';
                systemPromptInputResponse2_1.value = '';
                systemPromptInputResponse2_2.value = '';
                this.showToast('Evaluation fields cleared.', 'info');
            });
        }

        // --- Third System Prompt (Content Comparison) ---
        const systemPromptInputResponseA = document.getElementById('systemPromptInputResponseA');
        const systemPromptInputResponseB = document.getElementById('systemPromptInputResponseB');
        const copySystemPromptButton3 = document.getElementById('copySystemPromptButton3');
        const clearSystemPromptButton3 = document.getElementById('clearSystemPromptButton3');

        const systemPromptTemplate3 = `You are an expert computer-science content comparator. You will be given two blocks of text, Response A and Response B. Your job is to:

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
</ResponseB>
`;

        if (copySystemPromptButton3 && systemPromptInputResponseA && systemPromptInputResponseB) {
            copySystemPromptButton3.addEventListener('click', () => {
                const responseA = systemPromptInputResponseA.value;
                const responseB = systemPromptInputResponseB.value;

                if (responseA.trim() === '') {
                    this.showToast('Response A cannot be empty.', 'error');
                    return;
                }
                if (responseB.trim() === '') {
                    this.showToast('Response B cannot be empty.', 'error');
                    return;
                }

                const generatedPrompt = systemPromptTemplate3
                    .replace('{{RESPONSE_A_PLACEHOLDER}}', responseA)
                    .replace('{{RESPONSE_B_PLACEHOLDER}}', responseB);

                if (!generatedPrompt || generatedPrompt.trim() === '') {
                    this.showToast('Cannot copy empty content', 'error');
                    return;
                }
                navigator.clipboard.writeText(generatedPrompt)
                    .then(() => {
                        this.showToast('Comparison prompt copied!', 'success');
                    })
                    .catch(err => {
                        this.fallbackCopyTextToClipboard(generatedPrompt, 'Copy Comparison Prompt', true);
                    });
            });

            systemPromptInputResponseA.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'x') {
                    e.preventDefault();
                    copySystemPromptButton3.click();
                }
            });

            systemPromptInputResponseB.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'x') {
                    e.preventDefault();
                    copySystemPromptButton3.click();
                }
            });
        }

        if (clearSystemPromptButton3 && systemPromptInputResponseA && systemPromptInputResponseB) {
            clearSystemPromptButton3.addEventListener('click', () => {
                systemPromptInputResponseA.value = '';
                systemPromptInputResponseB.value = '';
                this.showToast('Comparison fields cleared.', 'info');
            });
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