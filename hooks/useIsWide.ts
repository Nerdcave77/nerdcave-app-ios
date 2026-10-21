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

// Ceelow's Duo layout rules (2026-10-21):
// - Wide screen upright (portrait): single pane (Feed / the current tab
//   on its own) with the tab buttons on a right side rail.
// - Wide screen sideways (landscape): two panes, Feed on the left and
//   Market/Drops on the right, rail still on the right.
// - Narrow screens: single pane with the standard bottom bar.
// So the split (DuoHome) is gated on wide AND landscape, while the rail
// in the tabs layout is gated on wide alone.
export function useIsWideLandscape(breakpoint = 600): boolean {
  const { width, height } = useWindowDimensions();
  return width >= breakpoint && width > height;
}

// Ceelow's rule (2026-10-21): the Duo gets the right side rail in every
// posture, folded included, while regular iPhones keep the bottom bar.
// Apps cannot ask "is this a Duo", so the folded Duo is recognized by
// its screen shape: about 466pt wide (every iPhone is 440pt or less)
// and much squarer than a phone (height/width about 1.45, phones are
// about 2.1). Wide screens (600+) always get the rail.
export function useShowsSideRail(): boolean {
  const { width, height } = useWindowDimensions();
  if (width >= 600) {
    return true;
  }
  const foldedDuoShape = width >= 450 && height / width < 1.7;
  return foldedDuoShape;
}
