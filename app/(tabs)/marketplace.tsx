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
  formatEventDate,
  getMarketNews,
  MARKET_CATEGORY_LABELS,
  MARKET_TYPE_LABELS,
  timeAgo,
  type MarketNews,
} from '@/lib/api';

function MarketCard({ item }: { item: MarketNews }) {
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
      <Text style={styles.headline}>{item.headline}</Text>
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
        <Text style={styles.published}>{timeAgo(item.publishedAt)}</Text>
        {!!item.url && (
          <Pressable onPress={openSource} hitSlop={8}>
            <Text style={styles.source}>View source</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function MarketplaceScreen() {
  const [items, setItems] = useState<MarketNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

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
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MarketCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Market</Text>
            <Text style={styles.subheading}>
              Big sales, new-comics sell-through, card and digital movers, market trends
            </Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.card}>
              <Text style={styles.headline}>No market news yet</Text>
              <Text style={styles.summary}>
                This morning&rsquo;s scan hasn&rsquo;t posted yet. Pull down to check again in a bit.
              </Text>
            </View>
          ) : null
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
  published: {
    fontSize: 12,
    color: COLORS.muted,
  },
  source: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.yellow,
  },
});
