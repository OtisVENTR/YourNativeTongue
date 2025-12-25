# Custom Font Setup Guide

This project includes a complete, optimized font system for custom fonts.

## Quick Start

1. **Add your font files** to `assets/fonts/` directory
   - Recommended format: WOFF2 (best compression)
   - Also supported: WOFF, TTF, OTF

2. **Generate font CSS automatically:**
   ```bash
   npm run generate-fonts
   ```
   This will scan your font files and generate optimized `@font-face` declarations.

3. **Or manually update** `src/styles/fonts.css` with your font name and file paths

4. **Update TypeScript types** in `src/types/fonts.ts`:
   - Replace `'CustomFont'` with your actual font name
   - Update `FONT_FAMILIES` object with your font family

## File Structure

```
assets/
└── fonts/              # Place your font files here
    ├── FontName-Regular.woff2
    ├── FontName-Bold.woff2
    └── ...

src/
├── styles/
│   └── fonts.css       # @font-face declarations (auto-generated)
├── types/
│   └── fonts.ts        # TypeScript types for fonts
├── lib/
│   └── fontUtils.ts    # Font utility functions
└── hooks/
    └── useFont.ts      # React hook for font loading
```

## Usage Examples

### 1. Using TypeScript Types

```tsx
import { FontFamily, FontWeight } from '../types/fonts';
import { getFontFamily } from '../types/fonts';

const fontFamily: FontFamily = 'CustomFont';
const css = getFontFamily(fontFamily);
```

### 2. Using Font Utilities

```tsx
import { applyFont } from '../lib/fontUtils';

const style = applyFont({
  family: 'CustomFont',
  weight: 600,
  size: '1.5rem',
  lineHeight: 1.5,
});

<div style={style}>Styled text</div>
```

### 3. Using React Hook

```tsx
import { useFont } from '../hooks/useFont';

function MyComponent() {
  const { isLoaded, isLoading } = useFont({ 
    family: 'CustomFont', 
    weight: 400 
  });

  if (isLoading) return <div>Loading font...</div>;
  if (!isLoaded) return <div>Font failed to load</div>;

  return <div style={{ fontFamily: 'CustomFont' }}>Content</div>;
}
```

### 4. Using CSS Classes

After updating `fonts.css`, you can use the font in your CSS:

```css
.my-text {
  font-family: 'CustomFont', sans-serif;
  font-weight: 600;
}
```

### 5. Using Tailwind (if configured)

Add to your `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        custom: ['CustomFont', 'sans-serif'],
      },
    },
  },
}
```

Then use: `<div className="font-custom">Text</div>`

## Optimization Features

✅ **Font Display Swap**: Uses `font-display: swap` to show fallback text immediately  
✅ **Unicode Range**: Only loads needed character ranges  
✅ **Format Priority**: Prefers WOFF2 > WOFF > TTF for best compression  
✅ **Preloading**: Utility function to preload fonts for better performance  
✅ **Font Loading Detection**: Hook to check if fonts are loaded  

## Font File Naming

The auto-generator script recognizes this naming pattern:

```
FontName-Weight.woff2
FontName-Weight-Italic.woff2
```

Examples:
- `CustomFont-Regular.woff2` → weight: 400, style: normal
- `CustomFont-Bold.woff2` → weight: 700, style: normal
- `CustomFont-Medium-Italic.woff2` → weight: 500, style: italic

Supported weight names:
- Thin (100), ExtraLight (200), Light (300)
- Regular/Normal (400), Medium (500)
- SemiBold (600), Bold (700)
- ExtraBold (800), Black (900)

## Manual Setup

If you prefer to set up fonts manually:

1. Edit `src/styles/fonts.css` and add your `@font-face` declarations
2. Update `src/types/fonts.ts` with your font family name
3. Import `fonts.css` in `src/index.css` (already done)

## Performance Tips

1. **Use WOFF2 format** - Best compression (30-50% smaller than TTF)
2. **Subset fonts** - Only include characters you need
3. **Preload critical fonts** - Use `preloadFont()` utility
4. **Limit font weights** - Only include weights you actually use
5. **Use font-display: swap** - Already configured for optimal loading

## Troubleshooting

**Fonts not loading?**
- Check file paths in `fonts.css` match actual file locations
- Ensure files are in `assets/fonts/` directory
- Check browser console for 404 errors

**TypeScript errors?**
- Update `FontFamily` type in `src/types/fonts.ts`
- Ensure font name matches CSS `font-family` value

**Fonts loading slowly?**
- Use WOFF2 format
- Consider font subsetting
- Preload critical fonts using `preloadFont()` utility

