import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'luxury' | 'lux-light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'luxury',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('tk-theme') as Theme) || 'luxury';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tk-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'luxury' ? 'lux-light' : 'luxury');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
