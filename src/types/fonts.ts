/**
 * Font Type Definitions
 * TypeScript types for custom fonts used in the application
 */

/**
 * Available font families in the application
 */
export type FontFamily = 
  | 'qlassy' // Display font for headings and titles
  | 'inter' // Body font for content, paragraphs, and UI
  | 'system'; // System font stack fallback

/**
 * Font weight values
 */
export type FontWeight = 
  | 100 // Thin
  | 200 // Extra Light
  | 300 // Light
  | 400 // Regular
  | 500 // Medium
  | 600 // Semi Bold
  | 700 // Bold
  | 800 // Extra Bold
  | 900; // Black

/**
 * Font style values
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * Font configuration object
 */
export interface FontConfig {
  family: FontFamily;
  weight?: FontWeight;
  style?: FontStyle;
  size?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string;
}

/**
 * Font family CSS values mapped to TypeScript types
 */
export const FONT_FAMILIES: Record<FontFamily, string> = {
  qlassy: "'Qlassy', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
} as const;

/**
 * Available font weights for Qlassy (Display Font)
 */
export const QLASSY_FONT_WEIGHTS: FontWeight[] = [400, 600, 700] as const;

/**
 * Available font weights for Inter (Body Font)
 * Inter supports all standard weights
 */
export const INTER_FONT_WEIGHTS: FontWeight[] = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

/**
 * Font usage guidelines
 */
export const FONT_USAGE = {
  display: {
    family: 'qlassy' as FontFamily,
    usage: 'Headings, titles, hero text, brand elements',
    weights: QLASSY_FONT_WEIGHTS,
  },
  body: {
    family: 'inter' as FontFamily,
    usage: 'Body text, paragraphs, subtitles, UI elements, forms',
    weights: INTER_FONT_WEIGHTS,
  },
} as const;

/**
 * Helper function to get font family CSS value
 */
export const getFontFamily = (family: FontFamily): string => {
  return FONT_FAMILIES[family];
};

/**
 * Helper function to create font CSS string
 */
export const createFontCSS = (config: FontConfig): string => {
  const family = getFontFamily(config.family);
  const weight = config.weight || 400;
  const style = config.style || 'normal';
  const size = config.size || '1rem';
  const lineHeight = config.lineHeight || '1.5';
  const letterSpacing = config.letterSpacing || 'normal';

  return `${style} ${weight} ${size}/${lineHeight} ${family}`;
};

