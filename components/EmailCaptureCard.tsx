import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { looksLikeEmail, subscribeEmail } from '@/lib/newsletter';

/**
 * The soft first-launch email ask (Ceelow, 2026-10-23): a card that
 * floats above the tab bar a few seconds into the first session.
 * It never blocks the feed behind it. Join subscribes to the free
 * Nerdcave77 email through the backend; Not now dismisses it for
 * good (Settings keeps a join form for anyone who changes their mind).
 */
export default function EmailCaptureCard({
  onDone,
}: {
  onDone: (state: 'subscribed' | 'dismissed') => void;
}) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const join = async () => {
    if (!looksLikeEmail(email)) {
      setMessage('That email looks off. Check it and try again.');
      return;
    }
    setSending(true);
    setMessage(null);
    const ok = await subscribeEmail(email, 'ios-first-launch');
    setSending(false);
    if (ok) {
      onDone('subscribed');
    } else {
      setMessage('Could not sign you up just now. Check your connection and try again.');
    }
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.headRow}>
          <Text style={styles.title}>Never miss a drop</Text>
          <Pressable
            onPress={() => onDone('dismissed')}
            hitSlop={10}
            accessibilityLabel="Not now"
          >
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.body}>
          Get the free Nerdcave77 email: big sales, drops and market moves, in your inbox.
        </Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          placeholderTextColor="rgba(255,255,255,0.45)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          editable={!sending}
        />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.notNow}
            onPress={() => onDone('dismissed')}
            disabled={sending}
          >
            <Text style={styles.notNowText}>Not now</Text>
          </Pressable>
          <Pressable style={styles.join} onPress={join} disabled={sending}>
            {sending ? (
              <ActivityIndicator color={COLORS.card} size="small" />
            ) : (
              <Text style={styles.joinText}>Join free</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
    // Clear the bottom tab bar on phones; on the Duo rail layout this
    // just floats a little higher, which still reads fine.
    paddingBottom: 104,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.55)',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '900',
  },
  close: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  body: {
    color: COLORS.muted,
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 5,
  },
  input: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.white,
    fontSize: 15,
  },
  message: {
    color: COLORS.yellow,
    fontSize: 12.5,
    marginTop: 8,
    lineHeight: 17,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 13,
  },
  notNow: {
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  notNowText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  join: {
    flex: 1,
    backgroundColor: COLORS.yellow,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  joinText: {
    color: COLORS.card,
    fontSize: 15,
    fontWeight: '900',
  },
});
