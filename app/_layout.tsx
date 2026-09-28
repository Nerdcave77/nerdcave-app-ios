import { useCallback, useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  OneSignal,
  type NotificationClickEvent,
} from 'react-native-onesignal';
import { initOneSignal } from '@/lib/onesignal';
import LaunchIntro from '@/components/LaunchIntro';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.setOptions({ duration: 250, fade: true });
SplashScreen.preventAutoHideAsync();

// Cold-start only: the comic-burst intro plays once per app launch,
// never on Fast Refresh or foregrounding.
let introPlayed = false;

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(() => !introPlayed);

  useEffect(() => {
    initOneSignal();

    // Tapping a push opens the article it points at.
    // Webhook sets data.postId and url https://app.nerdcave77.io/article/<id>.
    const onNotificationClick = (event: NotificationClickEvent) => {
      const data = event.notification.additionalData as
        | { postId?: string }
        | undefined;
      const postId = data?.postId;
      if (postId) {
        router.push(`/article/${encodeURIComponent(postId)}`);
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

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="article/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
      </Stack>
      {showIntro && <LaunchIntro onDone={handleIntroDone} />}
    </>
  );
}
