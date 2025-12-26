/**
 * Utility to dynamically load Google Maps JavaScript API script
 * This allows us to use environment variables properly
 */

let scriptLoaded = false;
let scriptLoading = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
  // If already loaded, return resolved promise
  if (scriptLoaded && window.google?.maps?.places) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (scriptLoading && loadPromise) {
    return loadPromise;
  }

  // Create new loading promise
  scriptLoading = true;
  loadPromise = new Promise((resolve, reject) => {
    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );

    if (existingScript) {
      // Script exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          scriptLoaded = true;
          scriptLoading = false;
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps?.places) {
          scriptLoading = false;
          reject(new Error('Google Maps script failed to load'));
        }
      }, 10000);
      return;
    }

    // Get API key from environment
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      scriptLoading = false;
      reject(
        new Error(
          'Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.'
        )
      );
      return;
    }

    // Create and append script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

