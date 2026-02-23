import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/30 bg-white/5 hover:bg-white/15 transition-colors duration-150 cursor-pointer"
    >
      {isDark ? (
        <Moon className="w-4 h-4 text-white" />
      ) : (
        <Sun className="w-4 h-4 text-white" />
      )}
    </button>
  );
}

