import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Article } from '@/lib/api';

const KEY = 'nerdcave77.savedArticles.v1';

async function readAll(): Promise<Article[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Article[]) : [];
  } catch {
    return [];
  }
}

export async function getSavedArticles(): Promise<Article[]> {
  return readAll();
}

export async function isSaved(id: string): Promise<boolean> {
  const all = await readAll();
  return all.some((a) => a.id === id);
}

export async function saveArticle(article: Article): Promise<void> {
  const all = await readAll();
  if (!all.some((a) => a.id === article.id)) {
    all.unshift(article);
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
  }
}

export async function unsaveArticle(id: string): Promise<void> {
  const all = await readAll();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((a) => a.id !== id))
  );
}
