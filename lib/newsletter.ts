import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/theme';

// Soft first-launch email capture (Ceelow, 2026-10-23). The prompt
// shows ONCE, a few seconds after the first launch, and never blocks
// the app: Join sends the email to Beehiiv through our own backend
// (the Beehiiv key never lives in the app), Not now just closes it.
// Either answer is remembered on the device; people who skipped can
// still join later from Settings.

const KEY = 'nerdcave77.emailPrompt.v1';

export type EmailPromptState = 'subscribed' | 'dismissed';

export async function getEmailPromptState(): Promise<EmailPromptState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw === 'subscribed' || raw === 'dismissed' ? raw : null;
  } catch {
    return null;
  }
}

export async function setEmailPromptState(state: EmailPromptState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, state);
  } catch {
    // Storage failure should never break the app.
  }
}

/** Subscribe an email via the web backend. Returns true on success. */
export async function subscribeEmail(
  email: string,
  source: 'ios-first-launch' | 'ios-settings'
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), source }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
