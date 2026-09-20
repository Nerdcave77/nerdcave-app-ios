import { API_BASE_URL } from '@/constants/theme';

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  thumbnail_url: string;
  web_url: string;
  publish_date: string;
  content_html: string;
}

export async function getArticles(): Promise<Article[]> {
  const res = await fetch(`${API_BASE_URL}/articles`);
  if (!res.ok) throw new Error(`articles-${res.status}`);
  const json = await res.json();
  return json.articles ?? [];
}

export async function getArticle(id: string): Promise<Article | null> {
  const res = await fetch(`${API_BASE_URL}/articles/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`article-${res.status}`);
  const json = await res.json();
  return json.article ?? null;
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
