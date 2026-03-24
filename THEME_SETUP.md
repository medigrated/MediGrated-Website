# Light & Dark Mode Theme Setup Guide

## Overview

MediGrated Website now features a complete light/dark mode theme system with:
- ✅ Modern glassmorphism design with smooth gradients
- ✅ Automatic system preference detection
- ✅ localStorage persistence
- ✅ Smooth transitions between themes
- ✅ Tailwind CSS dark mode support
- ✅ Responsive design for all device sizes

## How It Works

### Theme System Architecture

```
ThemeToggle Component → localStorage → document.documentElement
                                    ↓
                            CSS Custom Properties
                                    ↓
            Tailwind Dark Mode Classes (.dark)
```

### CSS Custom Properties (Variables)

The theme system uses CSS custom properties (variables) defined in two places:

**1. Light Mode (`:root`)**
- Located in `client/src/index.css` (lines 6-32)
- Primary colors: Blue gradients (#667eea to #764ba2)
- Background: White and light gray tones
- Shadows: Soft, subtle shadows for light mode

**2. Dark Mode (`.dark`)**
- Located in `client/src/index.css` (lines 34-60)
- Primary colors: Adjusted for dark backgrounds (brighter variants)
- Background: Dark blue-gray tones (#0f172a to #1e293b)
- Shadows: Darker, more prominent shadows
- Text: Light text for proper contrast

### Key CSS Variables

```css
/* Color Variables */
--background        /* Page background */
--foreground        /* Primary text color */
--card              /* Card component background */
--primary           /* Primary brand color */
--secondary         /* Secondary brand color */
--accent            /* Accent/highlight color */
--destructive       /* Error/delete states */
--border            /* Border colors */

/* Gradient Variables */
--gradient-primary      /* Blue-purple gradient */
--gradient-secondary    /* Pink-red gradient */
--gradient-accent       /* Cyan-teal gradient */

/* Shadow Variables */
--shadow-soft       /* Subtle shadows */
--shadow-medium     /* Medium shadows */
--shadow-large      /* Prominent shadows */

/* Chart Colors */
--chart-1 through --chart-5  /* Data visualization colors */
```

## Components

### ThemeToggle Button

**Location:** `client/src/components/ui/theme-toggle.jsx`

**Features:**
- Automatic system preference detection
- localStorage persistence
- Hydration-safe (prevents SSR mismatches)
- Smooth transitions
- Accessible (ARIA labels, keyboard support)
- System preference listener

**Usage:**
```jsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
    </div>
  );
}
```

**Props:**
```jsx
<ThemeToggle 
  size={16}                    // Icon size (default: 16)
  className="additional-class" // Extra Tailwind classes
/>
```

### Current Component Integration

The ThemeToggle is already implemented in all dashboard headers:
- ✅ Admin View Header: `client/src/components/admin-view/header.jsx`
- ✅ Doctor View Header: `client/src/components/doctor-view/header.jsx`
- ✅ Patient View Header: `client/src/components/patient-view/header.jsx`

## Tailwind Configuration

**File:** `client/tailwind.config.js`

### Dark Mode Strategy
```javascript
darkMode: ["class"]  // Uses .dark class on html element
```

### Extended Theme
The Tailwind config extends the default theme with:

1. **Animations**
   - `fade-in`, `fade-out`
   - `slide-in-top`, `slide-in-right`, `slide-in-bottom`, `slide-in-left`
   - `scale-in`, `shimmer`, `pulse-glow`, `float`

2. **Shadows**
   - `soft`, `gentle`, `medium`, `large`, `xl`
   - `glow-primary`, `glow-secondary`, `glow-accent`
   - `glass` (for glassmorphism effect)

3. **Background Images**
   - `gradient-primary`, `gradient-secondary`, `gradient-accent`
   - `gradient-light`, `gradient-dark`, `gradient-subtle`

4. **Backdrop Blur**
   - `xs`, `sm`, `md`, `lg`, `xl`, `2xl`

5. **Transition Utilities**
   - Custom durations: `250ms`, `350ms`, `400ms`
   - Custom timing functions: `smooth`, `ease-smooth`, `ease-back`

## Color Scheme

### Light Mode
```
Primary:     #667eea (Blue)
Secondary:   #f093fb (Pink)
Accent:      #4facfe (Cyan)
Background:  White (#ffffff)
Text:        Dark Gray (#1a202c)
```

### Dark Mode
```
Primary:     #7c3aed (Adjusted Blue)
Secondary:   #ff69b4 (Adjusted Pink)
Accent:      #06b6d4 (Adjusted Cyan)
Background:  Very Dark (#0f172a)
Text:        Light Gray (#f1f5f9)
```

## Gradients

### Primary Gradient
- **Light:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Dark:** `linear-gradient(135deg, #4e7ff7 0%, #a78bfa 100%)`

### Secondary Gradient
- **Light:** `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
- **Dark:** `linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)`

### Accent Gradient
- **Light:** `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
- **Dark:** `linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)`

## Using Dark Mode in Components

### Method 1: Dark Mode CSS Classes

```jsx
export function Card() {
  return (
    <div className="
      bg-white dark:bg-slate-900
      text-gray-900 dark:text-gray-100
      border border-gray-200 dark:border-slate-700
    ">
      Content
    </div>
  );
}
```

### Method 2: Using CSS Variables

```jsx
export function Header() {
  return (
    <header style={{
      background: 'var(--gradient-primary)',
      color: 'hsl(var(--foreground))',
    }}>
      Header Content
    </header>
  );
}
```

### Method 3: Tailwind Color Values

```jsx
export function Button() {
  return (
    <button className="
      bg-primary text-primary-foreground
      hover:bg-primary/90
      dark:bg-primary dark:text-primary-foreground
    ">
      Click Me
    </button>
  );
}
```

## Implementation Checklist

### ✅ Completed
- [x] CSS custom properties defined for light/dark modes
- [x] Tailwind dark mode configured with class strategy
- [x] ThemeToggle component created and exported
- [x] Theme toggle integrated into all headers
- [x] Smooth transitions between themes
- [x] localStorage persistence
- [x] System preference detection
- [x] Enhanced gradients for dark mode
- [x] Responsive shadow system
- [x] Animation system with dark mode support

### 🔄 Testing Required
- [ ] Test theme switching on all pages
- [ ] Verify dark mode appearance on mobile devices
- [ ] Test theme persistence after page refresh
- [ ] Verify system preference detection
- [ ] Test animation transitions in dark mode
- [ ] Check text contrast ratios in dark mode

### 📝 Optional Enhancements
- [ ] Add theme scheduling (e.g., auto-switch at sunset)
- [ ] Add theme preview in settings
- [ ] Add custom theme creation
- [ ] Add theme animation transitions
- [ ] Add accessibility audit for contrast ratios

## Troubleshooting

### Theme Not Persisting
1. Check browser localStorage is enabled
2. Verify localStorage key is "theme"
3. Check browser console for errors

### Dark Mode Not Applying
1. Verify `.dark` class is on `document.documentElement`
2. Check Tailwind dark mode strategy: `darkMode: ["class"]`
3. Clear browser cache and rebuild

### Text Contrast Issues
1. Review CSS variables in `index.css`
2. Test with browser accessibility tools
3. Use WebAIM contrast checker

### Smooth Transitions Not Working
1. Verify CSS transitions in `App.css`
2. Check Tailwind transition utilities are available
3. Ensure transitionDuration is properly configured

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14.1+
- ✅ Mobile browsers (iOS Safari, Chrome Android)
- ✅ Fallback to light mode for older browsers

## Performance Tips

1. **Lazy load ThemeToggle** for faster initial page load
2. **Use CSS variables** instead of inline styles for better performance
3. **Leverage Tailwind's JIT** for optimal CSS generation
4. **Avoid unnecessary re-renders** in theme changes

## Related Files

```
client/
├── src/
│   ├── App.css                          # Global styles with dark mode
│   ├── index.css                        # CSS variables and theme definitions
│   ├── components/
│   │   ├── ui/theme-toggle.jsx         # Theme toggle component
│   │   ├── admin-view/header.jsx       # Uses ThemeToggle
│   │   ├── doctor-view/header.jsx      # Uses ThemeToggle
│   │   └── patient-view/header.jsx     # Uses ThemeToggle
│   ├── pages/
│   │   ├── admin-view/
│   │   ├── doctor-view/
│   │   └── patient-view/
├── tailwind.config.js                   # Tailwind configuration with dark mode
└── index.html                           # Contains html element for dark class
```

## Further Reading

- [Tailwind CSS Dark Mode Documentation](https://tailwindcss.com/docs/dark-mode)
- [CSS Custom Properties (CSS Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [prefers-color-scheme Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [Web Content Accessibility Guidelines (WCAG) - Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## Support

For theme-related issues or feature requests:
1. Check the troubleshooting section above
2. Review component source code
3. Check browser console for errors
4. Test in different browsers

---

**Last Updated:** 2024
**Tailwind Version:** 3.x
**Node Version:** 16+
