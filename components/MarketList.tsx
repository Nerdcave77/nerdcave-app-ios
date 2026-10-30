import { useCallback, useEffect, useMemo, useState } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import {
  formatEventDate,
  getMarketNews,
  MARKET_CATEGORY_LABELS,
  MARKET_TYPE_LABELS,
  timeAgo,
  type MarketNews,
} from '@/lib/api';
import {
  getTrackedProjects,
  itemFromSnapshot,
  loadTrackedProjects,
  projectKeyFromHeadline,
  snapshotFromItem,
  subscribeTrackedProjects,
  toggleTrackedProject,
  type TrackedProject,
} from '@/lib/tracking';

interface TrackControl {
  tracking: boolean;
  onToggle: () => void;
}

function MarketCard({
  item,
  displayTitle,
  trackControl,
}: {
  item: MarketNews;
  displayTitle?: string;
  trackControl?: TrackControl;
}) {
  const openSource = useCallback(() => {
    if (item.url) WebBrowser.openBrowserAsync(item.url);
  }, [item.url]);

  const isTrend = item.type === 'market-news';
  const changeDown = !!item.change && item.change.trim().startsWith('-');

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.badge}>
          {MARKET_CATEGORY_LABELS[item.category]} · {MARKET_TYPE_LABELS[item.type]}
        </Text>
        <Text style={styles.date}>{formatEventDate(item.eventDate)}</Text>
      </View>
      <Text style={styles.headline}>{displayTitle ?? item.headline}</Text>
      {!isTrend && item.price !== 'n/a' &&
        (item.price !== 'Unconfirmed' ? (
          <Text style={styles.price}>{item.price}</Text>
        ) : (
          <Text style={styles.priceUnconfirmed}>Price unconfirmed</Text>
        ))}
      {!!item.change && (
        <Text style={[styles.change, changeDown ? styles.changeDown : styles.changeUp]}>
          {changeDown ? '▼ ' : '▲ '}
          {item.change}
        </Text>
      )}
      {!!item.sales && (
        <Text style={styles.sales}>
          {item.sales.toLowerCase().startsWith('not publicly')
            ? 'Sales total not publicly reported'
            : `Sold: ${item.sales}`}
        </Text>
      )}
      {!!item.signal && <Text style={styles.signal}>{item.signal}</Text>}
      <Text style={styles.summary}>{item.summary}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          {!!trackControl && (
            <Pressable
              onPress={trackControl.onToggle}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ selected: trackControl.tracking }}
              accessibilityLabel={
                trackControl.tracking
                  ? 'Stop tracking this project'
                  : 'Track this project'
              }
            >
              <Text
                style={[
                  styles.track,
                  trackControl.tracking ? styles.trackOn : styles.trackOff,
                ]}
              >
                {trackControl.tracking ? '✓ Tracking' : '+ Track'}
              </Text>
            </Pressable>
          )}
          <Text style={styles.published}>{timeAgo(item.publishedAt)}</Text>
        </View>
        {!!item.url && (
          <Pressable onPress={openSource} hitSlop={8}>
            <Text style={styles.source}>View source</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

type Filter = 'all' | 'digital' | 'physical';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'digital', label: 'Digital' },
  { key: 'physical', label: 'Physical' },
];

function sideOf(item: MarketNews): 'digital' | 'physical' | 'both' {
  if (item.category === 'digital') return 'digital';
  if (item.category === 'overall') return 'both';
  return 'physical';
}

type Section = 'news' | 'tracking';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'news', label: 'News' },
  { key: 'tracking', label: 'Tracking' },
];

interface TrackingDisplay {
  tracked: TrackedProject;
  item: MarketNews;
}

// Market news list with the web app's full feature set: search, the
// All / Digital / Physical filter, Track buttons on digital cards, and a
// Tracking section. Shared by the Market tab and the Duo two-pane layout;
// in compact mode (Duo pane) the heading and the News / Tracking section
// pills are skipped, since the pane already has its own Market / Drops
// toggle and the full Tracking view lives in the Market tab.
export default function MarketList({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const [items, setItems] = useState<MarketNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('news');
  const [query, setQuery] = useState('');
  const [trackQuery, setTrackQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [tracked, setTracked] = useState<TrackedProject[]>(() =>
    getTrackedProjects(),
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await getMarketNews());
    } catch {
      setError('Could not load market news. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadTrackedProjects();
    return subscribeTrackedProjects(() => {
      setTracked([...getTrackedProjects()]);
    });
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const trackedKeys = useMemo(
    () => new Set(tracked.map((t) => t.key)),
    [tracked],
  );

  const trackControlFor = useCallback(
    (item: MarketNews): TrackControl | undefined =>
      item.category === 'digital'
        ? {
            tracking: trackedKeys.has(projectKeyFromHeadline(item.headline)),
            onToggle: () => {
              void toggleTrackedProject(item);
            },
          }
        : undefined,
    [trackedKeys],
  );

  const q = query.trim().toLowerCase();
  const visibleNews = useMemo(
    () =>
      items.filter((item) => {
        if (q) {
          const haystack = [
            item.headline,
            item.summary,
            MARKET_CATEGORY_LABELS[item.category],
            MARKET_TYPE_LABELS[item.type],
            item.signal ?? '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (filter === 'all') return true;
        const side = sideOf(item);
        return side === 'both' || side === filter;
      }),
    [items, q, filter],
  );

  // Tracking display, web parity: each snapshot is refreshed by the newest
  // feed item for the same project; snapshots render on their own when the
  // feed has nothing newer. Sorted newest first.
  const trackingDisplay = useMemo<TrackingDisplay[]>(() => {
    const display = tracked.map((t) => {
      let newest: MarketNews | null = null;
      for (const item of items) {
        if (projectKeyFromHeadline(item.headline) !== t.key) continue;
        if (
          !newest ||
          new Date(item.publishedAt).getTime() >
            new Date(newest.publishedAt).getTime()
        ) {
          newest = item;
        }
      }
      if (newest) {
        return {
          tracked: { ...snapshotFromItem(newest), trackedAt: t.trackedAt },
          item: newest,
        };
      }
      return { tracked: t, item: itemFromSnapshot(t) };
    });
    display.sort(
      (a, b) =>
        new Date(b.item.publishedAt).getTime() -
        new Date(a.item.publishedAt).getTime(),
    );
    return display;
  }, [tracked, items]);

  const tq = trackQuery.trim().toLowerCase();
  const shownTracking = useMemo(
    () =>
      tq
        ? trackingDisplay.filter(
            ({ tracked: t, item }) =>
              t.name.toLowerCase().includes(tq) ||
              item.headline.toLowerCase().includes(tq) ||
              item.summary.toLowerCase().includes(tq),
          )
        : trackingDisplay,
    [trackingDisplay, tq],
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
      </View>
    );
  }

  const showTracking = !compact && section === 'tracking';

  const header = (
    <View style={compact ? undefined : styles.header}>
      {!compact && (
        <>
          <Text style={[styles.heading, { color: colors.ink }]}>Market</Text>
          <Text style={[styles.subheading, { color: colors.ink }]}>
            {showTracking
              ? 'Projects you are tracking'
              : 'Big sales, new-comics sell-through, card and digital movers, market trends'}
          </Text>
        </>
      )}
      {!!error && (
        <Text style={[styles.error, { color: colors.errorOnBackground }]}>
          {error}
        </Text>
      )}
      {!compact && (
        <View style={styles.pills}>
          {SECTIONS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSection(s.key)}
              style={[
                styles.pill,
                section === s.key ? styles.pillActive : styles.pillInactive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: section === s.key }}
            >
              <Text
                style={
                  section === s.key
                    ? styles.pillTextActive
                    : styles.pillTextInactive
                }
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {showTracking ? (
        tracked.length > 0 ? (
          <TextInput
            style={styles.search}
            value={trackQuery}
            onChangeText={setTrackQuery}
            placeholder="Search tracked projects..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        ) : undefined
      ) : (
        <>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search projects or news..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          <View style={styles.pills}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.pill,
                  filter === f.key ? styles.pillActive : styles.pillInactive,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === f.key }}
              >
                <Text
                  style={
                    filter === f.key
                      ? styles.pillTextActive
                      : styles.pillTextInactive
                  }
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );

  if (showTracking) {
    return (
      <FlatList
        data={shownTracking}
        keyExtractor={(d) => d.tracked.key}
        renderItem={({ item: d }) => (
          <MarketCard
            item={d.item}
            displayTitle={d.tracked.name}
            trackControl={{
              tracking: trackedKeys.has(d.tracked.key),
              onToggle: () => {
                void toggleTrackedProject(d.item);
              },
            }}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.yellow}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          tracked.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.headline}>
                You are not tracking any projects yet
              </Text>
              <Text style={styles.summary}>
                Tap Track on any market card and the project will live here,
                with its latest numbers every time the market scan updates.
              </Text>
              <Pressable onPress={() => setSection('news')} hitSlop={8}>
                <Text style={[styles.source, styles.browseLink]}>
                  Browse the Market
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.ink }]}>
              {`No tracked projects match "${trackQuery.trim()}".`}
            </Text>
          )
        }
      />
    );
  }

  return (
    <FlatList
      data={visibleNews}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <MarketCard item={item} trackControl={trackControlFor(item)} />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.yellow}
        />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={
        !error ? (
          items.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.headline}>No market news yet</Text>
              <Text style={styles.summary}>
                This morning&rsquo;s scan hasn&rsquo;t posted yet. Pull down to check again in a bit.
              </Text>
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.ink }]}>
              {q
                ? `No results for "${query.trim()}".`
                : filter === 'digital'
                  ? 'No digital market updates yet.'
                  : filter === 'physical'
                    ? 'No physical market updates yet.'
                    : 'No market updates yet.'}
            </Text>
          )
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
  header: {
    paddingTop: 12,
  },
  heading: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.ink,
    opacity: 0.75,
    marginTop: 2,
  },
  error: {
    fontSize: 14,
    color: '#7a1f1f',
    marginTop: 8,
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
  pills: {
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
  emptyText: {
    fontSize: 14,
    opacity: 0.65,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.yellow,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 12,
    color: COLORS.muted,
  },
  headline: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
  },
  price: {
    color: COLORS.yellow,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  priceUnconfirmed: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  change: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  changeUp: {
    color: '#4ade80',
  },
  changeDown: {
    color: '#f87171',
  },
  sales: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.85,
  },
  signal: {
    alignSelf: 'flex-start',
    color: COLORS.cardDeep,
    backgroundColor: COLORS.yellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  summary: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    opacity: 0.9,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  track: {
    fontSize: 13,
    fontWeight: '700',
  },
  trackOn: {
    color: COLORS.yellow,
  },
  trackOff: {
    color: COLORS.muted,
  },
  published: {
    fontSize: 12,
    color: COLORS.muted,
  },
  source: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.yellow,
  },
  browseLink: {
    marginTop: 10,
  },
});
