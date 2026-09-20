import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { getSavedArticles } from '@/lib/saved';
import type { Article } from '@/lib/api';
import ArticleCard from '@/components/ArticleCard';

export default function SavedScreen() {
  const [saved, setSaved] = useState<Article[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const list = await getSavedArticles();
        if (active) setSaved(list);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArticleCard article={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Saved</Text>
            <Text style={styles.subheading}>Your reading list</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No saved articles yet</Text>
            <Text style={styles.emptyBody}>
              Tap the bookmark icon on any article to save it here.
            </Text>
          </View>
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyBody: {
    color: COLORS.ink,
    opacity: 0.7,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
