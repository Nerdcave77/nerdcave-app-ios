import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MarketCategory, MarketItemType, MarketNews } from '@/lib/api';

// Track a project, native port of the web app's lib/track-project.ts and
// TrackButton storage. A "project" is the collection named in a Market card
// headline, e.g. "Pudgy Penguins - Ethereum (update)" is an update about the
// Pudgy Penguins project. Tracking snapshots the card it was tapped on, and
// the Tracking view refreshes the snapshot from the newest feed item for
// that project whenever the market scan posts an update. Picks live on this
// device in AsyncStorage under the same key the web app uses in
// localStorage, so the two stay conceptually identical.

export interface TrackedProject {
  /** Slug of the project name, the identity used across feed updates */
  key: string;
  /** Display name, e.g. "Pudgy Penguins" */
  name: string;
  /** Id of the market item this snapshot came from */
  itemId: string;
  headline: string;
  category: MarketCategory;
  type: MarketItemType;
  price: string | null;
  change: string | null;
  sales: string | null;
  summary: string;
  url: string | null;
  eventDate: string;
  publishedAt: string;
  /** ISO timestamp of when the reader tapped Track */
  trackedAt: string;
}

/** The project name is the headline text before the first " - " separator. */
export function projectNameFromHeadline(headline: string): string {
  const idx = headline.indexOf(' - ');
  const name = idx === -1 ? headline : headline.slice(0, idx);
  return name.trim();
}

export function projectKeyFromHeadline(headline: string): string {
  return projectNameFromHeadline(headline)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Snapshot a market item as a tracked project. */
export function snapshotFromItem(item: MarketNews): TrackedProject {
  return {
    key: projectKeyFromHeadline(item.headline),
    name: projectNameFromHeadline(item.headline),
    itemId: item.id,
    headline: item.headline,
    category: item.category,
    type: item.type,
    price: item.price ?? null,
    change: item.change ?? null,
    sales: item.sales ?? null,
    summary: item.summary,
    url: item.url ?? null,
    eventDate: item.eventDate,
    publishedAt: item.publishedAt,
    trackedAt: new Date().toISOString(),
  };
}

/** Rebuild a MarketNews-shaped item from a snapshot, for card rendering. */
export function itemFromSnapshot(t: TrackedProject): MarketNews {
  return {
    id: t.itemId,
    headline: t.headline,
    category: t.category,
    type: t.type,
    price: t.price ?? 'n/a',
    eventDate: t.eventDate,
    summary: t.summary,
    url: t.url ?? undefined,
    sales: t.sales ?? undefined,
    change: t.change ?? undefined,
    publishedAt: t.publishedAt,
  };
}

const STORAGE_KEY = 'nc77-tracked-projects';

let cache: TrackedProject[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

export function getTrackedProjects(): TrackedProject[] {
  return cache;
}

export function subscribeTrackedProjects(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function loadTrackedProjects(): Promise<TrackedProject[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter(
          (x): x is TrackedProject =>
            !!x &&
            typeof x === 'object' &&
            typeof (x as TrackedProject).key === 'string',
        )
      : [];
  } catch {
    cache = [];
  }
  notify();
  return cache;
}

async function storeTrackedProjects(list: TrackedProject[]): Promise<void> {
  cache = list;
  notify();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage failed: the in-memory state still flips for this tap.
  }
}

/** Toggle tracking for the project named in this item's headline. */
export async function toggleTrackedProject(item: MarketNews): Promise<void> {
  const key = projectKeyFromHeadline(item.headline);
  if (cache.some((t) => t.key === key)) {
    await storeTrackedProjects(cache.filter((t) => t.key !== key));
  } else {
    await storeTrackedProjects([...cache, snapshotFromItem(item)]);
  }
}

export function isTracked(item: MarketNews): boolean {
  const key = projectKeyFromHeadline(item.headline);
  return cache.some((t) => t.key === key);
}
