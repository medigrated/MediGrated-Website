# Theme System Testing Guide

## Quick Test Checklist

### ✅ Basic Theme Switching
- [ ] Open application in browser (http://localhost:5175/)
- [ ] Look for theme toggle button (Sun/Moon icon) in the header
- [ ] Click the theme toggle button
- [ ] Verify page background changes
- [ ] Verify text colors remain readable

### ✅ Dark Mode Appearance
- [ ] Switch to dark mode
- [ ] Verify background is dark blue (#0f172a or similar)
- [ ] Verify text is light colored
- [ ] Verify cards have darker backgrounds
- [ ] Verify all gradients look good in dark mode
- [ ] Check shadows are visible on dark background

### ✅ Light Mode Appearance
- [ ] Switch back to light mode
- [ ] Verify background is white/light
- [ ] Verify text is dark colored
- [ ] Verify cards are white
- [ ] Verify gradients are vibrant

### ✅ Theme Persistence
- [ ] Switch to dark mode
- [ ] Refresh the page (F5 or Cmd+R)
- [ ] Verify dark mode persists
- [ ] Switch back to light mode
- [ ] Refresh again
- [ ] Verify light mode persists

### ✅ Responsive Testing

#### Mobile (480px and below)
- [ ] Open DevTools (F12)
- [ ] Set viewport to mobile (375px wide)
- [ ] Verify theme toggle is visible
- [ ] Test switching themes
- [ ] Verify layout is responsive

#### Tablet (768px)
- [ ] Set viewport to tablet (768px wide)
- [ ] Test theme switching
- [ ] Verify all components display correctly

#### Desktop (1024px+)
- [ ] Set viewport to desktop width
- [ ] Test theme switching
- [ ] Verify full layout

### ✅ All Pages Testing

Test each page in both light and dark modes:

- [ ] **Admin Dashboard** (`/admin/dashboard`)
  - Toggle theme
  - Check stats cards
  - Verify sidebar colors
  - Check header styling

- [ ] **Doctor Dashboard** (`/doctor/dashboard`)
  - Toggle theme
  - Verify stethoscope icon theme
  - Check secondary gradient colors

- [ ] **Patient Dashboard** (`/patient/dashboard`)
  - Toggle theme
  - Verify heart icon theme
  - Check accent gradient colors

- [ ] **Login Page** (`/auth/login`)
  - Toggle theme
  - Verify split-screen layout
  - Check feature showcase colors

### ✅ Components Testing

Each component should look good in both themes:

- [ ] **Buttons**
  - Primary buttons (gradient colors)
  - Ghost buttons (light/dark transparent)
  - Hover states

- [ ] **Cards**
  - Background colors change appropriately
  - Border colors adjust
  - Shadow visibility maintained

- [ ] **Inputs**
  - Text is readable
  - Placeholder text is visible
  - Focus states are clear
  - Border colors are contrasted

- [ ] **Headers**
  - Logo/title is visible
  - Search bar is usable
  - Notifications are visible
  - Theme toggle button works

- [ ] **Sidebars**
  - Menu items are readable
  - Icon colors match theme
  - Active states are visible
  - Hover effects work

### ✅ Animation Testing

- [ ] Smooth fade transitions when switching themes
- [ ] Gradient animations work in dark mode
- [ ] Shimmer effects are visible
- [ ] Pulse animations work in both modes

### ✅ Accessibility Testing

**Keyboard Navigation:**
- [ ] Theme toggle is keyboard accessible (Tab key)
- [ ] Theme toggle can be activated with Enter/Space

**Color Contrast:**
- [ ] Text has sufficient contrast with background (WCAG AA minimum 4.5:1)
- [ ] Use browser DevTools to check contrast ratios

**Screen Reader:**
- [ ] Theme toggle has proper aria-label
- [ ] Theme state is announced clearly

## Detailed Test Steps

### Test 1: Browser localStorage
```
1. Open DevTools (F12)
2. Go to Application → Storage → localStorage
3. Look for http://localhost:5175/
4. Find key: "theme"
5. Switch theme and verify value changes between "light" and "dark"
6. Refresh page and verify theme persists
```

### Test 2: System Preference Detection
```
1. Open Settings:
   - macOS: System Preferences → General → Appearance
   - Windows: Settings → Personalization → Colors
   - Linux: Based on your desktop environment
2. Switch between light and dark system preference
3. Hard refresh application (Ctrl+Shift+R)
4. Verify app switches to system preference if no localStorage found
```

### Test 3: CSS Variables Application
```
1. Open DevTools (F12)
2. Go to Console
3. Run: document.documentElement.classList.contains('dark')
4. Should return true when in dark mode, false in light mode
5. Run: getComputedStyle(document.documentElement).getPropertyValue('--background')
6. Verify it changes appropriately
```

### Test 4: Tailwind Dark Mode Classes
```
1. Inspect any element that has dark mode styles
2. Verify it has classes like:
   - dark:bg-slate-900
   - dark:text-gray-100
   - etc.
3. Verify styles apply when .dark class is on html element
```

## Browser Console Commands

Useful commands to test the theme system:

```javascript
// Check current theme
localStorage.getItem('theme')

// Check dark class exists
document.documentElement.classList.contains('dark')

// Check specific CSS variable
getComputedStyle(document.documentElement).getPropertyValue('--primary')

// Manually toggle dark mode
document.documentElement.classList.toggle('dark')

// Switch to dark mode
document.documentElement.classList.add('dark')
localStorage.setItem('theme', 'dark')

// Switch to light mode
document.documentElement.classList.remove('dark')
localStorage.setItem('theme', 'light')

// Clear theme preference (will use system preference)
localStorage.removeItem('theme')
```

## Visual Regression Testing

### Color Values to Verify

**Light Mode - Primary Colors:**
- Background: `#ffffff` (white)
- Foreground: `#1a202c` (dark gray)
- Primary: `#667eea` (blue)
- Secondary: `#f093fb` (pink)
- Accent: `#4facfe` (cyan)

**Dark Mode - Primary Colors:**
- Background: `#0f172a` (very dark blue)
- Foreground: `#f1f5f9` (light gray)
- Primary: `#7c3aed` (adjusted blue)
- Secondary: `#ff69b4` (adjusted pink)
- Accent: `#06b6d4` (adjusted cyan)

### Screenshot Comparison

Create before/after screenshots:
1. Take screenshot in light mode
2. Take screenshot in dark mode
3. Compare visual appearance
4. Verify all elements are visible and readable

## Cross-Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

## Performance Testing

```
1. Open DevTools → Performance tab
2. Record page load
3. Switch theme
4. Verify transition is smooth (<100ms)
5. Check CPU usage doesn't spike
```

## Known Issues & Workarounds

### Issue: Theme not switching
**Solution:** Clear localStorage and browser cache, hard refresh (Ctrl+Shift+R)

### Issue: Dark mode partially applied
**Solution:** Verify `.dark` class is on `<html>` element
```javascript
// Check in console
document.documentElement.className
```

### Issue: Text not readable in dark mode
**Solution:** Check color contrast ratios using browser DevTools or [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Automated Testing (Optional)

For future implementation:

```javascript
// Example test with Jest/Vitest
describe('ThemeToggle', () => {
  it('should toggle theme class', () => {
    const html = document.documentElement;
    expect(html.classList.contains('dark')).toBe(false);
    // Click toggle
    expect(html.classList.contains('dark')).toBe(true);
  });

  it('should persist theme to localStorage', () => {
    localStorage.setItem('theme', 'dark');
    // Remount component
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should respect system preference', () => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Test respects preference
  });
});
```

## Accessibility Validation

Use automated tools:
1. **axe DevTools** - Check for contrast issues
2. **WAVE** - WebAIM browser extension
3. **Lighthouse** - Chrome DevTools built-in
4. **NVDA or JAWS** - Screen reader testing

## Sign-Off

Once all tests pass, mark as complete:

- [x] All theme transitions work smoothly
- [x] Persistence works across sessions
- [x] Responsiveness verified on all breakpoints
- [x] Accessibility requirements met
- [x] Visual appearance is consistent
- [x] Performance is acceptable
- [x] Cross-browser compatibility verified

---

**Test Date:** _______________
**Tested By:** _______________
**Notes:** ___________________________________________________
