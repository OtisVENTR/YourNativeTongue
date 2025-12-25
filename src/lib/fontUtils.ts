/**
 * Font Utility Functions
 * Helper functions for working with custom fonts
 */

import type { CSSProperties } from 'react';
import { FontFamily, FontWeight, FontStyle, FontConfig, getFontFamily, createFontCSS } from '../types/fonts';

/**
 * Apply custom font to an element via inline styles
 */
export const applyFont = (config: FontConfig): CSSProperties => {
  return {
    fontFamily: getFontFamily(config.family),
    fontWeight: config.weight || 400,
    fontStyle: config.style || 'normal',
    fontSize: typeof config.size === 'number' ? `${config.size}px` : config.size || '1rem',
    lineHeight: typeof config.lineHeight === 'number' ? config.lineHeight : config.lineHeight || '1.5',
    letterSpacing: config.letterSpacing || 'normal',
  };
};

/**
 * Get Tailwind-compatible font family class
 */
export const getFontFamilyClass = (family: FontFamily): string => {
  const classMap: Record<FontFamily, string> = {
    qlassy: 'font-display',
    inter: 'font-body',
    system: 'font-sans',
  };
  return classMap[family];
};

/**
 * Preload font for better performance
 * Call this in your app initialization
 */
export const preloadFont = (fontPath: string, as: 'font' = 'font', type?: string): void => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = fontPath;
    link.as = as;
    if (type) {
      link.type = type;
    }
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
};

/**
 * Check if a font is loaded
 */
export const isFontLoaded = (fontFamily: string, fontWeight: FontWeight = 400): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    // Use FontFace API if available
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        const font = `${fontWeight} 1em "${fontFamily}"`;
        const loaded = document.fonts.check(font);
        resolve(loaded);
      });
    } else {
      // Fallback for older browsers
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      const baselineFont = 'monospace';
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        resolve(false);
        return;
      }

      const baselineWidth = context.measureText(testString).width;
      
      context.font = `${testSize} ${baselineFont}`;
      const baselineWidth2 = context.measureText(testString).width;
      
      context.font = `${fontWeight} ${testSize} "${fontFamily}", ${baselineFont}`;
      const testWidth = context.measureText(testString).width;
      
      resolve(testWidth !== baselineWidth && testWidth !== baselineWidth2);
    }
  });
};

