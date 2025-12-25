# Font Files Directory

Place your custom font files in this directory.

## Supported Formats (in order of preference)

1. **WOFF2** (recommended) - Best compression, widest browser support
2. **WOFF** - Good compression, wide browser support
3. **TTF** - Fallback format
4. **OTF** - Alternative format

## File Naming Convention

For the font system to work automatically, name your files using this pattern:

```
FontName-Weight.woff2
FontName-Weight.woff
FontName-Weight.ttf
```

Examples:
- `CustomFont-Regular.woff2`
- `CustomFont-Medium.woff2`
- `CustomFont-SemiBold.woff2`
- `CustomFont-Bold.woff2`
- `CustomFont-Regular-Italic.woff2` (for italic variants)

## Weights

Common font weights:
- `Thin` or `100`
- `ExtraLight` or `200`
- `Light` or `300`
- `Regular` or `400` (normal)
- `Medium` or `500`
- `SemiBold` or `600`
- `Bold` or `700`
- `ExtraBold` or `800`
- `Black` or `900`

## After Adding Fonts

1. Update `src/styles/fonts.css` with your actual font name and file paths
2. Update `src/types/fonts.ts` with your font family name
3. The fonts will be automatically loaded when the app starts

## Optimization Tips

- Use WOFF2 format when possible (smallest file size)
- Only include the weights you actually use
- Consider subsetting fonts to include only needed characters
- Use `font-display: swap` (already configured) for better performance

