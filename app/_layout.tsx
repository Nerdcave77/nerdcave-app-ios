import { useCallback, useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  OneSignal,
  type NotificationClickEvent,
} from 'react-native-onesignal';
import { initOneSignal } from '@/lib/onesignal';
import { ThemeProvider, ThemedStatusBar } from '@/lib/theme';
import LaunchIntro from '@/components/LaunchIntro';
import EmailCaptureCard from '@/components/EmailCaptureCard';
import {
  getEmailPromptState,
  setEmailPromptState,
  type EmailPromptState,
} from '@/lib/newsletter';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.setOptions({ duration: 250, fade: true });
SplashScreen.preventAutoHideAsync();

// Email prompt is PARKED (Ceelow, 2026-10-23 reversal): the component and
// its state logic stay in the tree, unmounted. Flip to true to restore.
const EMAIL_PROMPT_ENABLED = false;

// Cold-start only: the comic-burst intro plays once per app launch,
// never on Fast Refresh or foregrounding.
let introPlayed = false;

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(() => !introPlayed);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  useEffect(() => {
    initOneSignal();

    // Tapping a push opens what it points at.
    // Webhook sets data.postId and url https://app.nerdcave77.io/article/<id>.
    // Drop reminders set data.dropId.
    const onNotificationClick = (event: NotificationClickEvent) => {
      const data = event.notification.additionalData as
        | { postId?: string; dropId?: string }
        | undefined;
      const postId = data?.postId;
      if (postId) {
        router.push(`/article/${encodeURIComponent(postId)}`);
        return;
      }
      const dropId = data?.dropId;
      if (dropId) {
        router.push(`/drop/${encodeURIComponent(dropId)}`);
      }
    };
    OneSignal.Notifications.addEventListener('click', onNotificationClick);

    return () => {
      OneSignal.Notifications.removeEventListener('click', onNotificationClick);
    };
  }, []);

  // Safety net: if the intro never renders, don't trap the native splash.
  useEffect(() => {
    if (!showIntro) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [showIntro]);

  const handleIntroDone = useCallback(() => {
    introPlayed = true;
    setShowIntro(false);
  }, []);

  // Soft first-launch email prompt (Ceelow, 2026-10-23): only when the
  // person has never answered it, and only a few seconds AFTER the
  // intro, so they land on the feed first and see the value. It never
  // blocks the app; Join and Not now both count as answered.
  useEffect(() => {
    if (showIntro) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    (async () => {
      const state = await getEmailPromptState();
      if (!active || state !== null) return;
      timer = setTimeout(() => {
        if (active) setShowEmailPrompt(true);
      }, 4000);
    })();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [showIntro]);

  const handleEmailPromptDone = useCallback((state: EmailPromptState) => {
    setShowEmailPrompt(false);
    void setEmailPromptState(state);
  }, []);

  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="article/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="drop/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
      </Stack>
      {showIntro && <LaunchIntro onDone={handleIntroDone} />}
      {EMAIL_PROMPT_ENABLED && showEmailPrompt && <EmailCaptureCard onDone={handleEmailPromptDone} />}
    </ThemeProvider>
  );
}
