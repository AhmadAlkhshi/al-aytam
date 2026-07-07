# RTL (Right-to-Left) Setup Documentation

## Overview

This document describes the RTL (Right-to-Left) support implementation for the Student Management System frontend application. RTL support is essential for proper display of Arabic text and user interface elements.

## Components

### 1. RtlProvider Component

**Location:** `src/RtlProvider.tsx`

The RtlProvider wraps the entire application and configures Emotion's cache with the RTL plugin.

**Key Features:**
- Uses `@emotion/cache` with `stylis-plugin-rtl` for automatic RTL styling
- Sets document direction and language on mount
- Provides RTL context for all Material-UI components

**Usage:**
```tsx
import { RtlProvider } from './RtlProvider';

<RtlProvider>
  <App />
</RtlProvider>
```

### 2. Theme Configuration

**Location:** `src/theme.ts`

The Material-UI theme is configured with RTL direction and Arabic-friendly settings.

**Key Features:**
- `direction: 'rtl'` setting for all MUI components
- Arabic-friendly typography with appropriate fonts
- Custom component overrides for RTL support

**Typography Fonts:**
- Segoe UI
- Tahoma
- Arial
- sans-serif (fallback)

### 3. HTML Configuration

**Location:** `index.html`

The root HTML document includes RTL attributes:

```html
<html lang="ar" dir="rtl">
```

This ensures:
- Proper text direction from the start
- Screen reader compatibility
- Browser default RTL behavior

## Dependencies

### Required Packages

```json
{
  "@emotion/cache": "^11.14.0",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1",
  "@mui/material": "^9.2.0",
  "stylis-plugin-rtl": "^2.1.1"
}
```

### Installation

All dependencies are already installed. If needed, reinstall with:

```bash
cd frontend
npm install
```

## Setup Flow

The RTL setup is applied in the following order:

1. **HTML Level** (`index.html`): Sets `lang="ar"` and `dir="rtl"`
2. **Provider Level** (`main.tsx`): Wraps app with `RtlProvider`
3. **Theme Level** (`theme.ts`): Configures MUI with `direction: 'rtl'`
4. **Component Level**: All MUI components automatically apply RTL styles

## How It Works

### Emotion Cache with RTL Plugin

The RTL plugin (`stylis-plugin-rtl`) automatically converts CSS properties for RTL:

**Before (LTR):**
```css
margin-left: 10px;
padding-right: 20px;
```

**After (RTL):**
```css
margin-right: 10px;
padding-left: 20px;
```

### Material-UI Integration

Material-UI components automatically respect the `direction: 'rtl'` setting:

- **Buttons**: Icons and text align properly
- **TextFields**: Labels and placeholders display on the right
- **Dialogs**: Close button appears on the left
- **Drawers**: Open from the right side
- **Lists**: Icons and text align right

## Testing RTL Support

### Visual Test Component

A test component is available at `src/components/RtlTest.tsx`:

```tsx
import { RtlTest } from './components/RtlTest';

// Use in any component
<RtlTest />
```

This component displays:
- Arabic text with proper alignment
- Buttons with RTL layout
- Input fields with RTL labels
- Flex containers with RTL direction

### Manual Testing Checklist

- [ ] Text flows from right to left
- [ ] Buttons are in correct order (reversed from LTR)
- [ ] Input labels appear on the right
- [ ] Icons in buttons appear on the correct side
- [ ] Tooltips appear from the correct direction
- [ ] Dropdowns open in the correct direction
- [ ] Scrollbars appear on the left side
- [ ] Navigation menus align to the right

## Common Issues and Solutions

### Issue 1: Text not aligning right

**Solution:** Ensure `RtlProvider` wraps the entire app in `main.tsx`

### Issue 2: Some components still LTR

**Solution:** Check if custom CSS is overriding RTL styles. Use MUI's `sx` prop instead.

### Issue 3: Icons in wrong position

**Solution:** MUI automatically handles icon positions. If using custom icons, use `flexDirection: 'row-reverse'`

### Issue 4: Numbers or English text alignment

**Solution:** This is expected behavior. Numbers and English text maintain LTR within RTL context.

## Best Practices

### 1. Use Material-UI Components

Prefer MUI components over custom HTML/CSS as they handle RTL automatically:

```tsx
// Good
<Button>حفظ</Button>

// Avoid
<button style={{ marginLeft: 10 }}>حفظ</button>
```

### 2. Use Logical Properties

When writing custom styles, use logical CSS properties:

```tsx
// Good - works in both LTR and RTL
sx={{ marginInlineStart: 2 }}

// Avoid - fixed direction
sx={{ marginLeft: 2 }}
```

### 3. Avoid Fixed Positioning

Avoid absolute positioning with fixed coordinates:

```tsx
// Good
sx={{ position: 'relative' }}

// Avoid
sx={{ position: 'absolute', left: 0 }}
```

### 4. Test with Long Text

Always test with long Arabic text to ensure proper wrapping:

```tsx
<Typography>
  هذا نص طويل جداً للتأكد من أن التغليف والمحاذاة تعمل بشكل صحيح في جميع الحالات
</Typography>
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint code
npm run lint
```

## Browser Support

RTL support works in all modern browsers:

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Additional Resources

- [Material-UI RTL Guide](https://mui.com/material-ui/guides/right-to-left/)
- [Stylis Plugin RTL](https://github.com/styled-components/stylis-plugin-rtl)
- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [W3C: Structural markup and right-to-left text](https://www.w3.org/International/questions/qa-html-dir)

## Verification

To verify RTL setup is working correctly:

1. Start the development server: `npm run dev`
2. Open browser DevTools
3. Check document direction: `document.documentElement.dir` should be `"rtl"`
4. Inspect elements: CSS properties should be automatically flipped
5. Test all interactive components with Arabic text

---

**Last Updated:** January 2025
**Status:** ✅ Complete and Working
