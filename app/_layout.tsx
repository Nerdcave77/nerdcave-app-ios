import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  OneSignal,
  type NotificationClickEvent,
} from 'react-native-onesignal';
import { initOneSignal } from '@/lib/onesignal';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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

    SplashScreen.hideAsync();
    return () => {
      OneSignal.Notifications.removeEventListener('click', onNotificationClick);
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="article/[id]"
        options={{ headerShown: false, presentation: 'card' }}
      />
    </Stack>
  );
}
