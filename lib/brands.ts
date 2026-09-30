import type { Drop } from './api';

interface BrandSite {
  /** lowercase substring matched against the drop's brand */
  match: string;
  site: string;
  label: string;
}

// Brand homepages where drops happen. Order matters: more specific matches
// first. New brands fall back to the announcement URL automatically.
const BRAND_SITES: BrandSite[] = [
  { match: 'disney pinnacle', site: 'https://disneypinnacle.com', label: 'Disney Pinnacle' },
  { match: 'pinnacle', site: 'https://disneypinnacle.com', label: 'Disney Pinnacle' },
  { match: 'veve', site: 'https://www.veve.me', label: 'VeVe' },
  { match: 'topps', site: 'https://www.topps.com', label: 'Topps' },
  { match: 'panini', site: 'https://www.paniniamerica.net', label: 'Panini' },
  { match: 'upper deck', site: 'https://www.upperdeck.com', label: 'Upper Deck' },
  { match: 'top shot', site: 'https://nbatopshot.com', label: 'NBA Top Shot' },
  { match: 'rittenhouse', site: 'https://scifihobby.com', label: 'Rittenhouse' },
  { match: 'veefriends', site: 'https://veefriends.com', label: 'VeeFriends' },
  { match: 'pokémon', site: 'https://www.pokemoncenter.com', label: 'Pokémon' },
  { match: 'pokemon', site: 'https://www.pokemoncenter.com', label: 'Pokémon' },
];

export function brandSite(brand: string): BrandSite | null {
  const b = brand.toLowerCase();
  return BRAND_SITES.find(({ match }) => b.includes(match)) ?? null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Where "Go to drop" should land. Prefers the announcement URL when it's
 * already on the brand's own site (most specific, e.g. a veve.me collectible
 * page), then the brand's homepage, then the announcement URL as a last
 * resort. Null when there's nowhere to go.
 */
export function dropDestination(drop: Drop): string | null {
  const brand = brandSite(drop.brand);
  const urlHost = drop.url ? hostOf(drop.url) : null;
  const brandHost = brand ? hostOf(brand.site) : null;
  if (urlHost && brandHost && (urlHost === brandHost || urlHost.endsWith(`.${brandHost}`))) {
    return drop.url ?? null;
  }
  if (brand) return brand.site;
  return drop.url ?? null;
}
