// client/src/components/ui/theme-toggle.jsx
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ThemeToggle Component
 * 
 * Manages light/dark mode switching with the following features:
 * - Toggles between 'light' and 'dark' themes
 * - Persists theme preference to localStorage under 'theme' key
 * - Respects system color scheme preference on first load
 * - Updates document.documentElement.classList for Tailwind dark mode
 * - Smooth transitions between themes via CSS variables
 * 
 * Usage:
 * <ThemeToggle />
 * 
 * Props:
 * - size (number): Icon size in pixels (default: 16)
 * - className (string): Additional Tailwind classes for the button
 */

function ThemeToggle({ size = 16, className = "" }) {
  const [theme, setTheme] = useState(() => {
    try {
      // Try to get theme from localStorage
      const saved = localStorage.getItem("theme");
      if (saved) {
        return saved;
      }
      
      // Fall back to system preference
      if (window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      
      return "light";
    } catch (e) {
      // If localStorage is not available, default to light
      return "light";
    }
  });

  const [mounted, setMounted] = useState(false);

  // Initialize theme on component mount
  useEffect(() => {
    setMounted(true);
    
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!window.matchMedia) return;

    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e) => {
      const newTheme = e.matches ? "dark" : "light";
      setTheme(newTheme);
    };

    // Modern browsers
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener("change", handleChange);
      return () => darkModeQuery.removeEventListener("change", handleChange);
    }
    
    // Legacy browsers
    darkModeQuery.addListener(handleChange);
    return () => darkModeQuery.removeListener(handleChange);
  }, []);

  const toggle = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Toggle theme"
        className={className}
      >
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`transition-colors duration-300 ${className}`}
      title={`Current theme: ${theme}`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300" />
      )}
    </Button>
  );
}

export { ThemeToggle };
export default ThemeToggle;

