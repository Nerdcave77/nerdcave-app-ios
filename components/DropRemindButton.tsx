import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/theme';
import { isPushOptedIn, requestPushPermission } from '@/lib/onesignal';

type State = 'idle' | 'working' | 'done' | 'unsupported';

const STORE_KEY = 'nerdcave77:drop-reminders';

/**
 * Reminder state is stored locally (AsyncStorage) as the source of truth for
 * the button UI, and mirrored to a OneSignal `drop_<id>` tag so the scheduled
 * server job can target reminder pushes.
 *
 * Local-first because OneSignal's getTags() can come back empty on a cold
 * start before the SDK finishes restoring the user — which made the button
 * "forget" reminders after the app was closed. On mount we also reconcile:
 * adopt tags found on the OneSignal user but missing locally (e.g. set from
 * the web app), and re-push local reminders whose tag never reached OneSignal.
 */
async function readLocal(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

async function writeLocal(map: Record<string, boolean>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    // UI already updated; a missed write just means re-tapping next launch.
  }
}

export default function DropRemindButton({ dropId }: { dropId: string }) {
  const [state, setState] = useState<State>('idle');
  const tagKey = `drop_${dropId}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Local state first — instant and reliable across restarts.
      const local = await readLocal();
      if (!cancelled && local[dropId]) {
        setState('done');
      }
      // 2. Reconcile with OneSignal in the background. The SDK can need a
      // moment on cold start, so retry once after a short delay.
      for (let attempt = 0; attempt < 2 && !cancelled; attempt++) {
        try {
          const tags = await OneSignal.User.getTags();
          const hasTag = !!(tags && tags[tagKey]);
          if (hasTag && !local[dropId]) {
            const next = { ...local, [dropId]: true };
            await writeLocal(next);
            if (!cancelled) setState('done');
          } else if (!hasTag && local[dropId]) {
            OneSignal.User.addTag(tagKey, '1');
          }
          break;
        } catch {
          if (attempt === 0) await new Promise((r) => setTimeout(r, 2500));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dropId, tagKey]);

  const remind = async () => {
    setState('working');
    try {
      if (!(await isPushOptedIn())) {
        const granted = await requestPushPermission();
        if (!granted) {
          setState('unsupported');
          return;
        }
      }
      // Local first so the UI never lies, then mirror to OneSignal.
      const local = await readLocal();
      await writeLocal({ ...local, [dropId]: true });
      OneSignal.User.addTag(tagKey, '1');
      // Verify the tag landed; retry once if the SDK swallowed it.
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const tags = await OneSignal.User.getTags();
        if (!(tags && tags[tagKey])) OneSignal.User.addTag(tagKey, '1');
      } catch {
        // Verification is best-effort; the mount reconciliation heals it later.
      }
      setState('done');
    } catch {
      setState('unsupported');
    }
  };

  if (state === 'done') {
    return (
      <Text style={styles.done}>
        <Text style={styles.check}>✓ </Text>Reminder on
      </Text>
    );
  }

  return (
    <Pressable
      onPress={remind}
      disabled={state === 'working'}
      style={({ pressed }) => [
        styles.button,
        state === 'unsupported' && styles.buttonDisabled,
        pressed && state === 'idle' && styles.buttonPressed,
      ]}
    >
      {state === 'working' ? (
        <ActivityIndicator size="small" color={COLORS.cardDeep} />
      ) : (
        <Text style={styles.buttonText}>
          {state === 'unsupported'
            ? 'Enable push in Settings'
            : `🔔 Remind me`}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.cardDeep,
    fontSize: 14,
    fontWeight: '800',
  },
  done: {
    backgroundColor: 'rgba(255,214,10,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: COLORS.yellow,
    fontSize: 14,
    fontWeight: '800',
    overflow: 'hidden',
  },
  check: {
    color: COLORS.yellow,
  },
});
