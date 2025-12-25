/**
 * Theme Utility Functions
 * Helper functions for working with themes and CSS variables
 */

/**
 * Get a CSS variable value
 */
export const getCSSVariable = (variableName: string): string => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
};

/**
 * Set a CSS variable value
 */
export const setCSSVariable = (variableName: string, value: string): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(variableName, value);
};

/**
 * Get current theme from data-theme attribute
 */
export const getCurrentTheme = (): 'light' | 'dark' => {
  if (typeof document === 'undefined') return 'light';
  const theme = document.documentElement.getAttribute('data-theme');
  return (theme === 'dark' ? 'dark' : 'light');
};

/**
 * Check if system prefers dark mode
 */
export const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Get computed color value (useful for getting actual rendered color)
 */
export const getComputedColor = (cssVariable: string): string => {
  if (typeof window === 'undefined') return '';
  const value = getCSSVariable(cssVariable);
  if (!value) return '';
  
  // If it's already a hex/rgb value, return it
  if (value.startsWith('#') || value.startsWith('rgb')) {
    return value;
  }
  
  // If it's a CSS variable reference, resolve it
  if (value.startsWith('var(')) {
    // Extract variable name
    const match = value.match(/var\(--([^)]+)\)/);
    if (match) {
      return getCSSVariable(`--${match[1]}`);
    }
  }
  
  return value;
};

