import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import {
  isPushOptedIn,
  requestPushPermission,
  setPushOptedIn,
} from '@/lib/onesignal';
import {
  getEmailPromptState,
  looksLikeEmail,
  setEmailPromptState,
  subscribeEmail,
} from '@/lib/newsletter';

// Email join card is PARKED (Ceelow, 2026-10-23 reversal): code stays in
// the tree, unmounted. Flip to true to restore.
const EMAIL_JOIN_ENABLED = false;

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const [alertsOn, setAlertsOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailJoined, setEmailJoined] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const optedIn = await isPushOptedIn();
      if (active) setAlertsOn(optedIn);
      const promptState = await getEmailPromptState();
      if (active && promptState === 'subscribed') setEmailJoined(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const joinEmail = useCallback(async () => {
    if (!looksLikeEmail(email)) {
      setEmailStatus('That email looks off. Check it and try again.');
      return;
    }
    setEmailBusy(true);
    setEmailStatus(null);
    const ok = await subscribeEmail(email, 'ios-settings');
    setEmailBusy(false);
    if (ok) {
      await setEmailPromptState('subscribed');
      setEmailJoined(true);
      setEmailStatus('You are on the list. Welcome in.');
    } else {
      setEmailStatus('Could not sign you up just now. Try again in a bit.');
    }
  }, [email]);

  const onToggle = useCallback(
    async (value: boolean) => {
      setProcessing(true);
      setStatus(null);
      try {
        if (value) {
          setStatus('Requesting permission…');
          const granted = await requestPushPermission();
          if (!granted) {
            setStatus(
              'Permission denied — enable notifications in iOS Settings to turn alerts on.'
            );
            setAlertsOn(false);
            return;
          }
          await setPushOptedIn(true);
          setAlertsOn(true);
          setStatus('Alerts on — you’ll get a push for every new story.');
        } else {
          await setPushOptedIn(false);
          setAlertsOn(false);
          setStatus('Alerts off.');
        }
      } catch {
        setStatus('Something went wrong. Please try again.');
      } finally {
        setProcessing(false);
      }
    },
    []
  );

  const openSite = useCallback(() => {
    WebBrowser.openBrowserAsync('https://nerdcave77.io');
  }, []);

  const openSupport = useCallback(() => {
    WebBrowser.openBrowserAsync('https://app.nerdcave77.io/support');
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.ink }]}>Settings</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>New article alerts</Text>
              <Text style={styles.rowSubtitle}>
                Push notification when a story publishes
              </Text>
            </View>
            {processing ? (
              <ActivityIndicator color={COLORS.yellow} />
            ) : (
              <Switch
                value={alertsOn}
                onValueChange={onToggle}
                trackColor={{ false: 'rgba(255,255,255,0.25)', true: COLORS.yellow }}
                thumbColor={COLORS.white}
              />
            )}
          </View>
          {!!status && <Text style={styles.status}>{status}</Text>}
        </View>

        {EMAIL_JOIN_ENABLED && (
        <View style={styles.card}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Free Nerdcave77 email</Text>
            <Text style={styles.rowSubtitle}>
              Big sales, drops and market moves, in your inbox
            </Text>
          </View>
          {emailJoined ? (
            <Text style={styles.status}>You are on the list. Welcome in.</Text>
          ) : (
            <>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor="rgba(255,255,255,0.45)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!emailBusy}
              />
              <Pressable
                style={styles.joinButton}
                onPress={joinEmail}
                disabled={emailBusy}
              >
                {emailBusy ? (
                  <ActivityIndicator color={COLORS.card} size="small" />
                ) : (
                  <Text style={styles.joinButtonText}>Join free</Text>
                )}
              </Pressable>
              {!!emailStatus && <Text style={styles.status}>{emailStatus}</Text>}
            </>
          )}
        </View>
        )}

        <Pressable style={styles.card} onPress={openSupport}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Support</Text>
              <Text style={styles.rowSubtitle}>Help with the Nerdcave77 apps</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>

        {/* Dark mode under Support, matching the web Settings layout
            (Ceelow, 2026-10-29). */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Dark mode</Text>
              <Text style={styles.rowSubtitle}>
                Deep navy background, easy on the eyes at night
              </Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={(value) => setMode(value ? 'dark' : 'light')}
              trackColor={{ false: 'rgba(255,255,255,0.25)', true: COLORS.yellow }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <Pressable style={styles.card} onPress={openSite}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Visit nerdcave77.io</Text>
              <Text style={styles.rowSubtitle}>The Nerdcave77 website</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.ink }]}>
            Nerdcave77 — your go-to for digital &amp; physical collectibles news
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  rowSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    color: COLORS.yellow,
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  emailInput: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.white,
    fontSize: 15,
  },
  joinButton: {
    marginTop: 10,
    backgroundColor: COLORS.yellow,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  joinButtonText: {
    color: COLORS.card,
    fontSize: 15,
    fontWeight: '900',
  },
  chevron: {
    color: COLORS.muted,
    fontSize: 28,
    fontWeight: '300',
  },
  footer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  footerText: {
    color: COLORS.ink,
    opacity: 0.6,
    fontSize: 12,
    textAlign: 'center',
  },
});
