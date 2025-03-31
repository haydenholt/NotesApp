/**
 * Enhanced Diff tool for comparing two text blocks with improved token recognition
 */
export class DiffTool {
    constructor() {
        this.originalTextArea = document.getElementById('originalText');
        this.modifiedTextArea = document.getElementById('modifiedText');
        this.clearButton = document.getElementById('clearDiffButton');
        this.resultContainer = document.getElementById('diffResult');
        this.diffModeSelect = document.getElementById('diffMode') || this.createDiffModeSelect();
        
        // Set up event listeners
        this.clearButton.addEventListener('click', () => this.clearTexts());
        
        // Auto-compare on text change (with debounce)
        let debounceTimer;
        const debounceDelay = 500; // ms
        
        const debounceCompare = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => this.compareTexts(), debounceDelay);
        };
        
        this.originalTextArea.addEventListener('input', debounceCompare);
        this.modifiedTextArea.addEventListener('input', debounceCompare);
        if (this.diffModeSelect) {
            this.diffModeSelect.addEventListener('change', debounceCompare);
        }
    }
    
    /**
     * Creates a select element for choosing diff mode if it doesn't exist
     */
    createDiffModeSelect() {
        const select = document.createElement('select');
        select.id = 'diffMode';
        select.className = 'border rounded p-2 mb-4';
        
        const options = [
            { value: 'line', text: 'Line Mode' },
            { value: 'word', text: 'Word Mode' },
            { value: 'character', text: 'Character Mode' },
            { value: 'token', text: 'Code Token Mode' }
        ];
        
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });
        
        // Add to DOM before the clear button
        this.clearButton.parentNode.insertBefore(select, this.clearButton);
        return select;
    }
    
    clearTexts() {
        this.originalTextArea.value = '';
        this.modifiedTextArea.value = '';
        this.resultContainer.innerHTML = '';
    }
    
    compareTexts() {
        const original = this.originalTextArea.value;
        const modified = this.modifiedTextArea.value;
        const diffMode = this.diffModeSelect ? this.diffModeSelect.value : 'line';
        
        if (!original && !modified) {
            this.resultContainer.innerHTML = '<p>Enter text in both fields to see differences</p>';
            return;
        }
        
        const diffResult = this.generateDiff(original, modified, diffMode);
        this.resultContainer.innerHTML = diffResult;
    }
    
    /**
     * Generate diff based on the selected mode
     */
    generateDiff(original, modified, mode = 'line') {
        switch (mode) {
            case 'character':
                return this.generateCharacterDiff(original, modified);
            case 'word':
                return this.generateWordDiff(original, modified);
            case 'token':
                return this.generateTokenDiff(original, modified);
            case 'line':
            default:
                return this.generateLineDiff(original, modified);
        }
    }
    
    /**
     * Line-by-line diff (improved version of the original algorithm)
     */
    generateLineDiff(original, modified) {
        // Split both texts into lines
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        
        // Calculate edit script using Myers diff algorithm
        const editScript = this.myersDiff(originalLines, modifiedLines);
        
        let output = '';
        let originalIndex = 0;
        let modifiedIndex = 0;
        
        for (const edit of editScript) {
            switch (edit.operation) {
                case 'equal':
                    output += `<div>${this.escapeHtml(originalLines[originalIndex])}</div>`;
                    originalIndex++;
                    modifiedIndex++;
                    break;
                    
                case 'insert':
                    output += `<div class="bg-green-100"><span class="bg-green-200 font-bold">${this.escapeHtml(modifiedLines[modifiedIndex])}</span></div>`;
                    modifiedIndex++;
                    break;
                    
                case 'delete':
                    output += `<div class="bg-red-100"><span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalLines[originalIndex])}</span></div>`;
                    originalIndex++;
                    break;
                    
                case 'replace':
                    // For replacements, delegate to word diff for finer granularity
                    const wordDiff = this.compareWords(originalLines[originalIndex], modifiedLines[modifiedIndex]);
                    if (wordDiff.hasAdditions && wordDiff.hasRemovals) {
                        output += `<div class="bg-yellow-100">${wordDiff.html}</div>`;
                    } else if (wordDiff.hasAdditions) {
                        output += `<div class="bg-green-100">${wordDiff.html}</div>`;
                    } else if (wordDiff.hasRemovals) {
                        output += `<div class="bg-red-100">${wordDiff.html}</div>`;
                    } else {
                        output += `<div>${wordDiff.html}</div>`;
                    }
                    originalIndex++;
                    modifiedIndex++;
                    break;
            }
        }
        
        return output;
    }
    
    /**
     * Word-level diff implementation
     */
    generateWordDiff(original, modified) {
        // Split texts directly into lines and words
        const originalWords = this.tokenizeText(original, 'word');
        const modifiedWords = this.tokenizeText(modified, 'word');
        
        // Calculate diff at word level
        const editScript = this.myersDiff(originalWords, modifiedWords);
        
        let output = '<div>';
        let originalIndex = 0;
        let modifiedIndex = 0;
        
        for (const edit of editScript) {
            switch (edit.operation) {
                case 'equal':
                    output += this.escapeHtml(originalWords[originalIndex]);
                    originalIndex++;
                    modifiedIndex++;
                    break;
                    
                case 'insert':
                    output += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedWords[modifiedIndex])}</span>`;
                    modifiedIndex++;
                    break;
                    
                case 'delete':
                    output += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalWords[originalIndex])}</span>`;
                    originalIndex++;
                    break;
                    
                case 'replace':
                    // For one-word replacements, we can do character-level diff
                    if (originalWords[originalIndex].trim() && modifiedWords[modifiedIndex].trim()) {
                        const charDiff = this.compareCharacters(originalWords[originalIndex], modifiedWords[modifiedIndex]);
                        output += charDiff.html;
                    } else {
                        output += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalWords[originalIndex])}</span>`;
                        output += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedWords[modifiedIndex])}</span>`;
                    }
                    originalIndex++;
                    modifiedIndex++;
                    break;
            }
        }
        
        output += '</div>';
        return output;
    }
    
    /**
     * Character-level diff implementation
     */
    generateCharacterDiff(original, modified) {
        // Split texts into individual characters
        const originalChars = original.split('');
        const modifiedChars = modified.split('');
        
        // Calculate diff at character level
        const editScript = this.myersDiff(originalChars, modifiedChars);
        
        let output = '<div>';
        let originalIndex = 0;
        let modifiedIndex = 0;
        
        for (const edit of editScript) {
            switch (edit.operation) {
                case 'equal':
                    output += this.escapeHtml(originalChars[originalIndex]);
                    originalIndex++;
                    modifiedIndex++;
                    break;
                    
                case 'insert':
                    output += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedChars[modifiedIndex])}</span>`;
                    modifiedIndex++;
                    break;
                    
                case 'delete':
                    output += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalChars[originalIndex])}</span>`;
                    originalIndex++;
                    break;
                    
                case 'replace':
                    output += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalChars[originalIndex])}</span>`;
                    output += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedChars[modifiedIndex])}</span>`;
                    originalIndex++;
                    modifiedIndex++;
                    break;
            }
        }
        
        output += '</div>';
        return output;
    }
    
    /**
     * Token-level diff implementation for code (recognizes code tokens better)
     */
    generateTokenDiff(original, modified) {
        // Tokenize the code with awareness of programming language tokens
        const originalTokens = this.tokenizeCode(original);
        const modifiedTokens = this.tokenizeCode(modified);
        
        // Calculate diff at token level
        const editScript = this.myersDiff(originalTokens, modifiedTokens);
        
        let output = '<div class="font-mono whitespace-pre">';
        let originalIndex = 0;
        let modifiedIndex = 0;
        
        for (const edit of editScript) {
            switch (edit.operation) {
                case 'equal':
                    output += this.escapeHtml(originalTokens[originalIndex]);
                    originalIndex++;
                    modifiedIndex++;
                    break;
                    
                case 'insert':
                    output += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedTokens[modifiedIndex])}</span>`;
                    modifiedIndex++;
                    break;
                    
                case 'delete':
                    output += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalTokens[originalIndex])}</span>`;
                    originalIndex++;
                    break;
                    
                case 'replace':
                    // For small tokens, character diff might help
                    if (originalTokens[originalIndex].length < 10 && modifiedTokens[modifiedIndex].length < 10) {
                        const charDiff = this.compareCharacters(originalTokens[originalIndex], modifiedTokens[modifiedIndex]);
                        output += charDiff.html;
                    } else {
                        output += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalTokens[originalIndex])}</span>`;
                        output += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedTokens[modifiedIndex])}</span>`;
                    }
                    originalIndex++;
                    modifiedIndex++;
                    break;
            }
        }
        
        output += '</div>';
        return output;
    }

    /**
     * Implementation of Myers diff algorithm
     * Returns a list of edit operations (equal, insert, delete, replace)
     */
    myersDiff(originalArray, modifiedArray) {
        const n = originalArray.length;
        const m = modifiedArray.length;
        
        // Create edit graph
        const max = n + m;
        const v = new Array(2 * max + 1).fill(0);
        const trace = [];
        
        // Find the shortest edit path
        let x, y;
        for (let d = 0; d <= max; d++) {
            trace.push([...v]);
            
            for (let k = -d; k <= d; k += 2) {
                // Choose direction (diagonal, down, or right)
                if (k === -d || (k !== d && v[k - 1 + max] < v[k + 1 + max])) {
                    x = v[k + 1 + max]; // Move down
                } else {
                    x = v[k - 1 + max] + 1; // Move right
                }
                
                y = x - k;
                
                // Follow diagonal as far as possible
                while (x < n && y < m && originalArray[x] === modifiedArray[y]) {
                    x++;
                    y++;
                }
                
                v[k + max] = x;
                
                if (x >= n && y >= m) {
                    // Found path, build edit script
                    return this.buildEditScript(trace, originalArray, modifiedArray, n, m);
                }
            }
        }
        
        // Fallback (should not reach here with valid inputs)
        return [];
    }
    
    /**
     * Build edit script from Myers algorithm trace
     */
    buildEditScript(trace, originalArray, modifiedArray, n, m) {
        const editScript = [];
        let x = n;
        let y = m;
        
        // Start from the end and work backwards
        for (let d = trace.length - 1; d >= 0; d--) {
            const v = trace[d];
            const k = x - y;
            
            // Determine which direction we moved
            let prevK;
            if (k === -d || (k !== d && v[k - 1 + (n + m)] < v[k + 1 + (n + m)])) {
                prevK = k + 1;
            } else {
                prevK = k - 1;
            }
            
            const prevX = v[prevK + (n + m)];
            const prevY = prevX - prevK;
            
            // Add edit operations while we can
            while (x > prevX && y > prevY) {
                // Diagonal moves are matches
                editScript.unshift({
                    operation: 'equal',
                    originalIndex: x - 1,
                    modifiedIndex: y - 1
                });
                x--;
                y--;
            }
            
            if (d === 0) break;
            
            if (prevX === x) {
                // Vertical move is an insertion
                editScript.unshift({
                    operation: 'insert',
                    originalIndex: x,
                    modifiedIndex: y - 1
                });
                y--;
            } else {
                // Horizontal move is a deletion
                editScript.unshift({
                    operation: 'delete',
                    originalIndex: x - 1,
                    modifiedIndex: y
                });
                x--;
            }
        }
        
        // Convert to simpler format and detect replacements
        return this.optimizeEditScript(editScript, originalArray, modifiedArray);
    }
    
    /**
     * Optimize edit script by merging adjacent inserts and deletes into replacements
     */
    optimizeEditScript(editScript, originalArray, modifiedArray) {
        const optimized = [];
        
        for (let i = 0; i < editScript.length; i++) {
            if (i < editScript.length - 1 && 
                editScript[i].operation === 'delete' && 
                editScript[i+1].operation === 'insert') {
                
                // Convert adjacent delete+insert to replace
                optimized.push({
                    operation: 'replace',
                    originalIndex: editScript[i].originalIndex,
                    modifiedIndex: editScript[i+1].modifiedIndex
                });
                i++; // Skip the next operation as we've combined it
            } else {
                optimized.push(editScript[i]);
            }
        }
        
        return optimized;
    }
    
    /**
     * Compare words in a line (improved version)
     */
    compareWords(originalLine, modifiedLine) {
        // Split lines into words, preserving spaces
        const originalWords = originalLine.split(/(\s+)/).filter(w => w !== '');
        const modifiedWords = modifiedLine.split(/(\s+)/).filter(w => w !== '');
        
        // Use Myers diff for word comparison
        const editScript = this.myersDiff(originalWords, modifiedWords);
        
        let result = '';
        let hasAdditions = false;
        let hasRemovals = false;
        let originalIndex = 0;
        let modifiedIndex = 0;
        
        for (const edit of editScript) {
            switch (edit.operation) {
                case 'equal':
                    result += this.escapeHtml(originalWords[originalIndex]);
                    originalIndex++;
                    modifiedIndex++;
                    break;
                    
                case 'insert':
                    result += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedWords[modifiedIndex])}</span>`;
                    hasAdditions = true;
                    modifiedIndex++;
                    break;
                    
                case 'delete':
                    result += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalWords[originalIndex])}</span>`;
                    hasRemovals = true;
                    originalIndex++;
                    break;
                    
                case 'replace':
                    // For replacements, check if simple character diff would be better
                    if (!originalWords[originalIndex].match(/\s+/) && !modifiedWords[modifiedIndex].match(/\s+/)) {
                        const charDiff = this.compareCharacters(originalWords[originalIndex], modifiedWords[modifiedIndex]);
                        result += charDiff.html;
                        hasAdditions = hasAdditions || charDiff.hasAdditions;
                        hasRemovals = hasRemovals || charDiff.hasRemovals;
                    } else {
                        result += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalWords[originalIndex])}</span>`;
                        result += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedWords[modifiedIndex])}</span>`;
                        hasRemovals = true;
                        hasAdditions = true;
                    }
                    originalIndex++;
                    modifiedIndex++;
                    break;
            }
        }
        
        return { html: result, hasAdditions, hasRemovals };
    }
    
    /**
     * Compare characters in a word
     */
    compareCharacters(originalWord, modifiedWord) {
        // If one is a space and the other isn't, simple replacement
        if ((originalWord.match(/^\s+$/) && !modifiedWord.match(/^\s+$/)) || 
            (!originalWord.match(/^\s+$/) && modifiedWord.match(/^\s+$/))) {
            return {
                html: `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalWord)}</span>` +
                      `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedWord)}</span>`,
                hasAdditions: true,
                hasRemovals: true
            };
        }
        
        // Split into characters
        const originalChars = originalWord.split('');
        const modifiedChars = modifiedWord.split('');
        
        // Calculate diff at character level
        const editScript = this.myersDiff(originalChars, modifiedChars);
        
        let result = '';
        let hasAdditions = false;
        let hasRemovals = false;
        let originalIndex = 0;
        let modifiedIndex = 0;
        
        for (const edit of editScript) {
            switch (edit.operation) {
                case 'equal':
                    result += this.escapeHtml(originalChars[originalIndex]);
                    originalIndex++;
                    modifiedIndex++;
                    break;
                    
                case 'insert':
                    result += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedChars[modifiedIndex])}</span>`;
                    hasAdditions = true;
                    modifiedIndex++;
                    break;
                    
                case 'delete':
                    result += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalChars[originalIndex])}</span>`;
                    hasRemovals = true;
                    originalIndex++;
                    break;
                    
                case 'replace':
                    result += `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalChars[originalIndex])}</span>`;
                    result += `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedChars[modifiedIndex])}</span>`;
                    hasRemovals = true;
                    hasAdditions = true;
                    originalIndex++;
                    modifiedIndex++;
                    break;
            }
        }
        
        return { html: result, hasAdditions, hasRemovals };
    }
    
    /**
     * Tokenize text based on the specified mode
     */
    tokenizeText(text, mode = 'word') {
        if (mode === 'character') {
            return text.split('');
        } else if (mode === 'word') {
            // Split by spaces but preserve the spaces
            return text.split(/(\s+)/).filter(w => w !== '');
        } else {
            return text.split('\n');
        }
    }
    
    /**
     * Tokenize code into meaningful parts
     * This is more sophisticated than simple word splitting
     */
    tokenizeCode(code) {
        // This regex captures:
        // 1. Words (identifiers, keywords)
        // 2. Strings (quoted)
        // 3. Operators and punctuation
        // 4. Whitespace
        // 5. Comments
        // 6. Numbers
        const tokenRegex = /(\/\/.*?(?:\n|$)|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[a-zA-Z_]\w*|\d+(?:\.\d+)?|[ \t]+|\n|[^\w\s"']+)/g;
        
        const matches = code.match(tokenRegex) || [];
        return matches;
    }
    
    /**
     * Highlight added words in a line
     */
    highlightAddedWords(originalLine, modifiedLine) {
        if (!originalLine) {
            // Entire line is new
            return `<span class="bg-green-200 font-bold">${this.escapeHtml(modifiedLine)}</span>`;
        }
        
        // For partial additions, delegate to compareWords
        return this.compareWords(originalLine, modifiedLine).html;
    }

    /**
     * Highlight removed words in a line
     */
    highlightRemovedWords(originalLine, modifiedLine) {
        if (!modifiedLine) {
            // Entire line was removed
            return `<span class="bg-red-200 font-bold line-through">${this.escapeHtml(originalLine)}</span>`;
        }
        
        // For partial removals, delegate to compareWords
        return this.compareWords(originalLine, modifiedLine).html;
    }
    
    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

export default DiffTool;