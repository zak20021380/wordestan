# HarfLand Branding Guide

## Brand Name

**English**: HarfLand
**Persian**: حرف‌لند (Harf-Land)

## Logo & Assets TO-DO

### Required Asset Updates

The following assets need to be created or updated with the new HarfLand branding:

#### 1. Favicon
- **Location**: `/frontend/public/favicon.ico`
- **Requirements**:
  - Create a new favicon with "HarfLand" or "HL" logo
  - Include Persian/Arabic calligraphy elements if possible
  - Use brand colors (purple gradient)
  - Sizes: 16x16, 32x32, 48x48

#### 2. Logo Files
- **Primary Logo**: Create `logo-harfland.png` or update existing logo
- **Formats needed**: PNG, SVG
- **Variations**:
  - Light version (for dark backgrounds)
  - Dark version (for light backgrounds)
  - Icon only (square format)
  - Full wordmark (horizontal)

#### 3. Social Media Preview Image
- **Location**: `/frontend/public/og-image.jpg`
- **Requirements**:
  - Size: 1200x630px (Open Graph standard)
  - Include "HarfLand" branding
  - Include tagline: "بازی حرف یابی فارسی" or similar
  - Use brand colors and design system

#### 4. PWA Icons (if implementing PWA)
- **Locations**: `/frontend/public/icons/`
- **Sizes needed**:
  - 192x192 (Android)
  - 512x512 (Android)
  - 180x180 (iOS)
  - Various other sizes for different devices

## Brand Colors

Based on the existing design system:

- **Primary Purple**: `#a855f7` - Main brand color
- **Secondary Purple**: `#8b5cf6` - Accents and gradients
- **Accent Cyan**: `#06b6d4` - Admin features
- **Warm Wood**: `#c4965f` - Background theme
- **Gradient**: Purple to cyan for special elements

## Typography

- **Persian Font**: Vazirmatn (already implemented)
- **English Font**: Inter, Poppins (already implemented)
- **Logo Font**: Consider using a custom Persian font with modern styling

## Brand Voice

### Persian (حرف‌لند)
- Fun and engaging
- Youth-oriented ("برای جوونای ایران")
- Friendly and accessible
- Educational with entertainment

### English (HarfLand)
- Professional yet playful
- Clear and concise
- Focus on Persian language learning aspect

## Usage Guidelines

### Correct Usage:
✅ "حرف‌لند - بازی حرف یابی فارسی"
✅ "HarfLand - Persian Word Game"
✅ "به حرف‌لند خوش اومدی!"
✅ "Welcome to HarfLand!"

### Incorrect Usage:
❌ "Harfland" (lowercase 'l')
❌ "Harf land" (with space)
❌ "حرف لند" (with space - should use zero-width non-joiner)

## Current Status

### ✅ Completed Rebrand Updates:
- All HTML meta tags and titles
- All React components (Layout, Home, Login, Register)
- Package.json files (frontend, backend, root)
- Environment variables
- Backend API messages
- README documentation
- Deployment scripts
- Footer copyright with 💜 (purple heart to match brand)

### 🎨 Assets Still Needed:
- New favicon.ico
- New logo files (PNG/SVG)
- New og-image.jpg for social sharing
- PWA icons (if implementing)

## Notes

- The current logo uses a Gamepad2 icon (🎮) as a placeholder
- Consider creating a custom Persian-themed icon/logo
- Could incorporate Persian calligraphy elements
- Purple gradient aligns with existing color scheme
- The zero-width non-joiner (‌) should be used between "حرف" and "لند" for proper Persian typography

## Contact

For branding assets and design work, contact the design team or create new assets following this guide.

---

**Built with 💜 by the HarfLand Team**
