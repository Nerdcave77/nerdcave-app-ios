import { useWindowDimensions } from 'react-native';

// True when the window is wide enough for the two-pane Duo layout
// (unfolded Duo, iPad, landscape tablets). Uses the live hook so
// folding/unfolding switches layouts instantly with no reload.
//
// The breakpoint is 600, not the usual 768: the unfolded iPhone Duo's
// inner display is about 669pt wide in portrait, so a 768 breakpoint
// would never trigger on the device this layout exists for. Portrait
// phones top out around 440pt, so 600 keeps them single-pane.
export function useIsWide(breakpoint = 600): boolean {
  const { width } = useWindowDimensions();
  return width >= breakpoint;
}
