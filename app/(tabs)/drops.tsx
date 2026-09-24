import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/theme';
import {
  formatDropDate,
  getDrops,
  timeUntil,
  type Drop,
} from '@/lib/api';
import DropRemindButton from '@/components/DropRemindButton';

type Filter = 'all' | 'physical' | 'digital';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'physical', label: 'Physical' },
  { key: 'digital', label: 'Digital' },
];

function StatusBadge({ status }: { status: Drop['status'] }) {
  if (status === 'confirmed') return null;
  return (
    <Text style={[styles.badge, status === 'rumor' ? styles.badgeRumor : styles.badgeWatch]}>
      {status === 'rumor' ? 'RUMOR' : 'DATE TBA'}
    </Text>
  );
}

function DropCard({ drop }: { drop: Drop }) {
  const openDetails = useCallback(() => {
    if (drop.url) WebBrowser.openBrowserAsync(drop.url);
  }, [drop.url]);

  return (
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
            {drop.brand} · {drop.type === 'physical' ? 'Physical cards' : 'Digital collectible'}
          </Text>
        </View>
        <View style={styles.countdown}>
          <Text style={styles.countdownText}>{timeUntil(drop.date)}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <DropRemindButton dropId={drop.id} />
        {!!drop.url && (
          <Pressable onPress={openDetails} style={styles.details}>
            <Text style={styles.detailsText}>Details</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function DropsScreen() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setDrops(await getDrops());
    } catch {
      setError('Could not load the drop calendar. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const visible = drops.filter((d) => filter === 'all' || d.type === filter);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.yellow} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DropCard drop={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.yellow}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Drop Calendar</Text>
            <Text style={styles.subheading}>
              Upcoming physical card sets &amp; digital collectible drops. Never miss one.
            </Text>
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.pill,
                    filter === f.key ? styles.pillActive : styles.pillInactive,
                  ]}
                >
                  <Text
                    style={
                      filter === f.key ? styles.pillTextActive : styles.pillTextInactive
                    }
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {!!error && (
              <View style={styles.error}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>The scout is watching 👀</Text>
              <Text style={styles.emptyBody}>
                {drops.length === 0
                  ? 'No drops on the calendar yet — new releases land here as they are announced. Check back soon.'
                  : 'Nothing in this category yet — try another filter.'}
              </Text>
              <Text style={styles.emptyNote}>
                Enable notifications in Settings and we’ll ping you when drops are added.
              </Text>
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.5,
    paddingTop: 12,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.ink,
    opacity: 0.75,
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: COLORS.yellow,
  },
  pillInactive: {
    backgroundColor: COLORS.card,
  },
  pillTextActive: {
    color: COLORS.cardDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  pillTextInactive: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 23,
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
    marginTop: 4,
    fontSize: 12,
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
  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  details: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  empty: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyBody: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyNote: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
  },
});
