import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('landdelay_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (_) {
      // In case localStorage is disabled or restricted
    }
    return 'dark'; // Default to Dark Mode for first-time visitors
  });

  useEffect(() => {
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#0B1320';
      root.style.colorScheme = 'dark';
      if (metaTheme) metaTheme.setAttribute('content', '#0B1320');
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#F5F7FA';
      root.style.colorScheme = 'light';
      if (metaTheme) metaTheme.setAttribute('content', '#F5F7FA');
    }
    try {
      localStorage.setItem('landdelay_theme', theme);
    } catch (_) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
