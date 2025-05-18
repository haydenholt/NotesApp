import { SystemPromptView } from '../../src/components/SystemPromptView.js';

describe('SystemPromptView Component', () => {
    let container;
    let systemPromptView;

    beforeEach(() => {
        // Set up a container for the component before each test
        document.body.innerHTML = '<div id="systemPromptViewContainer"><div id="toast-notification"><span id="toast-message"></span></div></div>';
        container = document.getElementById('systemPromptViewContainer');

        // Mock clipboard API
        global.navigator.clipboard = {
            writeText: jest.fn(() => Promise.resolve()),
        };

        // Mock document.execCommand for fallback
        document.execCommand = jest.fn(() => true);
        
        // Mock setTimeout and clearTimeout
        jest.useFakeTimers();

        // Instantiate the view here and mock showToast after instantiation
        systemPromptView = new SystemPromptView('systemPromptViewContainer');
        systemPromptView.showToast = jest.fn();
    });

    afterEach(() => {
        // Clean up the DOM
        document.body.innerHTML = '';
        container = null;
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe('Initialization and Rendering', () => {
        test('should render correctly when container element exists', () => {
            expect(container.innerHTML).not.toBe('');
            expect(container.querySelector('h1').textContent).toBe('System Prompt Generators');
            expect(container.querySelector('#systemPromptInputCode')).not.toBeNull();
            expect(container.querySelector('#copySystemPromptButton1')).not.toBeNull();
            expect(container.querySelector('#clearSystemPromptButton1')).not.toBeNull();
            expect(container.querySelector('#systemPromptInputPrompt2')).not.toBeNull();
            expect(container.querySelector('#systemPromptInputResponse2_1')).not.toBeNull();
            expect(container.querySelector('#systemPromptInputResponse2_2')).not.toBeNull();
            expect(container.querySelector('#copySystemPromptButton2')).not.toBeNull();
            expect(container.querySelector('#clearSystemPromptButton2')).not.toBeNull();
        });

        test('should log an error and not render if container element is not found', () => {
            console.error = jest.fn(); // Mock console.error
            document.body.innerHTML = ''; // Remove the container
            const tempView = new SystemPromptView('nonExistentContainer'); 
            expect(console.error).toHaveBeenCalledWith('System Prompt View container not found!');
            expect(document.body.innerHTML).toBe(''); // Nothing should be rendered
            console.error.mockRestore();
        });

        test('should render both system prompt sections with titles', () => {
            const headings = container.querySelectorAll('h2');
            expect(headings.length).toBe(2);
            expect(headings[0].textContent).toBe('Code Setup Prompt');
            expect(headings[1].textContent).toBe('Prompt/Response Evaluation Prompt');
        });

        test('copySystemPromptButton1 should have indigo background', () => {
            const copyButton1 = container.querySelector('#copySystemPromptButton1');
            expect(copyButton1.classList.contains('bg-indigo-500')).toBe(true);
        });
    });

    describe('Code Setup Prompt Functionality', () => {
        let codeInput;
        let copyButton1;
        let clearButton1;

        beforeEach(() => {
            codeInput = container.querySelector('#systemPromptInputCode');
            copyButton1 = container.querySelector('#copySystemPromptButton1');
            clearButton1 = container.querySelector('#clearSystemPromptButton1');
        });

        test('should show toast warning if code input is empty on copy button click', () => {
            codeInput.value = '';
            copyButton1.click();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Please paste code first.', 'warning');
        });

        test('should copy setup prompt to clipboard and show success toast when code is provided', async () => {
            const testCode = 'console.log("Hello");';
            codeInput.value = testCode;
            copyButton1.click();
            
            const expectedPrompt = `
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
${testCode}
</prompt>
        `.trim();

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedPrompt);
            await Promise.resolve();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Setup prompt copied!', 'success');
        });

        test('Ctrl+X in code input should trigger copy and show success toast', async () => {
            codeInput.value = 'some code';
            const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
            codeInput.dispatchEvent(event);
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
            await Promise.resolve();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Setup prompt copied!', 'success');
        });
        
        test('clear button should clear code input and show info toast', () => {
            codeInput.value = "some initial code";
            clearButton1.click();
            expect(codeInput.value).toBe('');
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Code input cleared.', 'info');
        });
    });

    describe('Prompt/Response Evaluation Prompt Functionality', () => {
        let promptInput;
        let responseInput1;
        let responseInput2;
        let copyButton2;
        let clearButton2;

        beforeEach(() => {
            promptInput = container.querySelector('#systemPromptInputPrompt2');
            responseInput1 = container.querySelector('#systemPromptInputResponse2_1');
            responseInput2 = container.querySelector('#systemPromptInputResponse2_2');
            copyButton2 = container.querySelector('#copySystemPromptButton2');
            clearButton2 = container.querySelector('#clearSystemPromptButton2');
        });

        test('should show error toast if prompt input is empty on copy button click', () => {
            promptInput.value = '';
            responseInput1.value = 'Some response';
            copyButton2.click();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Prompt is empty!', 'error');
        });

        test('should show error toast if both response inputs are empty on copy button click', () => {
            promptInput.value = 'Some prompt';
            responseInput1.value = '';
            responseInput2.value = '';
            copyButton2.click();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Both Response fields are empty!', 'error');
        });
        
        const baseExpectedPromptTemplate = `
You are a senior software engineer whose goal is to provide insightful, constructive, and technically detailed code reviews for code responses provided with a prompt. You are given a prompt and a response in an XML format:

Review the response for:
1. **Code Correctness** - Assess if the code executes correctly, handles edge cases, and produces the intended output.
2. **Instruction Following** - Ensure that the response fulfills all explicit requests in the prompt. Additionally, identify any implicit expectations that, while not stated in the prompt, would be important for a complete response.
3. **Code Efficiency** - Evaluate the efficiency of the code, suggesting improvements if applicable.
Offer a thorough evaluation for each dimension and, where applicable, provide examples to illustrate recommended improvements or corrections. Maintain a clear, friendly, and professional tone in responses, keeping feedback focused and relevant to the provided code.
4. **Code Documentation** - Check if the documentation (if present) is accurate, meaningful and reflects the code well
5. **Code Design** - Code design constitutes good programming practices such as modularity, separation of concerns, abstraction, etc. Briefly comment on how well the code adheres to good programming practices
6. ** Explanation Accuracy** - Check if the explanation is accurate. All statements should be truthful and not misleading. The changelog, if present, should accurately reflect the changes made to the code.

Try to be as concise as possible with your responses while not omitting any important call outs. Got it? I will provide you with the prompt and response now.
<prompt>
{{PROMPT_PLACEHOLDER}}
</prompt>
<response>
{{RESPONSE_PLACEHOLDER}}
</response>
        `.trim();

        test('copy button should use response 1 if filled and show success toast', async () => {
            const testPrompt = 'What is AI?';
            const testResponse1 = 'AI is artificial intelligence (R1).';
            promptInput.value = testPrompt;
            responseInput1.value = testResponse1;
            responseInput2.value = '';
            copyButton2.click();

            const expectedPrompt = baseExpectedPromptTemplate
                .replace('{{PROMPT_PLACEHOLDER}}', testPrompt)
                .replace('{{RESPONSE_PLACEHOLDER}}', testResponse1);
            
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedPrompt);
            await Promise.resolve();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Copied (Prompt + R1)!', 'success');
        });

        test('copy button should use response 2 if response 1 is empty and show success toast', async () => {
            const testPrompt = 'What is AI?';
            const testResponse2 = 'AI is advanced tech (R2).';
            promptInput.value = testPrompt;
            responseInput1.value = '';
            responseInput2.value = testResponse2;
            copyButton2.click();

            const expectedPrompt = baseExpectedPromptTemplate
                .replace('{{PROMPT_PLACEHOLDER}}', testPrompt)
                .replace('{{RESPONSE_PLACEHOLDER}}', testResponse2);

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedPrompt);
            await Promise.resolve();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Copied (Prompt + R2)!', 'success');
        });
        
        test('Ctrl+X in prompt input should show warning toast and not copy', () => {
            promptInput.value = 'Original Prompt';
            responseInput1.value = 'AI Response 1';
            const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
            promptInput.dispatchEvent(event);
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Ctrl+X disabled for prompt. Use in response fields.', 'warning');
        });

        test('Ctrl+X in response 1 input should copy prompt and response 1, then show success toast', async () => {
            const testPrompt = 'Prompt for R1';
            const testResponse1 = 'Response for R1';
            promptInput.value = testPrompt;
            responseInput1.value = testResponse1;
            const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
            responseInput1.dispatchEvent(event);
            
            const expectedPrompt = baseExpectedPromptTemplate
                .replace('{{PROMPT_PLACEHOLDER}}', testPrompt)
                .replace('{{RESPONSE_PLACEHOLDER}}', testResponse1);

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedPrompt);
            await Promise.resolve();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Copied (Prompt + R1)!', 'success');
        });
        
        test('Ctrl+X in response 1 input with empty prompt should show error toast', () => {
            promptInput.value = '';
            responseInput1.value = 'Some response';
            const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
            responseInput1.dispatchEvent(event);
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Original prompt cannot be empty.', 'error');
        });

        test('Ctrl+X in response 1 input with empty response 1 should show error toast', () => {
            promptInput.value = 'Some prompt';
            responseInput1.value = '';
            const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
            responseInput1.dispatchEvent(event);
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Fill Prompt & Response 1', 'error');
        });


        test('Ctrl+X in response 2 input should copy prompt and response 2, then show success toast', async () => {
            const testPrompt = 'Prompt for R2';
            const testResponse2 = 'Response for R2';
            promptInput.value = testPrompt;
            responseInput2.value = testResponse2;
            const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
            responseInput2.dispatchEvent(event);

            const expectedPrompt = baseExpectedPromptTemplate
                .replace('{{PROMPT_PLACEHOLDER}}', testPrompt)
                .replace('{{RESPONSE_PLACEHOLDER}}', testResponse2);

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedPrompt);
            await Promise.resolve();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Copied (Prompt + R2)!', 'success');
        });
        
        test('Ctrl+X in response 2 input with empty prompt should show error toast', () => {
            promptInput.value = '';
            responseInput2.value = 'Some response';
            const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
            responseInput2.dispatchEvent(event);
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Original prompt cannot be empty.', 'error');
        });

        test('Ctrl+X in response 2 input with empty response 2 should show error toast', () => {
            promptInput.value = 'Some prompt';
            responseInput2.value = '';
            const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
            responseInput2.dispatchEvent(event);
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Fill Prompt & Response 2', 'error');
        });

        test('clear button should clear prompt and both response inputs, then show info toast', () => {
            promptInput.value = "Original Prompt";
            responseInput1.value = "Response 1";
            responseInput2.value = "Response 2";
            clearButton2.click();
            expect(promptInput.value).toBe('');
            expect(responseInput1.value).toBe('');
            expect(responseInput2.value).toBe('');
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Evaluation fields cleared.', 'info');
        });
    });
    
    describe('Clipboard Fallback Functionality', () => {
        let codeInput;
        let copyButton1;

        beforeEach(() => {
            codeInput = container.querySelector('#systemPromptInputCode');
            copyButton1 = container.querySelector('#copySystemPromptButton1');
            
            // Mock clipboard API to fail
            global.navigator.clipboard.writeText = jest.fn(() => Promise.reject(new Error('Clipboard write failed')));
            
            // Spy on the fallback method - already part of systemPromptView instance
            document.execCommand = jest.fn(() => true); // Reset for this suite, as it might be changed by other tests
        });

        test('should use fallback copy and show warning/success toast if navigator.clipboard.writeText fails', async () => {
            codeInput.value = 'test code for fallback';
            copyButton1.click();
            
            await Promise.resolve().then().then(); // Allow microtasks (promises) to settle

            expect(document.execCommand).toHaveBeenCalledWith('copy');
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Fallback copy success, but an error occurred initially.', 'warning');
        });

        test('should show error toast if fallback also fails', async () => {
            document.execCommand = jest.fn(() => false); // Mock fallback failure

            codeInput.value = 'test code for fallback failure';
            copyButton1.click();

            await Promise.resolve().then().then(); 
            
            expect(document.execCommand).toHaveBeenCalledWith('copy'); // Still called
            expect(systemPromptView.showToast).toHaveBeenCalledWith('Copy Failed (Fallback).', 'error');
        });
    });
}); 