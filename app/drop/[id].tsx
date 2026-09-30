import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/theme';
import {
  formatDropDate,
  getDrops,
  timeUntil,
  type Drop,
} from '@/lib/api';
import { dropDestination } from '@/lib/brands';
import DropRemindButton from '@/components/DropRemindButton';

function typeLabel(type: Drop['type']): string {
  if (type === 'physical') return 'Trading cards';
  if (type === 'comics') return 'Comics';
  return 'Digital collectible';
}

function StatusBadge({ status }: { status: Drop['status'] }) {
  if (status === 'confirmed') return null;
  return (
    <Text style={[styles.badge, status === 'rumor' ? styles.badgeRumor : styles.badgeWatch]}>
      {status === 'rumor' ? 'RUMOR' : 'DATE TBA'}
    </Text>
  );
}

export default function DropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError(null);
        const drops = await getDrops();
        if (!active) return;
        const found = drops.find((d) => d.id === id) ?? null;
        if (!found) {
          setError('Drop not found. It may have been removed.');
        } else {
          setDrop(found);
        }
      } catch {
        if (active) setError('Could not load the drop. Check your connection.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const destination = drop ? dropDestination(drop) : null;
  const showAnnouncement = !!drop?.url && drop.url !== destination;

  const openDestination = useCallback(() => {
    if (destination) WebBrowser.openBrowserAsync(destination);
  }, [destination]);

  const openAnnouncement = useCallback(() => {
    if (drop?.url) WebBrowser.openBrowserAsync(drop.url);
  }, [drop?.url]);

  const retry = useCallback(() => {
    router.replace(`/drop/${encodeURIComponent(id)}`);
  }, [id]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        >
          <SymbolView name="chevron.left" tintColor="#ffffff" size={24} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.yellow} />
        </View>
      ) : error || !drop ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error ?? 'Could not load the drop.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardMain}>
                <Text style={styles.date}>
                  {formatDropDate(drop.date, drop.timeLabel).toUpperCase()}
                </Text>
                <Text style={styles.title}>
                  {drop.name} <StatusBadge status={drop.status} />
                </Text>
                <Text style={styles.meta}>
                  {drop.brand} · {typeLabel(drop.type)}
                </Text>
              </View>
              <View style={styles.countdown}>
                <Text style={styles.countdownText}>{timeUntil(drop.date)}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <DropRemindButton dropId={drop.id} />
              {!!destination && (
                <Pressable onPress={openDestination} style={styles.detailsButton}>
                  <Text style={styles.detailsText}>Go to drop</Text>
                </Pressable>
              )}
            </View>
            {showAnnouncement && (
              <Pressable onPress={openAnnouncement} style={styles.announcement}>
                <Text style={styles.announcementText}>Read announcement</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cardDeep,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.cardDeep,
  },
  iconButton: {
    padding: 10,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.ink,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: COLORS.yellow,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.yellow,
  },
  title: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 29,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  badgeRumor: {
    backgroundColor: 'rgba(249,115,22,0.2)',
    color: '#fdba74',
  },
  badgeWatch: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)',
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  countdown: {
    backgroundColor: COLORS.cardDeep,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countdownText: {
    color: COLORS.yellow,
    fontSize: 14,
    fontWeight: '800',
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsButton: {
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  detailsText: {
    color: COLORS.cardDeep,
    fontSize: 15,
    fontWeight: '800',
  },
  announcement: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  announcementText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
