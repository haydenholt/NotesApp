/**
 * ThemeManager class for managing application themes
 * Provides centralized color management and theme switching capabilities
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themes = {
            light: {
                // Background colors
                background: {
                    primary: 'bg-white',
                    secondary: 'bg-gray-50',
                    tertiary: 'bg-gray-100',
                    overlay: 'bg-white',
                    card: 'bg-white'
                },
                
                // Text colors
                text: {
                    primary: 'text-gray-900',
                    secondary: 'text-gray-700',
                    tertiary: 'text-gray-600',
                    muted: 'text-gray-500',
                    lighter: 'text-gray-400',
                    inverse: 'text-white'
                },
                
                // Border colors
                border: {
                    primary: 'border-gray-200',
                    secondary: 'border-gray-300',
                    light: 'border-gray-100',
                    focus: 'border-blue-500'
                },
                
                // Button colors
                button: {
                    primary: {
                        bg: 'bg-blue-500',
                        hover: 'hover:bg-blue-600',
                        text: 'text-white'
                    },
                    secondary: {
                        bg: 'bg-gray-200',
                        hover: 'hover:bg-gray-300',
                        text: 'text-gray-700'
                    },
                    success: {
                        bg: 'bg-green-100',
                        hover: 'hover:bg-green-200',
                        text: 'text-green-700',
                        border: 'border-green-200'
                    },
                    danger: {
                        bg: 'bg-red-100',
                        hover: 'hover:bg-red-100',
                        text: 'text-red-700',
                        border: 'border-red-100'
                    }
                },
                
                // Status colors
                status: {
                    success: 'text-green-600',
                    error: 'text-red-600',
                    warning: 'text-yellow-600',
                    info: 'text-blue-600'
                },
                
                // Note states
                note: {
                    completed: 'bg-gray-50',
                    cancelled: 'bg-red-50',
                    cancelledText: 'text-red-600',
                    cancelledNumber: 'text-red-600'
                },
                
                // Navigation colors
                navigation: {
                    bg: 'bg-white',
                    text: 'text-gray-600',
                    textHover: 'hover:text-gray-700',
                    textActive: 'text-blue-600',
                    border: 'border-gray-200'
                },
                
                // Form colors
                form: {
                    input: {
                        bg: 'bg-white',
                        border: 'border-gray-300',
                        borderFocus: 'focus:border-blue-500',
                        text: 'text-gray-900',
                        placeholder: 'placeholder-gray-500'
                    },
                    label: 'text-gray-700'
                },
                
                // Special component colors
                timer: {
                    active: 'text-green-600',
                    inactive: 'text-gray-700'
                },
                
                // Calendar colors
                calendar: {
                    weekday: 'text-gray-700',
                    weekend: 'text-gray-400',
                    selectedWeek: 'font-bold',
                    dayOff: 'text-gray-500'
                },
                
                // Shadow colors
                shadow: {
                    sm: 'shadow-sm',
                    md: 'shadow-md',
                    lg: 'shadow-lg',
                    xl: 'shadow-xl'
                }
            },
            
            dark: {
                // Dark gray theme for better readability
                background: {
                    primary: 'bg-gray-800',    // Main background - dark gray instead of black
                    secondary: 'bg-gray-700',  // Secondary surfaces
                    tertiary: 'bg-gray-600',   // Tertiary surfaces
                    overlay: 'bg-gray-900',    // Overlays and modals
                    card: 'bg-gray-700'        // Cards and containers
                },
                
                text: {
                    primary: 'text-gray-100',     // Main text - very light gray
                    secondary: 'text-gray-200',   // Secondary text
                    tertiary: 'text-gray-300',    // Tertiary text
                    muted: 'text-gray-400',       // Muted text
                    lighter: 'text-gray-500',     // Very muted text
                    inverse: 'text-gray-900'      // Dark text on light backgrounds
                },
                
                border: {
                    primary: 'border-gray-600',   // Main borders
                    secondary: 'border-gray-500', // Secondary borders
                    light: 'border-gray-600',     // Light borders
                    focus: 'border-blue-400'      // Focus borders
                },
                
                button: {
                    primary: {
                        bg: 'bg-blue-600',
                        hover: 'hover:bg-blue-500',
                        text: 'text-white'
                    },
                    secondary: {
                        bg: 'bg-gray-600',
                        hover: 'hover:bg-gray-500',
                        text: 'text-gray-100'
                    },
                    success: {
                        bg: 'bg-green-100',          // Keep light mode green
                        hover: 'hover:bg-green-200',
                        text: 'text-green-700',      // Keep light mode text
                        border: 'border-green-200'
                    },
                    danger: {
                        bg: 'bg-red-700',            // Darker red for dark theme
                        hover: 'hover:bg-red-600',
                        text: 'text-red-100',        // Light red text
                        border: 'border-red-600'
                    }
                },
                
                status: {
                    success: 'text-green-400',
                    error: 'text-red-400',
                    warning: 'text-yellow-400',
                    info: 'text-blue-400'
                },
                
                // Note states
                note: {
                    completed: 'bg-gray-700',
                    cancelled: 'bg-gray-800',
                    cancelledText: 'text-red-400',
                    cancelledNumber: 'text-red-400'
                },
                
                navigation: {
                    bg: 'bg-gray-800',
                    text: 'text-gray-300',
                    textHover: 'hover:text-gray-100',
                    textActive: 'text-blue-400',
                    border: 'border-gray-600'
                },
                
                form: {
                    input: {
                        bg: 'bg-gray-700',
                        border: 'border-gray-600',
                        borderFocus: 'focus:border-blue-400',
                        text: 'text-gray-100',
                        placeholder: 'placeholder-gray-400'
                    },
                    label: 'text-gray-200'
                },
                
                timer: {
                    active: 'text-green-400',
                    inactive: 'text-gray-200'
                },
                
                calendar: {
                    weekday: 'text-gray-200',
                    weekend: 'text-gray-500',
                    selectedWeek: 'font-bold',
                    dayOff: 'text-gray-400'
                },
                
                shadow: {
                    sm: 'shadow-sm',
                    md: 'shadow-md', 
                    lg: 'shadow-lg',
                    xl: 'shadow-xl'
                }
            }
        };
        
        // Load saved theme from localStorage
        this.loadTheme();
    }
    
    /**
     * Get the current theme object
     */
    getCurrentTheme() {
        return this.themes[this.currentTheme];
    }
    
    /**
     * Get a specific theme color category
     */
    getColors(category) {
        return this.getCurrentTheme()[category] || {};
    }
    
    /**
     * Get a specific color from a category
     */
    getColor(category, colorKey) {
        const colors = this.getColors(category);
        return colors[colorKey] || '';
    }
    
    /**
     * Get nested color (e.g., button.primary.bg)
     */
    getNestedColor(category, subcategory, colorKey) {
        const categoryColors = this.getColors(category);
        const subcategoryColors = categoryColors[subcategory] || {};
        return subcategoryColors[colorKey] || '';
    }
    
    /**
     * Switch to a different theme
     */
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            this.saveTheme();
            this.applyTheme();
        }
    }
    
    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    /**
     * Apply the current theme to the document
     */
    applyTheme() {
        // Remove any existing theme classes
        document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, '');
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        
        // Add theme class to document body for CSS-based theming
        if (this.currentTheme === 'dark') {
            document.body.classList.add('theme-dark');
            document.documentElement.classList.add('theme-dark');
        }
        
        // Apply CSS custom properties dynamically
        this.applyCSSVariables();
        
        // Trigger custom event for components to react to theme change
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: {
                theme: this.currentTheme,
                colors: this.getCurrentTheme()
            }
        }));
    }
    
    /**
     * Apply CSS custom properties based on current theme
     */
    applyCSSVariables() {
        const root = document.documentElement;
        const theme = this.getCurrentTheme();
        
        // CSS variable mapping - convert Tailwind classes to CSS values
        const cssVariables = {
            // Backgrounds
            '--bg-primary': this.tailwindToCSS(theme.background.primary),
            '--bg-secondary': this.tailwindToCSS(theme.background.secondary),
            '--bg-tertiary': this.tailwindToCSS(theme.background.tertiary),
            
            // Text colors
            '--text-primary': this.tailwindToCSS(theme.text.primary),
            '--text-secondary': this.tailwindToCSS(theme.text.secondary),
            '--text-tertiary': this.tailwindToCSS(theme.text.tertiary),
            '--text-muted': this.tailwindToCSS(theme.text.muted),
            
            // Borders
            '--border-primary': this.tailwindToCSS(theme.border.primary),
            '--border-secondary': this.tailwindToCSS(theme.border.secondary),
            
            // Navigation
            '--nav-bg': this.tailwindToCSS(theme.navigation.bg),
            '--nav-text': this.tailwindToCSS(theme.navigation.text),
            '--nav-text-hover': this.tailwindToCSS(theme.navigation.textHover),
            '--nav-text-active': this.tailwindToCSS(theme.navigation.textActive)
        };
        
        // Apply all CSS variables to document root
        Object.entries(cssVariables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }
    
    /**
     * Convert Tailwind CSS classes to actual CSS color values
     */
    tailwindToCSS(tailwindClass) {
        // Extract color from Tailwind class name
        const colorMap = {
            // Backgrounds
            'bg-white': '#ffffff',
            'bg-gray-50': '#f9fafb',
            'bg-gray-100': '#f3f4f6',
            'bg-gray-600': '#4b5563',
            'bg-gray-700': '#374151',
            'bg-gray-800': '#1f2937',
            'bg-gray-900': '#111827',
            
            // Text colors
            'text-gray-100': '#f3f4f6',
            'text-gray-200': '#e5e7eb',
            'text-gray-300': '#d1d5db',
            'text-gray-400': '#9ca3af',
            'text-gray-500': '#6b7280',
            'text-gray-600': '#4b5563',
            'text-gray-700': '#374151',
            'text-gray-800': '#1f2937',
            'text-gray-900': '#111827',
            'text-blue-400': '#60a5fa',
            'text-blue-600': '#2563eb',
            
            // Borders
            'border-gray-200': '#e5e7eb',
            'border-gray-300': '#d1d5db',
            'border-gray-500': '#6b7280',
            'border-gray-600': '#4b5563',
            
            // Hover states (extract base color)
            'hover:text-gray-100': '#f3f4f6',
            'hover:text-gray-700': '#374151'
        };
        
        return colorMap[tailwindClass] || tailwindClass;
    }
    
    /**
     * Save current theme to localStorage
     */
    saveTheme() {
        try {
            localStorage.setItem('app_theme', this.currentTheme);
        } catch (e) {
            console.error('Error saving theme:', e);
        }
    }
    
    /**
     * Load theme from localStorage
     */
    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('app_theme');
            if (savedTheme && this.themes[savedTheme]) {
                this.currentTheme = savedTheme;
            }
        } catch (e) {
            console.error('Error loading theme:', e);
        }
        
        // Apply the loaded theme
        this.applyTheme();
    }
    
    /**
     * Get all available theme names
     */
    getAvailableThemes() {
        return Object.keys(this.themes);
    }
    
    /**
     * Check if a theme exists
     */
    hasTheme(themeName) {
        return !!this.themes[themeName];
    }
    
    /**
     * Helper method to combine multiple classes
     */
    combineClasses(...classes) {
        return classes.filter(Boolean).join(' ');
    }
    
    /**
     * Helper method to get button classes for a specific type
     */
    getButtonClasses(type = 'primary', size = 'default') {
        const buttonColors = this.getColors('button')[type] || this.getColors('button').primary;
        const sizeClasses = {
            sm: 'py-1 px-2 text-sm',
            default: 'py-2 px-4',
            lg: 'py-3 px-6 text-lg'
        };
        
        return this.combineClasses(
            buttonColors.bg,
            buttonColors.hover,
            buttonColors.text,
            buttonColors.border,
            sizeClasses[size] || sizeClasses.default,
            'rounded transition-colors'
        );
    }
    
    /**
     * Helper method to get input classes
     */
    getInputClasses() {
        const inputColors = this.getColors('form').input;
        return this.combineClasses(
            inputColors.bg,
            inputColors.border,
            inputColors.borderFocus,
            inputColors.text,
            inputColors.placeholder,
            'rounded px-3 py-2 focus:outline-none focus:ring-2'
        );
    }
    
    /**
     * Helper method to get card classes
     */
    getCardClasses(variant = 'default') {
        const bg = this.getColor('background', 'card');
        const border = this.getColor('border', 'primary');
        const shadow = this.getColor('shadow', 'sm');
        
        const variants = {
            default: 'p-4 rounded-md',
            large: 'p-6 rounded-md',
            stat: 'p-4 rounded-md border-l-2'
        };
        
        return this.combineClasses(
            bg,
            border && `border ${border}`,
            shadow,
            variants[variant] || variants.default
        );
    }
    
    /**
     * Helper method to get stat card classes with accent colors
     */
    getStatCardClasses(accentColor = 'blue') {
        const bg = this.getColor('background', 'card');
        const shadow = this.getColor('shadow', 'sm');
        const accentBorder = `border-${accentColor}-300`;
        
        return this.combineClasses(
            bg,
            shadow,
            accentBorder,
            'p-4 rounded-md border-l-2'
        );
    }
    
    /**
     * Helper method to get table classes
     */
    getTableClasses() {
        const bg = this.getColor('background', 'card');
        const border = this.getColor('border', 'primary');
        const textPrimary = this.getColor('text', 'primary');
        const textSecondary = this.getColor('text', 'secondary');
        
        return {
            container: this.combineClasses(bg, 'rounded-md shadow-sm overflow-x-auto'),
            table: 'w-full text-sm',
            headerRow: this.combineClasses('border-b', border),
            headerCell: this.combineClasses('py-3 px-4 text-left font-medium', textSecondary),
            bodyRow: this.combineClasses('border-b', border),
            bodyCell: this.combineClasses('py-3 px-4', textPrimary),
            title: this.combineClasses('text-lg font-light mb-4', textPrimary)
        };
    }
    
    /**
     * Helper method to get calendar classes
     */
    getCalendarClasses() {
        const calendar = this.getColors('calendar');
        const bg = this.getColor('background', 'card');
        const border = this.getColor('border', 'primary');
        
        return {
            container: this.combineClasses(bg, 'rounded-md shadow-sm p-4'),
            weekday: calendar.weekday,
            weekend: calendar.weekend,
            selectedWeek: calendar.selectedWeek,
            dayOff: calendar.dayOff,
            border: border
        };
    }
    
    /**
     * Helper method to get text utility classes
     */
    getTextClasses() {
        return {
            primary: this.getColor('text', 'primary'),
            secondary: this.getColor('text', 'secondary'),
            tertiary: this.getColor('text', 'tertiary'),
            muted: this.getColor('text', 'muted'),
            lighter: this.getColor('text', 'lighter'),
            inverse: this.getColor('text', 'inverse')
        };
    }
    
    /**
     * Helper method to get background utility classes
     */
    getBackgroundClasses() {
        return {
            primary: this.getColor('background', 'primary'),
            secondary: this.getColor('background', 'secondary'),
            tertiary: this.getColor('background', 'tertiary'),
            overlay: this.getColor('background', 'overlay'),
            card: this.getColor('background', 'card')
        };
    }
    
    /**
     * Helper method to format numbers with theme-appropriate styling
     */
    getNumberDisplayClasses(size = 'default') {
        const textPrimary = this.getColor('text', 'primary');
        const textMuted = this.getColor('text', 'muted');
        
        const sizes = {
            large: 'text-2xl font-light',
            default: 'text-lg font-medium',
            small: 'text-sm'
        };
        
        return {
            number: this.combineClasses(sizes[size] || sizes.default, textPrimary),
            unit: this.combineClasses('ml-1 text-sm', textMuted)
        };
    }
    
    /**
     * Helper method to get label classes for forms and displays
     */
    getLabelClasses(variant = 'default') {
        const textMuted = this.getColor('text', 'muted');
        
        const variants = {
            default: 'text-sm',
            uppercase: 'text-xs uppercase tracking-wider',
            large: 'text-base font-medium',
            small: 'text-xs'
        };
        
        return this.combineClasses(
            variants[variant] || variants.default,
            textMuted
        );
    }
    
    /**
     * Helper method to get form state classes
     */
    getFormStateClasses() {
        return {
            disabled: {
                text: this.getColor('text', 'muted'),
                background: this.getColor('background', 'secondary'),
                border: this.getColor('border', 'primary')
            },
            enabled: {
                text: this.getColor('text', 'primary'),
                background: this.getColor('background', 'card'),
                border: this.getColor('border', 'primary')
            }
        };
    }
    
    /**
     * Helper method to get empty state / placeholder text classes
     */
    getEmptyStateClasses() {
        return {
            text: this.combineClasses('italic', this.getColor('text', 'muted')),
            container: 'w-full text-center py-8'
        };
    }
    
    /**
     * Helper method to apply disabled state to form elements
     */
    applyDisabledState(element) {
        const states = this.getFormStateClasses();
        element.disabled = true;
        const primaryTextColor = this.getColor('text', 'primary');
        if (primaryTextColor) {
            element.classList.remove(primaryTextColor);
        }
        const classesToAdd = [states.disabled.text, states.disabled.background].filter(cls => cls);
        if (classesToAdd.length > 0) {
            element.classList.add(...classesToAdd);
        }
    }
    
    /**
     * Helper method to apply enabled state to form elements
     */
    applyEnabledState(element) {
        const states = this.getFormStateClasses();
        element.disabled = false;
        const classesToRemove = [this.getColor('text', 'muted'), this.getColor('background', 'secondary')].filter(cls => cls);
        if (classesToRemove.length > 0) {
            element.classList.remove(...classesToRemove);
        }
        if (states.enabled.text) {
            element.classList.add(states.enabled.text);
        }
    }
    
    /**
     * Helper method to get diff highlight classes
     */
    getDiffClasses() {
        return {
            noDiff: this.combineClasses(
                this.getColor('background', 'secondary'),
                this.getColor('border', 'secondary'),
                this.getColor('text', 'secondary'),
                'border rounded-md p-3 mb-4 text-sm'
            ),
            summary: this.combineClasses(
                'bg-blue-50 border-blue-200',
                'border rounded-md p-3 mb-4 text-sm'
            ),
            added: {
                line: 'bg-green-50 border-l-2 border-green-300 pl-2',
                text: 'bg-green-200 font-medium'
            },
            removed: {
                line: 'bg-red-50 border-l-2 border-red-300 pl-2',
                text: 'bg-red-200 font-medium line-through'
            }
        };
    }
}

export default ThemeManager;