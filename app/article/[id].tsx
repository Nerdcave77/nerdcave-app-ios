import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { WebView } from 'react-native-webview';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { getArticle, type Article } from '@/lib/api';
import { isSaved, saveArticle, unsaveArticle } from '@/lib/saved';

function wrapHtml(contentHtml: string, textColor: string, linkColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
/* Beehiiv body copy carries inline styles like
   color:#2D2D2D;color:var(--wt-text-on-background-color) !important.
   An inline !important beats any stylesheet rule, so the paragraph color
   can only be themed through Beehiiv's own variable. It is undefined in
   this WebView, which left dark-mode articles rendering the dark fallback
   color on the dark card. Define it from the app theme. */
:root { --wt-text-on-background-color:${textColor}; }
body { color:${textColor}; font-family:-apple-system,Helvetica,Arial,sans-serif; font-size:17px; line-height:1.75; margin:0; padding:0; }
* { background:transparent !important; background-color:transparent !important; }
#web-header { display:none !important; }
p,div,span,li,h1,h2,h3 { color:${textColor} !important; }
img { max-width:100%; height:auto; border-radius:12px; margin:18px auto; display:block; }
a { color:${linkColor}; }
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

function extractByline(html: string): {
  avatarUrl?: string;
  authorName?: string;
} {
  const avatar = html.match(/alt='Author'[^>]*?src='([^']+)'/);
  const name = html.match(/beehiiv\.com\/authors\/[^"']+["'][^>]*>([^<]+)</);
  return {
    avatarUrl: avatar?.[1],
    authorName: name?.[1]?.trim(),
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shareTargets(article: Article): { label: string; url: string }[] {
  const url = encodeURIComponent(article.web_url);
  const text = encodeURIComponent(article.title);
  return [
    {
      label: 'f',
      url: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    },
    {
      label: 'X',
      url: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    },
    {
      label: '@',
      url: `https://www.threads.net/intent/post?text=${text}%20${url}`,
    },
    {
      label: 'in',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    },
  ];
}

export default function ArticleScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(300);
  // Live width so folding/rotating while reading re-lays-out the thumbnail.
  const { width } = useWindowDimensions();
  const thumbW = width - 32;

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

  const byline = useMemo(
    () => extractByline(article?.content_html ?? ''),
    [article]
  );

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
          <SymbolView name="chevron.left" tintColor="#ffffff" size={24} />
        </Pressable>
        {article && (
          <Pressable
            style={styles.iconButton}
            onPress={toggleSave}
            accessibilityLabel={saved ? 'Unsave article' : 'Save article'}
          >
            <SymbolView
              name={saved ? 'bookmark.fill' : 'bookmark'}
              tintColor={saved ? COLORS.yellow : '#ffffff'}
              size={24}
            />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={COLORS.yellow} />
        </View>
      ) : error || !article ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.ink }]}>
            {error ?? 'Could not load the article.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={[styles.body, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scroll}
        >
          {!!article.thumbnail_url && (
            <Image
              source={{ uri: article.thumbnail_url }}
              style={[styles.thumbnail, { width: thumbW, height: (thumbW * 9) / 16 }]}
              resizeMode="cover"
            />
          )}
          <View style={[styles.card, { backgroundColor: colors.articleBg }]}>
            <Text style={[styles.title, { color: colors.ink }]}>
              {article.title}
            </Text>
            {!!article.subtitle && (
              <Text style={[styles.subtitle, { color: colors.mutedDark }]}>
                {article.subtitle}
              </Text>
            )}
            <View style={styles.authorRow}>
              {!!byline.avatarUrl && (
                <Image
                  source={{ uri: byline.avatarUrl }}
                  style={styles.avatar}
                />
              )}
              <View>
                <Text style={[styles.authorName, { color: colors.ink }]}>
                  {byline.authorName || 'Ceelow G'}
                </Text>
                {!!article.publish_date && (
                  <Text style={[styles.date, { color: colors.mutedDark }]}>
                    {formatDate(article.publish_date)}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.shareRow}>
              {shareTargets(article).map((s) => (
                <Pressable
                  key={s.label}
                  style={[
                    styles.shareButton,
                    { backgroundColor: colors.shareButtonBg },
                  ]}
                  accessibilityLabel={`Share via ${s.label}`}
                  onPress={() => Linking.openURL(s.url)}
                >
                  <Text style={[styles.shareLabel, { color: colors.mutedDark }]}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <WebView
              originWhitelist={['*']}
              source={{
                html: wrapHtml(article.content_html, colors.articleText, colors.link),
              }}
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
    backgroundColor: COLORS.cardDeep,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  scroll: {
    paddingBottom: 32,
  },
  thumbnail: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
  },
  title: {
    color: COLORS.ink,
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    color: COLORS.mutedDark,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  authorName: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  date: {
    color: COLORS.mutedDark,
    fontSize: 14,
    marginTop: 2,
  },
  shareRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eef1f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareLabel: {
    color: COLORS.mutedDark,
    fontSize: 17,
    fontWeight: '700',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});
