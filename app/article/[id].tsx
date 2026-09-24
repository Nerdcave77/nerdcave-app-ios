import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { WebView } from 'react-native-webview';
import { COLORS } from '@/constants/theme';
import { getArticle, timeAgo, type Article } from '@/lib/api';
import { isSaved, saveArticle, unsaveArticle } from '@/lib/saved';

function wrapHtml(contentHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { background:#eceff3; color:#17203a; font-family:-apple-system,Helvetica,Arial,sans-serif; font-size:17px; line-height:1.75; padding:20px 18px; margin:0; }
* { background:transparent !important; background-color:transparent !important; }
body { background:#eceff3 !important; background-color:#eceff3 !important; }
#web-header { display:none !important; }
p,div,span,li,h1,h2,h3 { color:#17203a !important; }
img { max-width:100%; height:auto; border-radius:12px; margin:18px auto; display:block; }
a { color:#1d4ed8; }
h2{font-size:22px} h3{font-size:19px}
blockquote{border-left:3px solid #ffd60a;padding-left:14px;font-style:italic;}
</style>
</head>
<body>${contentHtml}</body>
</html>`;
}

const INJECTED_JS = `
(function () {
  function postHeight() {
    window.ReactNativeWebView.postMessage(
      String(document.documentElement.scrollHeight)
    );
  }
  window.addEventListener('load', postHeight);
  if (window.ResizeObserver) {
    new ResizeObserver(postHeight).observe(document.documentElement);
  }
  setTimeout(postHeight, 300);
})();
true;
`;

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(300);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError(null);
        const a = await getArticle(id);
        if (!active) return;
        if (!a) {
          setError('Article not found.');
        } else {
          setArticle(a);
          setSaved(await isSaved(a.id));
        }
      } catch {
        if (active) setError('Could not load the article.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const toggleSave = useCallback(async () => {
    if (!article) return;
    if (saved) {
      await unsaveArticle(article.id);
      setSaved(false);
    } else {
      await saveArticle(article);
      setSaved(true);
    }
  }, [article, saved]);

  const retry = useCallback(() => {
    router.replace(`/article/${encodeURIComponent(id)}`);
  }, [id]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        >
          <SymbolView name="chevron.left" tintColor={COLORS.ink} size={24} />
        </Pressable>
        {article && (
          <Pressable
            style={styles.iconButton}
            onPress={toggleSave}
            accessibilityLabel={saved ? 'Unsave article' : 'Save article'}
          >
            <SymbolView
              name={saved ? 'bookmark.fill' : 'bookmark'}
              tintColor={saved ? COLORS.yellow : COLORS.ink}
              size={24}
            />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.yellow} />
        </View>
      ) : error || !article ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error ?? 'Could not load the article.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {!!article.thumbnail_url && (
            <Image
              source={{ uri: article.thumbnail_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          )}
          <View style={styles.header}>
            <Text style={styles.kicker}>{timeAgo(article.publish_date)}</Text>
            <Text style={styles.title}>{article.title}</Text>
            {!!article.subtitle && (
              <Text style={styles.subtitle}>{article.subtitle}</Text>
            )}
          </View>
          <View style={styles.bodyCard}>
            <WebView
              originWhitelist={['*']}
              source={{ html: wrapHtml(article.content_html) }}
              injectedJavaScript={INJECTED_JS}
              onMessage={(event) => {
                const h = parseInt(event.nativeEvent.data, 10);
                if (!Number.isNaN(h) && h > 0) setWebViewHeight(h);
              }}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              style={[styles.webview, { height: webViewHeight }]}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iconButton: {
    padding: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  scroll: {
    paddingBottom: 32,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  kicker: {
    color: COLORS.yellow,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: COLORS.ink,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.ink,
    opacity: 0.7,
    fontSize: 16,
    lineHeight: 22,
  },
  webview: {
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  bodyCard: {
    backgroundColor: COLORS.articleBg,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
});
