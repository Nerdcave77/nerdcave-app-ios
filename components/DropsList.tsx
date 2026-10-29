import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import {
  formatDropDate,
  getDrops,
  isTbaDrop,
  timeUntil,
  type Drop,
} from '@/lib/api';
import { dropDestination } from '@/lib/brands';
import DropRemindButton from '@/components/DropRemindButton';

type Filter = 'all' | 'physical' | 'digital' | 'comics';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'physical', label: 'Physical' },
  { key: 'digital', label: 'Digital' },
  { key: 'comics', label: 'Comics' },
];

function StatusBadge({ status }: { status: Drop['status'] }) {
  return (
    <Text style={[styles.badge, status === 'confirmed' ? styles.badgeConfirmed : status === 'rumor' ? styles.badgeRumor : styles.badgeWatch]}>
      {status === 'confirmed' ? 'CONFIRMED' : status === 'rumor' ? 'RUMOR' : 'WATCH'}
    </Text>
  );
}

function DropCard({ drop }: { drop: Drop }) {
  const destination = dropDestination(drop);

  const openDestination = useCallback(() => {
    if (destination) WebBrowser.openBrowserAsync(destination);
  }, [destination]);

  const openDrop = useCallback(() => {
    router.push(`/drop/${encodeURIComponent(drop.id)}`);
  }, [drop.id]);

  return (
    <Pressable style={styles.card} onPress={openDrop}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.date}>
            {formatDropDate(drop.date, drop.timeLabel, drop.status).toUpperCase()}
          </Text>
          <Text style={styles.title}>
            {drop.name} <StatusBadge status={drop.status} />
          </Text>
          <Text style={styles.meta}>
            {drop.brand} · {drop.type === 'physical' ? 'Trading cards' : drop.type === 'comics' ? 'Comics' : 'Digital collectible'}
          </Text>
        </View>
        {!isTbaDrop(drop) && (
          <View style={styles.countdown}>
            <Text style={styles.countdownText}>{timeUntil(drop.date, drop.status)}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardActions}>
        <DropRemindButton dropId={drop.id} />
        {!!destination && (
          <Pressable onPress={openDestination} style={styles.details}>
            <Text style={styles.detailsText}>Go to drop</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// Drop calendar list. Shared by the Drops tab and the Duo two-pane layout.
// In compact mode (Duo pane) the big "Drop Calendar" heading is skipped but
// the filter pills stay, since they are functional.
export default function DropsList({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
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

  const q = query.trim().toLowerCase();
  const matchesQuery = (d: Drop) => {
    if (!q) return true;
    const typeText =
      d.type === 'physical'
        ? 'Trading cards'
        : d.type === 'comics'
          ? 'Comics'
          : 'Digital collectible';
    const haystack = [
      d.name,
      d.brand,
      typeText,
      formatDropDate(d.date, d.timeLabel, d.status),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  };

  const visible = drops.filter(
    (d) => matchesQuery(d) && (filter === 'all' || d.type === filter)
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
      </View>
    );
  }

  return (
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
          {!compact && (
            <>
              <Text style={[styles.heading, { color: colors.ink }]}>
                Drop Calendar
              </Text>
              <Text style={[styles.subheading, { color: colors.ink }]}>
                Upcoming physical card sets, comics &amp; digital collectible drops. Never miss one.
              </Text>
            </>
          )}
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search drops..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
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
              {q
                ? `No results for "${query.trim()}".`
                : drops.length === 0
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
  );
}

const styles = StyleSheet.create({
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
  search: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.white,
    marginTop: 12,
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
  badgeConfirmed: {
    backgroundColor: 'rgba(52,211,153,0.2)',
    color: '#6ee7b7',
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
