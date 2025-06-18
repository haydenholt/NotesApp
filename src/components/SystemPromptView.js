export class SystemPromptView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error("System Prompt View container not found!");
            return;
        }
        this.render();
        this.initializeSystemPromptHandlers();
    }

    render() {
        this.container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-lg font-bold text-gray-800">System Prompt Generators</h1>
                    <button class="helpButton text-gray-500 hover:text-gray-700 text-xl font-bold bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors" title="Show keyboard shortcuts">?</button>
                </div>

                <!-- System Prompt for Code Setup -->
                <div class="bg-white shadow-sm border border-gray-200 rounded-md p-6 mb-6">
                    <h2 class="text-lg font-medium mb-4 text-gray-700">Code Setup Prompt</h2>
                    <textarea id="systemPromptInputCode" class="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Paste your code here..."></textarea>
                    <div class="mt-6 flex gap-3 justify-between">
                        <button id="copySystemPromptButton1" class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Copy Setup Prompt
                        </button>
                        <button id="clearSystemPromptButton1" class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Clear
                        </button>
                    </div>
                </div>

                <!-- System Prompt for Prompt/Response Evaluation -->
                <div class="bg-white shadow-sm border border-gray-200 rounded-md p-6">
                    <h2 class="text-lg font-medium mb-4 text-gray-700">Prompt/Response Evaluation Prompt</h2>

                    <div class="mb-4">
                        <label for="systemPromptInputPrompt2" class="block text-sm font-medium text-gray-700 mb-2">Original Prompt to AI:</label>
                        <textarea id="systemPromptInputPrompt2" class="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Paste the original prompt..."></textarea>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label for="systemPromptInputResponse2_1" class="block text-sm font-medium text-gray-700 mb-2">AI's Response 1:</label>
                            <textarea id="systemPromptInputResponse2_1" class="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Paste AI's first response..."></textarea>
                        </div>
                        <div>
                            <label for="systemPromptInputResponse2_2" class="block text-sm font-medium text-gray-700 mb-2">AI's Response 2:</label>
                            <textarea id="systemPromptInputResponse2_2" class="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Paste AI's second response..."></textarea>
                        </div>
                    </div>
                    <div class="flex gap-3 justify-between">
                        <button id="copySystemPromptButton2" class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                            Copy Evaluation Prompt
                        </button>
                        <button id="clearSystemPromptButton2" class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
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
        toastElement.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500'); // Remove existing color classes

        if (type === 'success') {
            toastElement.classList.add('bg-green-500');
        } else if (type === 'error') {
            toastElement.classList.add('bg-red-500');
        } else if (type === 'warning') {
            toastElement.classList.add('bg-yellow-500'); // Or another color for warning
        } else if (type === 'info') {
            toastElement.classList.add('bg-blue-500');
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
You are a senior software engineer whose goal is to provide insightful, constructive, and technically detailed code reviews for code responses provided with a prompt. You are given a prompt and a response in an XML format:

Review the response for:
1. **Code Correctness** - Assess if the code executes correctly, handles edge cases, and produces the intended output.
2. **Instruction Following** - Ensure that the response fulfills all explicit requests in the prompt. Additionally, identify any implicit expectations that, while not stated in the prompt, would be important for a complete response.
3. **Code Efficiency** - Evaluate the efficiency of the code, suggesting improvements if applicable.
Offer a thorough evaluation for each dimension and, where applicable, provide examples to illustrate recommended improvements or corrections. Maintain a clear, friendly, and professional tone in responses, keeping feedback focused and relevant to the provided code.
4. **Code Documentation** - Check if the documentation (if present) is accurate, meaningful and reflects the code well
5. **Code Design** - Code design constitutes good programming practices such as modularity, separation of concerns, abstraction, etc. Briefly comment on how well the code adheres to good programming practices
6. **Explanation Accuracy** - Check if the explanation is accurate. All statements should be truthful and not misleading. The changelog, if present, should accurately reflect the changes made to the code.

Try to be as concise as possible with your responses while not omitting any important call outs. Be very critical in your evaluation, and provide a summary of the biggest flaws at the end. Got it? I will provide you with the prompt and response now.
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