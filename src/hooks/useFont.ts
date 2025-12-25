/**
 * Custom React Hook for Font Management
 * Provides font loading state and utilities
 */

import { useState, useEffect } from 'react';
import { FontFamily, FontWeight } from '../types/fonts';
import { isFontLoaded } from '../lib/fontUtils';

interface UseFontOptions {
  family: FontFamily;
  weight?: FontWeight;
  fallback?: boolean;
}

interface UseFontReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to check if a font is loaded
 */
export const useFont = ({ family, weight = 400, fallback = true }: UseFontOptions): UseFontReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkFont = async () => {
      try {
        setIsLoading(true);
        
        // Wait for fonts to be ready
        if (typeof document !== 'undefined' && 'fonts' in document) {
          await document.fonts.ready;
        }

        // Small delay to ensure fonts are processed
        await new Promise(resolve => setTimeout(resolve, 100));

        const loaded = await isFontLoaded(family, weight);
        
        if (mounted) {
          setIsLoaded(loaded);
          setIsLoading(false);
          
          if (!loaded && !fallback) {
            setError(new Error(`Font ${family} (weight: ${weight}) failed to load`));
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown font loading error'));
          setIsLoading(false);
        }
      }
    };

    checkFont();

    return () => {
      mounted = false;
    };
  }, [family, weight, fallback]);

  return { isLoaded, isLoading, error };
};

