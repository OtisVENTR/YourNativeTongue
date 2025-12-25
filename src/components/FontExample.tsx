/**
 * Font Usage Example Component
 * Demonstrates how to use custom fonts in your React components
 */

import { useFont } from '../hooks/useFont';
import { applyFont } from '../lib/fontUtils';
import { FontFamily } from '../types/fonts';

export const FontExample = () => {
  // Check if Qlassy font is loaded (for headings)
  const { isLoaded: qlassyLoaded, isLoading: qlassyLoading } = useFont({ 
    family: 'qlassy', 
    weight: 700 
  });

  // Check if Inter font is loaded (for body)
  const { isLoaded: interLoaded, isLoading: interLoading } = useFont({ 
    family: 'inter', 
    weight: 400 
  });

  // Apply Qlassy font for heading
  const headingStyle = applyFont({
    family: 'qlassy',
    weight: 700,
    size: '2.5rem',
  });

  // Apply Inter font for body
  const bodyStyle = applyFont({
    family: 'inter',
    weight: 400,
    size: '1rem',
  });

  return (
    <div className="p-8">
      <h1 style={headingStyle}>
        Qlassy Display Font (Headings)
      </h1>
      
      <p style={bodyStyle} className="mt-4">
        This paragraph uses Inter body font for content, paragraphs, and UI elements.
      </p>
      
      <div className="mt-8">
        <h2 className="font-display text-2xl font-bold">
          Using CSS Classes (Qlassy)
        </h2>
        <p className="font-body text-base mt-2">
          Using CSS Classes (Inter)
        </p>
      </div>
      
      <div className="mt-8 space-y-2">
        {qlassyLoading && <p>Loading Qlassy font...</p>}
        {qlassyLoaded && <p className="text-green-500">✓ Qlassy font loaded successfully</p>}
        {interLoading && <p>Loading Inter font...</p>}
        {interLoaded && <p className="text-green-500">✓ Inter font loaded successfully</p>}
      </div>
    </div>
  );
};

