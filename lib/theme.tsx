import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'nc-theme';

// Full palette for one appearance. Brand tokens (card, cardDeep, yellow,
// white, muted) are shared: navy cards look the same in both modes, so
// white/muted text on cards never needs to flip. Only colors that sit on
// the app background or on the article surface change with the mode.
export interface Palette {
  background: string;
  ink: string;
  articleBg: string;
  articleText: string;
  link: string;
  mutedDark: string;
  shareButtonBg: string;
  errorOnBackground: string;
  card: string;
  cardDeep: string;
  yellow: string;
  white: string;
  muted: string;
}

const SHARED = {
  card: COLORS.card,
  cardDeep: COLORS.cardDeep,
  yellow: COLORS.yellow,
  white: COLORS.white,
  muted: COLORS.muted,
};

// Light is the original look, unchanged: light gray background, navy
// cards, dark text. articleBg is the article reader card surface, which
// is white today (the COLORS.articleBg token was never used by native
// screens), so light keeps it white to stay pixel-identical.
export const LIGHT_PALETTE: Palette = {
  ...SHARED,
  background: COLORS.background,
  ink: COLORS.ink,
  articleBg: '#ffffff',
  articleText: COLORS.ink,
  link: '#1d4ed8',
  mutedDark: COLORS.mutedDark,
  shareButtonBg: '#eef1f5',
  errorOnBackground: '#7a1f1f',
};

// Dark: deep navy-black background, near-white text, dark article
// surface with light body text. Cards stay navy.
export const DARK_PALETTE: Palette = {
  ...SHARED,
  background: '#070b16',
  ink: '#f2f5fa',
  articleBg: '#0d1526',
  articleText: '#e8edf5',
  link: '#7aa5ff',
  mutedDark: '#9aa7ba',
  shareButtonBg: 'rgba(255,255,255,0.08)',
  errorOnBackground: '#f87171',
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: LIGHT_PALETTE,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Load the saved choice once on launch; default stays light.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && (raw === 'dark' || raw === 'light')) {
          setModeState(raw);
        }
      } catch {
        // Keep the light default if storage is unavailable.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE,
      setMode,
      toggle,
    }),
    [mode, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// Status bar content follows the mode: dark text on the light gray
// background (as today), light text on the dark background.
export function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}
