# Theme System Quick Reference

## 🚀 Quick Commands

### Development
```bash
# Start frontend dev server
cd client && npm run dev

# Start backend server
cd server && npm start

# Build for production
cd client && npm run build

# Preview production build
cd client && npm run preview
```

### Theme Actions (Browser Console)
```javascript
// Check current theme
localStorage.getItem('theme')

// Force dark mode
document.documentElement.classList.add('dark')
localStorage.setItem('theme', 'dark')

// Force light mode
document.documentElement.classList.remove('dark')
localStorage.setItem('theme', 'light')

// Toggle theme
document.documentElement.classList.toggle('dark')

// Clear theme preference
localStorage.removeItem('theme')

// Check if dark mode is active
document.documentElement.classList.contains('dark')
```

## 🎨 Common Styling Patterns

### Pattern 1: Basic Dark Mode
```jsx
<div className="bg-white dark:bg-slate-900">
  Light/Dark background
</div>
```

### Pattern 2: With Text Color
```jsx
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
  Content with proper contrast
</div>
```

### Pattern 3: Using CSS Variables
```jsx
<div style={{
  background: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
}}>
  Uses CSS variables for theming
</div>
```

### Pattern 4: Cards
```jsx
<div className="
  bg-white dark:bg-slate-900
  border border-gray-200 dark:border-slate-700
  rounded-lg shadow-soft dark:shadow-medium
">
  Card content
</div>
```

### Pattern 5: Buttons
```jsx
<button className="
  bg-primary hover:bg-primary/90
  text-primary-foreground
  dark:bg-primary dark:text-primary-foreground
">
  Themed button
</button>
```

### Pattern 6: Inputs
```jsx
<input className="
  bg-white dark:bg-slate-900
  border border-gray-300 dark:border-slate-600
  text-gray-900 dark:text-gray-100
  placeholder-gray-500 dark:placeholder-gray-400
"/>
```

### Pattern 7: Using Tailwind Colors
```jsx
<div className="
  bg-background text-foreground
  dark:bg-background dark:text-foreground
">
  Uses predefined theme colors
</div>
```

### Pattern 8: With Gradients
```jsx
<div className="
  bg-gradient-primary
  dark:bg-gradient-primary
">
  Gradient background (works in both modes)
</div>
```

## 📊 CSS Variables Quick Reference

### Color Variables
```css
--background         /* Page background */
--foreground        /* Primary text */
--card              /* Card backgrounds */
--primary           /* Brand color */
--secondary         /* Secondary color */
--accent            /* Highlight color */
--destructive       /* Error color */
--border            /* Border color */
--input             /* Input backgrounds */
--ring              /* Focus ring */
```

### Gradient Variables
```css
--gradient-primary   /* Blue-purple gradient */
--gradient-secondary /* Pink-red gradient */
--gradient-accent    /* Cyan-teal gradient */
```

### Shadow Variables
```css
--shadow-soft       /* Subtle shadows */
--shadow-medium     /* Medium shadows */
--shadow-large      /* Prominent shadows */
```

## 🎯 Component Examples

### ThemeToggle Placement
```jsx
// In header
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  return (
    <header className="flex justify-between items-center">
      <Logo />
      <ThemeToggle />
    </header>
  );
}
```

### Creating Theme-Aware Component
```jsx
export function MyComponent() {
  return (
    <div className="
      p-6
      bg-white dark:bg-slate-900
      rounded-lg
      border border-gray-200 dark:border-slate-700
      shadow-soft dark:shadow-medium
    ">
      <h2 className="text-gray-900 dark:text-gray-100 text-xl font-bold">
        Heading
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        Description
      </p>
    </div>
  );
}
```

## 🔍 Debugging

### Check Theme Status
```javascript
// In console
const isDark = document.documentElement.classList.contains('dark');
console.log('Dark mode active:', isDark);
```

### View CSS Variables
```javascript
// In console
const styles = getComputedStyle(document.documentElement);
console.log('Primary color:', styles.getPropertyValue('--primary'));
console.log('Background:', styles.getPropertyValue('--background'));
```

### Force Reload Theme
```javascript
// In console
const theme = localStorage.getItem('theme') || 'light';
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
```

## 📱 Responsive Breakpoints

```tailwind
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Usage
```jsx
<div className="
  text-sm md:text-base lg:text-lg
  p-2 md:p-4 lg:p-6
">
  Responsive sizing
</div>
```

## ⚡ Performance Tips

1. **Use CSS variables** instead of inline styles
2. **Leverage Tailwind classes** for consistency
3. **Minimize re-renders** with proper memoization
4. **Avoid inline theme logic** in components
5. **Use CSS for transitions** instead of JavaScript

## 🎯 Common Tasks

### Add Dark Mode to New Component
```jsx
// 1. Identify all colors/states
// 2. Add dark: classes
// 3. Test in both modes

<div className="
  bg-white dark:bg-slate-900
  text-gray-900 dark:text-gray-100
  border border-gray-200 dark:border-slate-700
">
  Content
</div>
```

### Update Color Scheme
1. Edit `client/src/index.css`
2. Update `:root` for light mode
3. Update `.dark` for dark mode
4. Test in both modes

### Add New Animation
1. Add keyframes in `tailwind.config.js`
2. Add animation in theme.extend.animation
3. Use with `animate-name` class
4. Test performance

## 🧪 Testing Checklist

- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Theme persists after reload
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Text is readable
- [ ] No console errors
- [ ] Touch works on mobile
- [ ] Keyboard navigation works

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| THEME_SETUP.md | Complete technical documentation |
| THEME_TESTING.md | Testing procedures and checklist |
| THEME_IMPLEMENTATION_SUMMARY.md | Overview and status |
| This file | Quick reference guide |

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Theme not switching | Clear cache & reload |
| Theme not persisting | Check localStorage enabled |
| Text not readable | Check contrast ratios |
| Styles not applying | Verify Tailwind class syntax |
| Dark mode not visible | Check .dark class on html element |
| Build errors | Run `npm install` and `npm run dev` |

## 🎨 Color Palette

### Light Mode (Use in designs)
- Background: #FFFFFF
- Text: #1A202C
- Primary: #667EEA
- Secondary: #F093FB
- Accent: #4FACFE
- Border: #E2E8F0

### Dark Mode (Use in designs)
- Background: #0F172A
- Text: #F1F5F9
- Primary: #7C3AED
- Secondary: #FF69B4
- Accent: #06B6D4
- Border: #1E293B

## 📞 Need Help?

1. Check **THEME_SETUP.md** for technical details
2. Review **THEME_TESTING.md** for common issues
3. Search this file for quick answers
4. Check browser console for errors
5. Verify all files are in place

---

**Last Updated:** 2024
**Status:** Ready to Use ✅
