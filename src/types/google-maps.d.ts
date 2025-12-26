/**
 * Type declarations for Google Maps JavaScript API
 * These types extend the Window interface to include the google object
 * The actual types come from @types/google.maps
 */

declare global {
  interface Window {
    google?: {
      maps: {
        places: any;
        [key: string]: any;
      };
      [key: string]: any;
    };
  }
}

export {};

