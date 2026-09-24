import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { COLORS } from '@/constants/theme';
import { isPushOptedIn, requestPushPermission } from '@/lib/onesignal';

type State = 'idle' | 'working' | 'done' | 'unsupported';

/**
 * Tags the native OneSignal player with drop_<id> so the scheduled reminder
 * job (same OneSignal app as the web reader) sends 1h + 15m pushes.
 * On mount we read the player's tags so the state survives app restarts.
 */
export default function DropRemindButton({ dropId }: { dropId: string }) {
  const [state, setState] = useState<State>('idle');
  const tagKey = `drop_${dropId}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tags = await OneSignal.User.getTags();
        if (!cancelled && tags && tags[tagKey]) setState('done');
      } catch {
        // Leave as idle; the tap will surface any real problem.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tagKey]);

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
      OneSignal.User.addTag(tagKey, '1');
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
