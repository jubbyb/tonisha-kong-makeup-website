import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'styleja' | 'styleja-dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'styleja',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('sj-theme') as Theme) || 'styleja';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sj-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'styleja' ? 'styleja-dark' : 'styleja'));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
