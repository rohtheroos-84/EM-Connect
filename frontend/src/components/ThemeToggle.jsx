import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative inline-flex items-center justify-between w-20 h-8 rounded-full border border-white/20 bg-black/10 hover:bg-black/20 transition-colors duration-150 px-1 cursor-pointer"
    >
      <span
        className={`absolute inset-y-1 w-9 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)] transition-transform duration-200 ${
          isDark ? 'translate-x-[2.2rem]' : 'translate-x-0'
        }`}
      />
      <span className="relative flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
        <Sun className="w-3.5 h-3.5" />
        <span className={isDark ? 'opacity-40' : 'opacity-100'}>Light</span>
      </span>
      <span className="relative flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
        <span className={isDark ? 'opacity-100' : 'opacity-40'}>Dark</span>
        <Moon className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}

