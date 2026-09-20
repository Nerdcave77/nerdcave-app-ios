import {
  OneSignal,
  type NotificationWillDisplayEvent,
} from 'react-native-onesignal';
import { ONESIGNAL_APP_ID } from '@/constants/theme';

let initialized = false;

/** Initialize the OneSignal native SDK once. Safe to call multiple times. */
export function initOneSignal() {
  if (initialized) return;
  initialized = true;
  OneSignal.initialize(ONESIGNAL_APP_ID);
  // Show notifications as banners even when the app is in the foreground.
  // (Default display applies unless preventDefault() is called.)
  OneSignal.Notifications.addEventListener(
    'foregroundWillDisplay',
    (event: NotificationWillDisplayEvent) => {
      event.getNotification();
    }
  );
}

/** Prompt for push permission. Returns true if permission was granted. */
export async function requestPushPermission(): Promise<boolean> {
  return OneSignal.Notifications.requestPermission(true);
}

export async function isPushOptedIn(): Promise<boolean> {
  try {
    return await OneSignal.User.pushSubscription.getOptedInAsync();
  } catch {
    return false;
  }
}

export async function setPushOptedIn(optIn: boolean): Promise<void> {
  if (optIn) {
    OneSignal.User.pushSubscription.optIn();
  } else {
    OneSignal.User.pushSubscription.optOut();
  }
}
