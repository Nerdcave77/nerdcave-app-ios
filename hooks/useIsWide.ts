import { useWindowDimensions } from 'react-native';

// True when the window is wide enough for the two-pane Duo layout
// (unfolded Duo, iPad, landscape tablets). Uses the live hook so
// folding/unfolding switches layouts instantly with no reload.
export function useIsWide(breakpoint = 768): boolean {
  const { width } = useWindowDimensions();
  return width >= breakpoint;
}
