/**
 * Enhanced Diff tool for comparing two text blocks with jsdiff library
 * Uses global Diff object from CDN
 */
export class DiffTool {
    constructor(themeManager = null) {
        this.themeManager = themeManager;
        this.originalTextArea = document.getElementById('originalText');
        this.modifiedTextArea = document.getElementById('modifiedText');
        this.clearButton = document.getElementById('clearDiffButton');
        this.resultContainer = document.getElementById('diffResult');
        this.diffModeSelect = document.getElementById('diffMode');
        
        // Apply theme styling to clear button
        this.updateButtonStyling();
        
        // Listen for theme changes
        document.addEventListener('themeChanged', (event) => {
            // Store scroll position from the event or get current position
            const scrollPosition = event.detail?.scrollPosition ?? (window.pageYOffset || document.documentElement.scrollTop);
            
            this.updateButtonStyling();
            
            // Restore scroll position after styling updates
            requestAnimationFrame(() => {
                window.scrollTo(0, scrollPosition);
            });
        });
        
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
    
    updateButtonStyling() {
        if (this.themeManager && this.clearButton) {
            // Match the exact styling of system prompt buttons
            const buttonColors = this.themeManager.getColors('button').primary;
            const classes = this.themeManager.combineClasses(
                buttonColors.bg,
                buttonColors.hover,
                buttonColors.text,
                'py-2 px-4 rounded-md font-medium text-sm transition-colors focus:outline-none'
            );
            this.clearButton.className = classes;
        }
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
        const summary = this.generateDiffSummary(original, modified, diffMode);
        
        this.resultContainer.innerHTML = summary + diffResult;
    }
    
    /**
     * Generate diff based on the selected mode using jsdiff library
     */
    generateDiff(original, modified, mode = 'line') {
        switch (mode) {
            case 'character':
                return this.generateCharacterDiffJS(original, modified);
            case 'word':
                return this.generateWordDiffJS(original, modified);
            case 'token':
                return this.generateTokenDiffJS(original, modified);
            case 'line':
            default:
                return this.generateLineDiffJS(original, modified);
        }
    }
    
    /**
     * Generate a git-style diff summary with hunk headers
     */
    generateDiffSummary(original, modified, mode = 'line') {
        if (original === modified) {
            const diffClasses = this.themeManager?.getDiffClasses();
            return `<div class="${diffClasses?.noDiff || 'bg-gray-100 border border-gray-300 rounded-md p-3 mb-4 text-sm text-gray-600'}">No differences found</div>`;
        }
        
        // Only generate detailed hunk headers for line mode
        if (mode === 'line') {
            return this.generateLineHunkHeaders(original, modified);
        }
        
        // For other modes, generate a simple summary using jsdiff
        return this.generateSimpleDiffSummaryJS(original, modified, mode);
    }
    
    /**
     * Generate git-style hunk headers for line mode using jsdiff
     */
    generateLineHunkHeaders(original, modified) {
        const changes = Diff.diffLines(original, modified);
        
        if (!changes.some(change => change.added || change.removed)) {
            const diffClasses = this.themeManager?.getDiffClasses();
            return `<div class="${diffClasses?.noDiff || 'bg-gray-100 border border-gray-300 rounded-md p-3 mb-4 text-sm text-gray-600'}">No differences found</div>`;
        }
        
        const hunks = this.generateHunksFromJSDiff(changes);
        
        if (hunks.length === 0) {
            const diffClasses = this.themeManager?.getDiffClasses();
            return `<div class="${diffClasses?.noDiff || 'bg-gray-100 border border-gray-300 rounded-md p-3 mb-4 text-sm text-gray-600'}">No differences found</div>`;
        }
        
        const diffClasses = this.themeManager?.getDiffClasses();
        let summaryHtml = `<div class="${diffClasses?.summary || 'bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 text-sm'}">`;
        summaryHtml += `<div class="${diffClasses?.summaryTitle || 'font-medium mb-2'}">Diff Summary:</div>`;
        
        hunks.forEach(hunk => {
            summaryHtml += `<div class="${diffClasses?.summaryText || 'font-mono'}">${hunk.header}</div>`;
        });
        
        summaryHtml += '</div>';
        return summaryHtml;
    }
    
    /**
     * Generate simple summary for non-line modes using jsdiff
     */
    generateSimpleDiffSummaryJS(original, modified, mode) {
        let changes;
        if (mode === 'character') {
            changes = Diff.diffChars(original, modified);
        } else if (mode === 'word') {
            changes = Diff.diffWords(original, modified);
        } else {
            changes = Diff.diffLines(original, modified);
        }
        
        let additions = 0, deletions = 0;
        changes.forEach(change => {
            if (change.added) additions += change.count || 1;
            if (change.removed) deletions += change.count || 1;
        });
        
        const diffClasses = this.themeManager?.getDiffClasses();
        let summaryHtml = `<div class="${diffClasses?.summary || 'bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 text-sm'}">`;
        summaryHtml += `<div class="${diffClasses?.summaryTitle || 'font-medium mb-2'}">Diff Summary:</div>`;
        summaryHtml += `<div class="${diffClasses?.summaryText || 'font-mono'}">${mode.charAt(0).toUpperCase() + mode.slice(1)} mode: +${additions} -${deletions} changes</div>`;
        summaryHtml += '</div>';
        
        return summaryHtml;
    }
    
    /**
     * Generate hunks with headers from jsdiff changes
     */
    generateHunksFromJSDiff(changes) {
        const hunks = [];
        let originalLineNum = 1;
        let modifiedLineNum = 1;
        let currentHunkStart = null;
        let hunkOriginalLines = 0;
        let hunkModifiedLines = 0;
        
        changes.forEach((change, index) => {
            const lineCount = change.count || 1;
            
            if (change.added || change.removed) {
                // Start a new hunk if this is the first change
                if (currentHunkStart === null) {
                    currentHunkStart = {
                        originalStart: originalLineNum,
                        modifiedStart: modifiedLineNum,
                        changes: 0
                    };
                    hunkOriginalLines = 0;
                    hunkModifiedLines = 0;
                }
                
                currentHunkStart.changes++;
            }
            
            // Update line counts based on change type
            if (change.added) {
                hunkModifiedLines += lineCount;
                modifiedLineNum += lineCount;
            } else if (change.removed) {
                hunkOriginalLines += lineCount;
                originalLineNum += lineCount;
            } else {
                // Equal lines
                hunkOriginalLines += lineCount;
                hunkModifiedLines += lineCount;
                originalLineNum += lineCount;
                modifiedLineNum += lineCount;
                
                // End current hunk if we have accumulated changes
                if (currentHunkStart !== null && index === changes.length - 1) {
                    hunks.push({
                        header: `@@ -${currentHunkStart.originalStart},${hunkOriginalLines} +${currentHunkStart.modifiedStart},${hunkModifiedLines} @@`,
                        originalStart: currentHunkStart.originalStart,
                        originalCount: hunkOriginalLines,
                        modifiedStart: currentHunkStart.modifiedStart,
                        modifiedCount: hunkModifiedLines
                    });
                    currentHunkStart = null;
                }
            }
        });
        
        // Add the final hunk if it exists
        if (currentHunkStart !== null) {
            hunks.push({
                header: `@@ -${currentHunkStart.originalStart},${hunkOriginalLines} +${currentHunkStart.modifiedStart},${hunkModifiedLines} @@`,
                originalStart: currentHunkStart.originalStart,
                originalCount: hunkOriginalLines,
                modifiedStart: currentHunkStart.modifiedStart,
                modifiedCount: hunkModifiedLines
            });
        }
        
        return hunks;
    }
    
    /**
     * Line-by-line diff using jsdiff library
     */
    generateLineDiffJS(original, modified) {
        const changes = Diff.diffLines(original, modified);
        
        let output = '';
        
        changes.forEach(change => {
            const lines = change.value.split('\n');
            // Remove the last empty line if it exists
            if (lines[lines.length - 1] === '') {
                lines.pop();
            }
            
            lines.forEach(line => {
                const diffClasses = this.themeManager?.getDiffClasses();
                if (change.added) {
                    const addedLine = diffClasses?.added.line || 'bg-green-50 border-l-2 border-green-300 pl-2';
                    const addedText = diffClasses?.added.text || 'bg-green-200 font-medium';
                    output += `<div class="${addedLine}"><span class="${addedText}">${this.escapeHtml(line)}</span></div>`;
                } else if (change.removed) {
                    const removedLine = diffClasses?.removed.line || 'bg-red-50 border-l-2 border-red-300 pl-2';
                    const removedText = diffClasses?.removed.text || 'bg-red-200 font-medium line-through';
                    output += `<div class="${removedLine}"><span class="${removedText}">${this.escapeHtml(line)}</span></div>`;
                } else {
                    output += `<div>${this.escapeHtml(line)}</div>`;
                }
            });
        });
        
        return output;
    }
    
    /**
     * Word-level diff using jsdiff library
     */
    generateWordDiffJS(original, modified) {
        const changes = Diff.diffWords(original, modified);
        
        let output = '<div class="font-mono text-sm leading-relaxed whitespace-pre-wrap">';
        
        changes.forEach(change => {
            if (change.added) {
                output += `<span class="bg-green-200 font-medium px-1">${this.escapeHtml(change.value)}</span>`;
            } else if (change.removed) {
                output += `<span class="bg-red-200 font-medium line-through px-1">${this.escapeHtml(change.value)}</span>`;
            } else {
                output += this.escapeHtml(change.value);
            }
        });
        
        output += '</div>';
        return output;
    }
    
    /**
     * Character-level diff using jsdiff library
     */
    generateCharacterDiffJS(original, modified) {
        const changes = Diff.diffChars(original, modified);
        
        let output = '<div class="font-mono text-sm leading-relaxed whitespace-pre-wrap">';
        
        changes.forEach(change => {
            if (change.added) {
                output += `<span class="bg-green-200 font-medium">${this.escapeHtml(change.value)}</span>`;
            } else if (change.removed) {
                output += `<span class="bg-red-200 font-medium line-through">${this.escapeHtml(change.value)}</span>`;
            } else {
                output += this.escapeHtml(change.value);
            }
        });
        
        output += '</div>';
        return output;
    }
    
    /**
     * Token-level diff using jsdiff with custom tokenization
     */
    generateTokenDiffJS(original, modified) {
        // Use jsdiff's sentence diff as a base and combine with custom tokenization
        const originalTokens = this.tokenizeCode(original);
        const modifiedTokens = this.tokenizeCode(modified);
        
        // Create a custom diff by rejoining tokens and using word diff
        const originalText = originalTokens.join('');
        const modifiedText = modifiedTokens.join('');
        
        // Use word diff but with better boundaries for code
        const changes = Diff.diffWordsWithSpace(originalText, modifiedText);
        
        let output = '<div class="font-mono text-sm leading-relaxed whitespace-pre-wrap">';
        
        changes.forEach(change => {
            if (change.added) {
                output += `<span class="bg-green-200 font-medium">${this.escapeHtml(change.value)}</span>`;
            } else if (change.removed) {
                output += `<span class="bg-red-200 font-medium line-through">${this.escapeHtml(change.value)}</span>`;
            } else {
                output += this.escapeHtml(change.value);
            }
        });
        
        output += '</div>';
        return output;
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