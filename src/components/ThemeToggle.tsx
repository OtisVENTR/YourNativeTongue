/**
 * Theme Toggle Component
 * Allows users to switch between light and dark modes
 */

import { useTheme } from '../hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: '1px solid var(--color-border-primary)',
        backgroundColor: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
};

