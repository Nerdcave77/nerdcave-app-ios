import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/theme';
import {
  isPushOptedIn,
  requestPushPermission,
  setPushOptedIn,
} from '@/lib/onesignal';

export default function SettingsScreen() {
  const [alertsOn, setAlertsOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const optedIn = await isPushOptedIn();
      if (active) setAlertsOn(optedIn);
    })();
    return () => {
      active = false;
    };
  }, []);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Settings</Text>
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
          <Text style={styles.footerText}>
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
