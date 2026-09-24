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

export interface Drop {
  id: string;
  name: string;
  type: 'physical' | 'digital';
  brand: string;
  date: string; // ISO
  timeLabel?: string;
  url?: string;
  status: 'confirmed' | 'rumor' | 'watch';
}

export async function getDrops(): Promise<Drop[]> {
  const res = await fetch(`${API_BASE_URL}/drops`);
  if (!res.ok) throw new Error(`drops-${res.status}`);
  const json = await res.json();
  const drops: Drop[] = json.drops ?? [];
  return drops.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/** Human countdown label, e.g. "in 3d 4h", "Tomorrow", "in 45m". Mirrors the web app. */
export function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return '';
  if (ms <= 0) return 'Happening now';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d >= 2) return `in ${d} days`;
  if (d === 1) return `Tomorrow${h > 0 ? `, in ${24 + h}h` : ''}`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

export function formatDropDate(iso: string, timeLabel?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return timeLabel ?? '';
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
  return timeLabel ? `${date} · ${timeLabel}` : date;
}
