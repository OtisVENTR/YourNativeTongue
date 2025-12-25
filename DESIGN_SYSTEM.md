# Design System

## Overview
This document contains all master design and branding parameters for YourNativeTongue. Use this as the single source of truth for all design decisions, ensuring consistency across the application.

---

## Brand Identity

### Brand Name
**Your Native Tongue**

### Brand Mission
[To be defined]

### Brand Values
[To be defined]

### Brand Personality
[To be defined]

---

## Color Palette

### Brand Colors

#### Primary Color - Crimson Depth
- **Primary**: `#710014` (Crimson Depth)
  - Usage: Primary actions, CTAs, brand elements, links, interactive elements
  - RGB: `rgb(113, 0, 20)`
  - HSL: `hsl(350, 100%, 22%)`
  - CMYK: `31, 100, 92, 45`
  - **Light Mode**: Used as-is for primary elements
  - **Dark Mode**: Slightly lighter variant for better contrast

- **Primary Hover**: `#8A0019` (Lighter Crimson)
  - Usage: Hover states on primary elements
  - RGB: `rgb(138, 0, 25)`
  - HSL: `hsl(350, 100%, 27%)`

- **Primary Active**: `#5A0010` (Darker Crimson)
  - Usage: Active/pressed states
  - RGB: `rgb(90, 0, 16)`
  - HSL: `hsl(350, 100%, 18%)`

#### Accent Color - Warm Sand
- **Accent**: `#B38F6F` (Warm Sand)
  - Usage: Secondary actions, highlights, decorative elements, borders
  - RGB: `rgb(179, 143, 111)`
  - HSL: `hsl(28, 33%, 57%)`
  - CMYK: `29, 42, 59, 3`
  - **Light Mode**: Used for accents and secondary elements
  - **Dark Mode**: Slightly lighter for better visibility

- **Accent Hover**: `#C4A082` (Lighter Sand)
  - Usage: Hover states on accent elements
  - RGB: `rgb(196, 160, 130)`
  - HSL: `hsl(28, 33%, 64%)`

- **Accent Active**: `#A27E5C` (Darker Sand)
  - Usage: Active states on accent elements
  - RGB: `rgb(162, 126, 92)`
  - HSL: `hsl(28, 33%, 50%)`

### Base Colors

#### Soft Pearl (Light Mode Background)
- **Background**: `#F2F1ED` (Soft Pearl)
  - Usage: Light mode background, card backgrounds, surfaces
  - RGB: `rgb(242, 241, 237)`
  - HSL: `hsl(45, 8%, 94%)`
  - CMYK: `4, 3, 5, 0`

- **Background Secondary**: `#FFFFFF` (Pure White)
  - Usage: Elevated surfaces, modals, dropdowns in light mode
  - RGB: `rgb(255, 255, 255)`
  - HSL: `hsl(0, 0%, 100%)`

#### Obsidian Black (Dark Mode Background)
- **Background Dark**: `#161616` (Obsidian Black)
  - Usage: Dark mode background, dark surfaces
  - RGB: `rgb(22, 22, 22)`
  - HSL: `hsl(0, 0%, 9%)`
  - CMYK: `73, 67, 67, 0`

- **Background Dark Secondary**: `#1F1F1F` (Dark Gray)
  - Usage: Elevated surfaces, cards, modals in dark mode
  - RGB: `rgb(31, 31, 31)`
  - HSL: `hsl(0, 0%, 12%)`

### Text Colors

#### Light Mode Text
- **Text Primary**: `#161616` (Obsidian Black)
  - Usage: Primary text, headings, body text in light mode
  - RGB: `rgb(22, 22, 22)`
  - HSL: `hsl(0, 0%, 9%)`

- **Text Secondary**: `#4A4A4A` (Medium Gray)
  - Usage: Secondary text, captions, labels in light mode
  - RGB: `rgb(74, 74, 74)`
  - HSL: `hsl(0, 0%, 29%)`

- **Text Tertiary**: `#8A8A8A` (Light Gray)
  - Usage: Tertiary text, placeholders, disabled text in light mode
  - RGB: `rgb(138, 138, 138)`
  - HSL: `hsl(0, 0%, 54%)`

#### Dark Mode Text
- **Text Primary Dark**: `#F2F1ED` (Soft Pearl)
  - Usage: Primary text, headings, body text in dark mode
  - RGB: `rgb(242, 241, 237)`
  - HSL: `hsl(45, 8%, 94%)`

- **Text Secondary Dark**: `#C4C4C4` (Light Gray)
  - Usage: Secondary text, captions, labels in dark mode
  - RGB: `rgb(196, 196, 196)`
  - HSL: `hsl(0, 0%, 77%)`

- **Text Tertiary Dark**: `#8A8A8A` (Medium Gray)
  - Usage: Tertiary text, placeholders, disabled text in dark mode
  - RGB: `rgb(138, 138, 138)`
  - HSL: `hsl(0, 0%, 54%)`

### Border Colors

#### Light Mode Borders
- **Border Light**: `#E0E0E0` (Light Gray)
  - Usage: Borders, dividers in light mode
  - RGB: `rgb(224, 224, 224)`
  - HSL: `hsl(0, 0%, 88%)`

- **Border Accent**: `#B38F6F` (Warm Sand)
  - Usage: Accent borders, focus states in light mode
  - RGB: `rgb(179, 143, 111)`
  - HSL: `hsl(28, 33%, 57%)`

#### Dark Mode Borders
- **Border Dark**: `#3A3A3A` (Dark Gray)
  - Usage: Borders, dividers in dark mode
  - RGB: `rgb(58, 58, 58)`
  - HSL: `hsl(0, 0%, 23%)`

- **Border Accent Dark**: `#B38F6F` (Warm Sand)
  - Usage: Accent borders, focus states in dark mode
  - RGB: `rgb(179, 143, 111)`
  - HSL: `hsl(28, 33%, 57%)`

### Semantic Colors (System Colors)

#### Success
- **Success**: `#10B981` (Green)
  - Usage: Success states, positive actions, confirmations
  - RGB: `rgb(16, 185, 129)`
  - HSL: `hsl(160, 84%, 39%)`

#### Warning
- **Warning**: `#F59E0B` (Amber)
  - Usage: Warnings, caution states
  - RGB: `rgb(245, 158, 11)`
  - HSL: `hsl(38, 92%, 50%)`

#### Error
- **Error**: `#EF4444` (Red)
  - Usage: Errors, destructive actions, alerts
  - RGB: `rgb(239, 68, 68)`
  - HSL: `hsl(0, 84%, 60%)`

#### Info
- **Info**: `#3B82F6` (Blue)
  - Usage: Informational messages, links
  - RGB: `rgb(59, 130, 246)`
  - HSL: `hsl(217, 91%, 60%)`

### Color Usage Guidelines

**Light Mode:**
- Background: Soft Pearl (`#F2F1ED`)
- Primary Text: Obsidian Black (`#161616`)
- Primary Actions: Crimson Depth (`#710014`)
- Accent Elements: Warm Sand (`#B38F6F`)

**Dark Mode:**
- Background: Obsidian Black (`#161616`)
- Primary Text: Soft Pearl (`#F2F1ED`)
- Primary Actions: Crimson Depth (`#710014`) - may need slight lightening
- Accent Elements: Warm Sand (`#B38F6F`)

**Accessibility:**
- All text colors meet WCAG AA contrast requirements
- Primary color maintains sufficient contrast in both modes
- Accent color provides good visibility in both modes

---

## Typography

### Font Families

#### Display Font (Headings & Titles)
- **Font Family**: `'Qlassy', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
- **Usage**: 
  - All headings (H1, H2, H3, H4, H5, H6)
  - Page titles and section titles
  - Display text and hero text
  - Brand elements and emphasis
- **Available Weights**: 400 (Regular), 600 (Semibold), 700 (Bold)
- **Available Styles**: Normal, Italic
- **Fallback**: System sans-serif fonts

#### Body Font (Content & UI)
- **Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`
- **Usage**: 
  - Body text and paragraphs
  - Subtitles and captions
  - UI elements and buttons
  - Form inputs and labels
  - Navigation and menus
  - All general content
- **Fallback**: System sans-serif fonts

#### Monospace Font
- **Font Family**: `'Menlo', 'Monaco', 'Courier New', monospace`
- **Usage**: Code, technical content, data display

### Font Sizes

#### Scale
- **XS**: `0.75rem` (12px)
- **SM**: `0.875rem` (14px)
- **Base**: `1rem` (16px)
- **LG**: `1.125rem` (18px)
- **XL**: `1.25rem` (20px)
- **2XL**: `1.5rem` (24px)
- **3XL**: `1.875rem` (30px)
- **4XL**: `2.25rem` (36px)
- **5XL**: `3rem` (48px)
- **6XL**: `3.75rem` (60px)

#### Usage by Element Type

**Headings (Qlassy Font)**
- **H1**: `3rem` (48px) / `3.75rem` (60px) - Page titles, hero headings
- **H2**: `2.25rem` (36px) - Section titles, major headings
- **H3**: `1.875rem` (30px) - Subsection titles, card headings
- **H4**: `1.5rem` (24px) - Subheadings, component titles
- **H5**: `1.25rem` (20px) - Small headings
- **H6**: `1.125rem` (18px) - Smallest headings

**Body & Content (Inter Font)**
- **Body**: `1rem` (16px) - Default body text, paragraphs
- **Body Large**: `1.125rem` (18px) - Emphasized body text
- **Small**: `0.875rem` (14px) - Secondary text, captions
- **Tiny**: `0.75rem` (12px) - Labels, fine print
- **Subtitle**: `1.125rem` (18px) - Subtitles, lead text

### Font Weights
- **Thin**: `100`
- **Light**: `300`
- **Regular**: `400` (default)
- **Medium**: `500`
- **Semibold**: `600`
- **Bold**: `700`
- **Extrabold**: `800`
- **Black**: `900`

### Line Heights
- **Tight**: `1.25`
- **Snug**: `1.375`
- **Normal**: `1.5` (default)
- **Relaxed**: `1.625`
- **Loose**: `2`

### Letter Spacing
- **Tighter**: `-0.05em`
- **Tight**: `-0.025em`
- **Normal**: `0em` (default)
- **Wide**: `0.025em`
- **Wider**: `0.05em`
- **Widest**: `0.1em`

### Typography Usage Rules

**Qlassy (Display Font) - Use for:**
- ✅ All heading elements (H1, H2, H3, H4, H5, H6)
- ✅ Page titles and hero text
- ✅ Section titles and major headings
- ✅ Brand elements and logos
- ✅ Display text and emphasis
- ❌ Do NOT use for body text, paragraphs, or UI elements

**Inter (Body Font) - Use for:**
- ✅ All body text and paragraphs
- ✅ Subtitles and captions
- ✅ UI elements (buttons, inputs, labels)
- ✅ Navigation and menus
- ✅ Form elements
- ✅ All general content
- ❌ Do NOT use for headings or titles

**Default Behavior:**
- All `<h1>` through `<h6>` elements automatically use Qlassy
- All body elements (`<body>`, `<p>`, `<span>`, etc.) automatically use Inter
- CSS variables available: `--font-family-display` and `--font-family-body`

---

## Spacing System

### Base Unit
**8px** - All spacing values should be multiples of 8px for consistency.

### Spacing Scale
- **0**: `0px`
- **1**: `0.25rem` (4px)
- **2**: `0.5rem` (8px)
- **3**: `0.75rem` (12px)
- **4**: `1rem` (16px)
- **5**: `1.25rem` (20px)
- **6**: `1.5rem` (24px)
- **8**: `2rem` (32px)
- **10**: `2.5rem` (40px)
- **12**: `3rem` (48px)
- **16**: `4rem` (64px)
- **20**: `5rem` (80px)
- **24**: `6rem` (96px)
- **32**: `8rem` (128px)
- **40**: `10rem` (160px)
- **48**: `12rem` (192px)
- **64**: `16rem` (256px)

### Usage Guidelines
- **Padding (Internal)**: Use spacing scale for component internal padding
- **Margin (External)**: Use spacing scale for component external spacing
- **Gap**: Use spacing scale for flex/grid gaps

---

## Border Radius

### Radius Scale
- **None**: `0px`
- **SM**: `0.125rem` (2px)
- **Base**: `0.25rem` (4px)
- **MD**: `0.375rem` (6px)
- **LG**: `0.5rem` (8px)
- **XL**: `0.75rem` (12px)
- **2XL**: `1rem` (16px)
- **3XL**: `1.5rem` (24px)
- **Full**: `9999px` (fully rounded)

### Usage
- **Buttons**: `0.375rem` (6px) - MD
- **Cards**: `0.5rem` (8px) - LG
- **Inputs**: `0.375rem` (6px) - MD
- **Badges**: `9999px` - Full
- **Modals**: `0.75rem` (12px) - XL

---

## Shadows

### Shadow Scale
- **None**: `none`
- **SM**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **Base**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **MD**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **LG**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **XL**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **2XL**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`
- **Inner**: `inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)`

### Usage
- **Cards**: Base or MD
- **Modals**: XL or 2XL
- **Buttons (hover)**: MD
- **Inputs (focus)**: SM or Base
- **Dropdowns**: LG

---

## Breakpoints

### Responsive Breakpoints
- **Mobile**: `0px` - `639px`
- **Tablet**: `640px` - `1023px`
- **Desktop**: `1024px` - `1279px`
- **Large Desktop**: `1280px` and above

### Media Query Values
- **sm**: `640px`
- **md**: `768px`
- **lg**: `1024px`
- **xl**: `1280px`
- **2xl**: `1536px`

---

## Z-Index Scale

### Layer Hierarchy
- **Base**: `0`
- **Dropdown**: `1000`
- **Sticky**: `1100`
- **Fixed**: `1200`
- **Modal Backdrop**: `1300`
- **Modal**: `1400`
- **Popover**: `1500`
- **Tooltip**: `1600`
- **Toast**: `1700`

---

## Animation & Transitions

### Duration
- **Instant**: `0ms`
- **Fast**: `150ms`
- **Base**: `200ms`
- **Slow**: `300ms`
- **Slower**: `500ms`

### Easing Functions
- **Ease In**: `cubic-bezier(0.4, 0, 1, 1)`
- **Ease Out**: `cubic-bezier(0, 0, 0.2, 1)`
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Linear**: `linear`

### Common Transitions
- **Hover**: `150ms ease-out`
- **Focus**: `200ms ease-out`
- **Active**: `100ms ease-in`
- **Page Transition**: `300ms ease-in-out`

---

## Components

### Buttons

#### Primary Button
- **Background**: Primary color
- **Text**: White
- **Padding**: `0.75rem 1.5rem` (12px 24px)
- **Border Radius**: `0.375rem` (6px)
- **Font Weight**: `600` (Semibold)
- **Font Size**: `1rem` (16px)
- **Hover**: Darker shade of primary
- **Active**: Even darker shade
- **Disabled**: Gray with reduced opacity

#### Secondary Button
- **Background**: Transparent
- **Border**: `1px solid` primary color
- **Text**: Primary color
- **Padding**: `0.75rem 1.5rem` (12px 24px)
- **Border Radius**: `0.375rem` (6px)
- **Font Weight**: `600` (Semibold)
- **Font Size**: `1rem` (16px)
- **Hover**: Primary background with white text

#### Text Button
- **Background**: Transparent
- **Text**: Primary color
- **Padding**: `0.5rem 1rem` (8px 16px)
- **Font Weight**: `500` (Medium)
- **Font Size**: `1rem` (16px)
- **Hover**: Light background

### Inputs

#### Text Input
- **Height**: `2.5rem` (40px)
- **Padding**: `0.75rem 1rem` (12px 16px)
- **Border**: `1px solid` gray-300
- **Border Radius**: `0.375rem` (6px)
- **Font Size**: `1rem` (16px)
- **Focus Border**: Primary color, `2px solid`
- **Error Border**: Error color, `1px solid`

### Cards

#### Standard Card
- **Background**: White
- **Padding**: `1.5rem` (24px)
- **Border Radius**: `0.5rem` (8px)
- **Shadow**: Base shadow
- **Border**: `1px solid` gray-200 (optional)

---

## Accessibility

### Color Contrast
- **AA Standard**: Minimum 4.5:1 for normal text, 3:1 for large text
- **AAA Standard**: Minimum 7:1 for normal text, 4.5:1 for large text

### Focus States
- **Outline**: `2px solid` primary color
- **Offset**: `2px` from element edge
- **All interactive elements must have visible focus states**

### Screen Reader Support
- **Semantic HTML**: Use proper HTML elements
- **ARIA Labels**: Provide labels for icon-only buttons
- **Alt Text**: All images must have descriptive alt text

---

## Icons

### Icon Library
[To be defined - e.g., Heroicons, Feather Icons, etc.]

### Icon Sizes
- **XS**: `0.75rem` (12px)
- **SM**: `1rem` (16px)
- **MD**: `1.25rem` (20px)
- **LG**: `1.5rem` (24px)
- **XL**: `2rem` (32px)

### Icon Stroke Width
- **Default**: `2px`
- **Thin**: `1.5px`
- **Bold**: `2.5px`

---

## Grid System

### Container
- **Max Width**: `1280px`
- **Padding**: `1rem` (16px) on mobile, `2rem` (32px) on desktop

### Columns
- **Mobile**: 4 columns
- **Tablet**: 8 columns
- **Desktop**: 12 columns

### Gutter
- **Mobile**: `1rem` (16px)
- **Tablet**: `1.5rem` (24px)
- **Desktop**: `2rem` (32px)

---

## Logo & Branding Assets

### Logo
[To be defined - include specifications for logo usage, sizes, clear space, etc.]

### Favicon
[To be defined]

### Brand Colors Usage
- **Primary**: Use for main brand elements, CTAs
- **Secondary**: Use for backgrounds, contrast
- **Accent**: Use sparingly for highlights, links

---

## Design Tokens (CSS Variables)

All design tokens are defined as CSS variables in `src/styles/colors.css` and `src/index.css`. These variables are globally available and can be used throughout the application. **Any changes to these variables will automatically reflect across all components.**

### Color Tokens

```css
/* Brand Colors */
--color-primary: #710014;           /* Crimson Depth - Primary brand color */
--color-primary-hover: #8A0019;     /* Hover state */
--color-primary-active: #5A0010;    /* Active state */
--color-accent: #B38F6F;            /* Warm Sand - Accent color */
--color-accent-hover: #C4A082;      /* Accent hover state */
--color-accent-active: #A27E5C;     /* Accent active state */

/* Background Colors (Light/Dark Mode) */
--color-bg-primary:                 /* Main background */
--color-bg-secondary:                 /* Secondary background */
--color-bg-tertiary:                  /* Tertiary background */
--color-bg-elevated:                  /* Elevated surfaces (cards, modals) */

/* Text Colors (Light/Dark Mode) */
--color-text-primary:                 /* Primary text */
--color-text-secondary:                /* Secondary text */
--color-text-tertiary:                 /* Tertiary text */
--color-text-disabled:                 /* Disabled text */
--color-text-inverse:                  /* Inverse text (for buttons) */

/* Border Colors (Light/Dark Mode) */
--color-border-primary:                /* Primary borders */
--color-border-secondary:              /* Secondary borders */
--color-border-accent:                 /* Accent borders */
--color-border-focus:                   /* Focus state borders */

/* Link Colors (Light/Dark Mode) */
--color-link:                          /* Link color */
--color-link-hover:                    /* Link hover */
--color-link-visited:                  /* Visited links */

/* Semantic Colors */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #3B82F6;
```

### Typography Tokens

```css
/* Font Families */
--font-family-display: 'Qlassy', ...;  /* Headings and titles */
--font-family-body: 'Inter', ...;       /* Body text and content */
--font-family-mono: 'Menlo', ...;       /* Monospace */

/* Font Sizes */
--font-size-base: 1rem;                /* 16px */
```

### Spacing Tokens

```css
--spacing-unit: 0.5rem;                /* 8px base unit */
```

### Border Radius Tokens

```css
--radius-md: 0.375rem;                 /* 6px */
```

### Shadow Tokens

```css
--color-shadow-sm:                     /* Small shadow */
--color-shadow-md:                     /* Medium shadow */
--color-shadow-lg:                     /* Large shadow */
--color-shadow-xl:                     /* Extra large shadow */
```

### Transition Tokens

```css
--transition-base: 200ms ease-out;     /* Base transition */
```

### Usage in Components

**CSS:**
```css
.my-component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}
```

**Inline Styles (React):**
```jsx
<div style={{
  backgroundColor: 'var(--color-bg-primary)',
  color: 'var(--color-text-primary)'
}}>
  Content
</div>
```

**Tailwind (if configured):**
```jsx
<div className="bg-primary text-primary">
  Content
</div>
```

---

## Notes

- This design system is a living document and should be updated as the project evolves
- All design decisions should reference this document
- When in doubt, prioritize consistency and accessibility
- Test all color combinations for accessibility compliance
- Maintain spacing consistency using the 8px grid system

---

**Last Updated**: 2025-12-24
**Version**: 1.0.0

