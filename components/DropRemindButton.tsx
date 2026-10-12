import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, COLORS } from '@/constants/theme';
import { isPushOptedIn, requestPushPermission } from '@/lib/onesignal';

type State = 'idle' | 'working' | 'done' | 'unsupported';

const STORE_KEY = 'nerdcave77:drop-reminders';

/**
 * Reminder state is stored locally (AsyncStorage) as the source of truth for
 * the button UI, and registered server-side (keyed by the OneSignal push
 * subscription ID) so the scheduled reminder job can target this device.
 *
 * Server-side registration exists because client-side OneSignal tags proved
 * unreliable: tags set from this app never synced to OneSignal's backend, so
 * tag-targeted reminder pushes never arrived.
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

async function getPlayerId(): Promise<string | null> {
  try {
    return await OneSignal.User.pushSubscription.getIdAsync();
  } catch {
    return null;
  }
}

async function registerServer(dropId: string, playerId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/drops/reminders/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dropId, playerId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function DropRemindButton({ dropId }: { dropId: string }) {
  const [state, setState] = useState<State>('idle');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Local state first — instant and reliable across restarts.
      const local = await readLocal();
      if (!cancelled && local[dropId]) {
        setState('done');
      }
      // 2. Self-heal: if the button thinks a reminder is on but the server
      // has no registration (e.g. the POST failed), re-register now.
      if (local[dropId]) {
        try {
          const playerId = await getPlayerId();
          if (!playerId || cancelled) return;
          const res = await fetch(
            `${API_BASE_URL}/drops/reminders/status?dropId=${encodeURIComponent(dropId)}&playerId=${encodeURIComponent(playerId)}`
          );
          const body = (await res.json()) as { registered?: boolean };
          if (!cancelled && res.ok && body.registered === false) {
            await registerServer(dropId, playerId);
          }
        } catch {
          // Best-effort; a later launch retries.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dropId]);

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
      const playerId = await getPlayerId();
      // Local first so the UI never lies.
      const local = await readLocal();
      await writeLocal({ ...local, [dropId]: true });
      if (playerId) {
        // The server registration is what the scheduled job targets.
        const ok = await registerServer(dropId, playerId);
        if (!ok) {
          // Retry once; the mount self-heal covers anything still missing.
          await registerServer(dropId, playerId);
        }
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
