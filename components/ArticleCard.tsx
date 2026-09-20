import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { timeAgo, type Article } from '@/lib/api';

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push(`/article/${encodeURIComponent(article.id)}`)
      }
    >
      {!!article.thumbnail_url && (
        <Image
          source={{ uri: article.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      <View style={styles.body}>
        <Text style={styles.kicker}>{timeAgo(article.publish_date)}</Text>
        <Text style={styles.title}>{article.title}</Text>
        {!!article.subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {article.subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  body: {
    padding: 16,
  },
  kicker: {
    color: COLORS.yellow,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
