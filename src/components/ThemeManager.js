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
                // Dark theme will be implemented later
                // For now, we'll keep the same structure but with dark colors
                background: {
                    primary: 'bg-gray-900',
                    secondary: 'bg-gray-800',
                    tertiary: 'bg-gray-700',
                    overlay: 'bg-gray-800',
                    card: 'bg-gray-800'
                },
                
                text: {
                    primary: 'text-gray-100',
                    secondary: 'text-gray-300',
                    tertiary: 'text-gray-400',
                    muted: 'text-gray-500',
                    lighter: 'text-gray-600',
                    inverse: 'text-gray-900'
                },
                
                border: {
                    primary: 'border-gray-600',
                    secondary: 'border-gray-500',
                    light: 'border-gray-700',
                    focus: 'border-blue-400'
                },
                
                button: {
                    primary: {
                        bg: 'bg-blue-600',
                        hover: 'hover:bg-blue-700',
                        text: 'text-white'
                    },
                    secondary: {
                        bg: 'bg-gray-700',
                        hover: 'hover:bg-gray-600',
                        text: 'text-gray-200'
                    },
                    success: {
                        bg: 'bg-green-800',
                        hover: 'hover:bg-green-700',
                        text: 'text-green-200',
                        border: 'border-green-600'
                    },
                    danger: {
                        bg: 'bg-red-800',
                        hover: 'hover:bg-red-700',
                        text: 'text-red-200',
                        border: 'border-red-600'
                    }
                },
                
                status: {
                    success: 'text-green-400',
                    error: 'text-red-400',
                    warning: 'text-yellow-400',
                    info: 'text-blue-400'
                },
                
                navigation: {
                    bg: 'bg-gray-900',
                    text: 'text-gray-400',
                    textHover: 'hover:text-gray-300',
                    textActive: 'text-blue-400',
                    border: 'border-gray-700'
                },
                
                form: {
                    input: {
                        bg: 'bg-gray-800',
                        border: 'border-gray-600',
                        borderFocus: 'focus:border-blue-400',
                        text: 'text-gray-100',
                        placeholder: 'placeholder-gray-500'
                    },
                    label: 'text-gray-300'
                },
                
                timer: {
                    active: 'text-green-400',
                    inactive: 'text-gray-300'
                },
                
                calendar: {
                    weekday: 'text-gray-300',
                    weekend: 'text-gray-600',
                    selectedWeek: 'font-bold',
                    dayOff: 'text-gray-500'
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
        // Add theme class to document body for CSS-based theming
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${this.currentTheme}`);
        
        // Trigger custom event for components to react to theme change
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: {
                theme: this.currentTheme,
                colors: this.getCurrentTheme()
            }
        }));
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
}

export default ThemeManager;