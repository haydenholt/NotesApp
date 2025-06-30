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
                        borderFocus: '',
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
                    primary: 'bg-neutral-800',    // Main background - neutral dark gray
                    secondary: 'bg-neutral-700',  // Secondary surfaces - neutral gray
                    tertiary: 'bg-neutral-600',   // Tertiary surfaces - neutral gray
                    overlay: 'bg-neutral-900',    // Overlays and modals
                    card: 'bg-neutral-700'        // Cards and containers - neutral gray
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
                    primary: 'border-neutral-600',   // Main borders
                    secondary: 'border-neutral-500', // Secondary borders
                    light: 'border-neutral-600',     // Light borders
                    focus: 'border-blue-400'         // Focus borders - keep blue for accent
                },
                
                button: {
                    primary: {
                        bg: 'bg-blue-600',
                        hover: 'hover:bg-blue-500',
                        text: 'text-white'
                    },
                    secondary: {
                        bg: 'bg-neutral-600',
                        hover: 'hover:bg-neutral-500',
                        text: 'text-gray-100'
                    },
                    success: {
                        bg: 'bg-green-700',          // Dark mode success background
                        hover: 'hover:bg-green-600',
                        text: 'text-green-100',      // Light text on dark background
                        border: 'border-green-600'
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
                    completed: 'bg-neutral-700',
                    cancelled: 'bg-neutral-800',
                    cancelledText: 'text-red-400',
                    cancelledNumber: 'text-red-400'
                },
                
                navigation: {
                    bg: 'bg-neutral-800',
                    text: 'text-gray-300',
                    textHover: 'hover:text-gray-100',
                    textActive: 'text-blue-400',
                    border: 'border-neutral-600'
                },
                
                form: {
                    input: {
                        bg: 'bg-neutral-700',
                        border: 'border-neutral-600',
                        borderFocus: '',
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
            '--bg-card': this.tailwindToCSS(theme.background.card),
            
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
            '--nav-text-active': this.tailwindToCSS(theme.navigation.textActive),
            
            // Buttons
            '--btn-primary-bg': this.tailwindToCSS(theme.button.primary.bg),
            '--btn-primary-hover': this.tailwindToCSS(theme.button.primary.bg).replace('bg-', 'hover:bg-'),
            '--btn-primary-text': this.tailwindToCSS(theme.button.primary.text),
            '--btn-secondary-bg': this.tailwindToCSS(theme.button.secondary.bg),
            '--btn-secondary-hover': this.tailwindToCSS(theme.button.secondary.bg).replace('bg-', 'hover:bg-'),
            '--btn-secondary-text': this.tailwindToCSS(theme.button.secondary.text),
            
            // Form elements
            '--input-bg': this.tailwindToCSS(theme.form.input.bg),
            '--input-border': this.tailwindToCSS(theme.form.input.border),
            '--input-text': this.tailwindToCSS(theme.form.input.text),
            
            // Status colors
            '--status-info': this.tailwindToCSS(theme.status.info),
            '--status-success': this.tailwindToCSS(theme.status.success),
            '--status-warning': this.tailwindToCSS(theme.status.warning),
            '--status-error': this.tailwindToCSS(theme.status.error)
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
        // Handle hover states by extracting the base color
        if (tailwindClass.startsWith('hover:')) {
            return this.tailwindToCSS(tailwindClass.replace('hover:', ''));
        }
        
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
            
            // Neutral backgrounds (true grey, no blue undertones)
            'bg-neutral-400': '#a3a3a3',
            'bg-neutral-500': '#737373',
            'bg-neutral-600': '#525252',
            'bg-neutral-700': '#404040',
            'bg-neutral-800': '#262626',
            'bg-neutral-900': '#171717',
            
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
            
            // Borders
            'border-gray-200': '#e5e7eb',
            'border-gray-300': '#d1d5db',
            'border-gray-400': '#9ca3af',
            'border-gray-500': '#6b7280',
            'border-gray-600': '#4b5563',
            
            // Neutral borders (true grey, no blue undertones)
            'border-neutral-500': '#737373',
            'border-neutral-600': '#525252',
            
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
        const focusClasses = this.getFocusClasses();
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
            'rounded font-medium transition-colors',
            focusClasses.ring
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
            'rounded px-3 py-2 focus:outline-none'
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
    getStatCardClasses(accentColor = 'neutral') {
        const bg = this.getColor('background', 'card');
        const shadow = this.getColor('shadow', 'sm');
        
        // Use neutral colors by default, allow specific colors for semantic purposes
        const accentMap = {
            neutral: this.currentTheme === 'dark' ? 'border-neutral-500' : 'border-gray-300',
            success: 'border-green-300',
            warning: 'border-yellow-300',
            error: 'border-red-300',
            info: this.currentTheme === 'dark' ? 'border-blue-400' : 'border-blue-400'
        };
        
        const accentBorder = accentMap[accentColor] || accentMap.neutral;
        
        return this.combineClasses(
            bg,
            shadow,
            accentBorder,
            'p-2 sm:p-4 rounded-md border-l-2'
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
     * Helper method to get focus ring classes - very subtle focus styling
     */
    getFocusClasses() {
        return {
            ring: `focus:ring-0`,
            border: `focus:outline-none`,
            combined: `focus:outline-none`
        };
    }
    
    /**
     * Helper method to get primary action button classes
     */
    getPrimaryButtonClasses(size = 'default') {
        const buttonColors = this.getColors('button').primary;
        const sizeClasses = {
            sm: 'py-1 px-2 text-sm',
            default: 'py-2 px-4',
            lg: 'py-3 px-6 text-lg'
        };
        
        return this.combineClasses(
            buttonColors.bg,
            buttonColors.hover,
            buttonColors.text,
            sizeClasses[size] || sizeClasses.default,
            'rounded font-medium transition-colors focus:outline-none',
            this.getFocusClasses().ring
        );
    }
    
    /**
     * Helper method to get secondary action button classes
     */
    getSecondaryButtonClasses(size = 'default') {
        const buttonColors = this.getColors('button').secondary;
        const sizeClasses = {
            sm: 'py-1 px-2 text-sm',
            default: 'py-2 px-4',
            lg: 'py-3 px-6 text-lg'
        };
        
        return this.combineClasses(
            buttonColors.bg,
            buttonColors.hover,
            buttonColors.text,
            sizeClasses[size] || sizeClasses.default,
            'rounded font-medium transition-colors focus:outline-none',
            this.getFocusClasses().ring
        );
    }
    
    /**
     * Helper method to get form input classes with proper theming
     */
    getInputClasses(variant = 'default') {
        const inputColors = this.getColors('form').input;
        const focusClasses = this.getFocusClasses();
        
        const variants = {
            default: 'px-3 py-2 rounded-md border text-sm',
            large: 'px-4 py-3 rounded-md border text-base',
            small: 'px-2 py-1 rounded-md border text-xs'
        };
        
        return this.combineClasses(
            inputColors.bg,
            inputColors.border,
            inputColors.text,
            inputColors.placeholder,
            variants[variant] || variants.default,
            focusClasses.combined,
            'transition-colors'
        );
    }
    
    /**
     * Helper method to get select dropdown classes
     */
    getSelectClasses(variant = 'default') {
        const inputColors = this.getColors('form').input;
        const focusClasses = this.getFocusClasses();
        
        return this.combineClasses(
            inputColors.bg,
            inputColors.border,
            inputColors.text,
            'px-3 py-2 rounded-md border text-sm',
            focusClasses.combined,
            'transition-colors appearance-none'
        );
    }
    
    /**
     * Helper method to get textarea classes
     */
    getTextareaClasses(variant = 'default') {
        const inputColors = this.getColors('form').input;
        const focusClasses = this.getFocusClasses();
        
        const variants = {
            default: 'px-3 py-2 rounded-md border text-sm resize-y',
            large: 'px-4 py-3 rounded-md border text-base resize-y',
            code: 'px-3 py-2 rounded-md border text-sm font-mono resize-y'
        };
        
        return this.combineClasses(
            inputColors.bg,
            inputColors.border,
            inputColors.text,
            inputColors.placeholder,
            variants[variant] || variants.default,
            focusClasses.combined,
            'transition-colors'
        );
    }
    
    /**
     * Helper method to get search input classes
     */
    getSearchInputClasses() {
        const inputColors = this.getColors('form').input;
        const focusClasses = this.getFocusClasses();
        
        return this.combineClasses(
            inputColors.bg,
            inputColors.border,
            inputColors.text,
            inputColors.placeholder,
            'px-3 py-2 rounded-lg border text-sm w-52',
            focusClasses.combined,
            'transition-colors'
        );
    }
    
    /**
     * Helper method to get navigation button classes
     */
    getNavButtonClasses(isActive = false) {
        const navColors = this.getColors('navigation');
        const baseClasses = 'px-3 py-2 rounded-md text-sm font-medium transition-colors';
        
        if (isActive) {
            return this.combineClasses(
                baseClasses,
                navColors.textActive,
                this.getColor('background', 'secondary')
            );
        }
        
        return this.combineClasses(
            baseClasses,
            navColors.text,
            navColors.textHover
        );
    }
    
    /**
     * Helper method to get status indicator classes
     */
    getStatusClasses(status = 'info') {
        const statusColors = this.getColors('status');
        return statusColors[status] || statusColors.info;
    }
    
    /**
     * Helper method to get progress bar classes
     */
    getProgressBarClasses() {
        const bg = this.getColor('background', 'secondary');
        // Use blue colors for progress bars
        const fill = this.currentTheme === 'dark' ? 'bg-blue-400' : 'bg-blue-500';
        
        return {
            container: this.combineClasses(bg, 'w-full h-2 rounded-full overflow-hidden'),
            fill: this.combineClasses(fill, 'h-full transition-all duration-300 ease-in-out')
        };
    }
    
    /**
     * Helper method to get fail rate progress bar classes
     */
    getFailRateProgressClasses() {
        const bgContainer = this.currentTheme === 'dark' ? 'bg-neutral-600' : 'bg-gray-200';
        const failsBg = this.currentTheme === 'dark' ? 'bg-red-500' : 'bg-red-200';
        const nonFailsBg = this.currentTheme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-200';
        
        return {
            container: bgContainer,
            fails: failsBg,
            nonFails: nonFailsBg
        };
    }
    
    /**
     * Helper method to get calendar selection classes
     */
    getCalendarClasses() {
        const calendar = this.getColors('calendar');
        const bg = this.getColor('background', 'card');
        const border = this.getColor('border', 'primary');
        
        // Use neutral colors for calendar selection
        const selectedBg = this.currentTheme === 'dark' ? 'bg-neutral-600' : 'bg-gray-100';
        const selectedHover = this.currentTheme === 'dark' ? 'hover:bg-neutral-500' : 'hover:bg-gray-200';
        
        return {
            container: this.combineClasses(bg, 'rounded-md shadow-sm p-4'),
            weekday: calendar.weekday,
            weekend: calendar.weekend,
            selectedWeek: calendar.selectedWeek,
            dayOff: calendar.dayOff,
            border: border,
            selected: selectedBg,
            selectedHover: selectedHover
        };
    }
    
    /**
     * Helper method to get pay analysis calendar selection classes with blue highlighting
     */
    getPayAnalysisCalendarClasses() {
        const calendar = this.getColors('calendar');
        const bg = this.getColor('background', 'card');
        const border = this.getColor('border', 'primary');
        
        // Use blue colors for pay analysis calendar selection
        const selectedBg = this.currentTheme === 'dark' ? 'bg-blue-900' : 'bg-blue-100';
        const selectedHover = this.currentTheme === 'dark' ? 'hover:bg-blue-800' : 'hover:bg-blue-200';
        
        return {
            container: this.combineClasses(bg, 'rounded-md shadow-sm p-4'),
            weekday: calendar.weekday,
            weekend: calendar.weekend,
            selectedWeek: calendar.selectedWeek,
            dayOff: calendar.dayOff,
            border: border,
            selected: selectedBg,
            selectedHover: selectedHover
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
        const classesToAdd = [states.disabled.text, states.disabled.background].filter(cls => cls && cls.trim() !== '');
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
        const classesToRemove = [this.getColor('text', 'muted'), this.getColor('background', 'secondary')].filter(cls => cls && cls.trim() !== '');
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
        const summaryBg = this.currentTheme === 'dark' ? 'bg-neutral-700' : 'bg-gray-50';
        const summaryBorder = this.currentTheme === 'dark' ? 'border-neutral-600' : 'border-gray-200';
        
        return {
            noDiff: this.combineClasses(
                this.getColor('background', 'secondary'),
                this.getColor('border', 'secondary'),
                this.getColor('text', 'secondary'),
                'border rounded-md p-3 mb-4 text-sm'
            ),
            summary: this.combineClasses(
                summaryBg,
                summaryBorder,
                'border rounded-md p-3 mb-4 text-sm'
            ),
            summaryTitle: this.combineClasses(
                'font-medium mb-2',
                this.getColor('text', 'primary')
            ),
            summaryText: this.combineClasses(
                'font-mono',
                this.getColor('text', 'secondary')
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