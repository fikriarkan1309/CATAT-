/**
 * partyMemory.ts
 * Manages persistent suggestion memory for "Dari" (payer/source) and "Ke" (payee/merchant/destination)
 * Autocomplete only shows suggestions when user has typed an initial character (e.g. 's', 'sa').
 * When input is empty, no suggestions are shown.
 */

const STORAGE_KEY_FROM = 'keluarga_fin_party_from_memory';
const STORAGE_KEY_TO = 'keluarga_fin_party_to_memory';

// Initial default suggestions seeded from realistic transaction history
const DEFAULT_FROM_ENTRIES = [
  'Fikri Arkan',
  'Alya Putri',
  'PT Tech Inovasi Nusantara',
  'Klien Desain Studio',
  'Dividen Saham BBCA',
  'Bunga Tabungan Mandiri',
  'Bonus Tahunan Proyek',
  'Sales Mobil',
  'Cashback Tokopedia',
  'Dompet Tunai',
];

const DEFAULT_TO_ENTRIES = [
  'Superindo BSD',
  'SD Islam Terpadu',
  'Resto Sunda Mang Kabayan',
  'Pertamina BSD',
  'Klinik Dokter Anak Medika',
  'Sales Mobil',
  'Tokopedia Official',
  'Shopee Pay',
  'PLN Distribusi Jakarta',
  'PDAM Tirta Kencana',
  'Indomaret Point',
  'Starbucks Coffee',
  'Cinema XXI',
  'Bengkel Auto2000',
];

export function getPartyMemory(type: 'from' | 'to'): string[] {
  try {
    const key = type === 'from' ? STORAGE_KEY_FROM : STORAGE_KEY_TO;
    const stored = localStorage.getItem(key);
    if (!stored) {
      const defaults = type === 'from' ? DEFAULT_FROM_ENTRIES : DEFAULT_TO_ENTRIES;
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return type === 'from' ? DEFAULT_FROM_ENTRIES : DEFAULT_TO_ENTRIES;
  }
}

export function savePartyMemory(type: 'from' | 'to', value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;

  try {
    const current = getPartyMemory(type);
    // Remove if already exists (case-insensitive deduplication), then prepend to top
    const filtered = current.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...filtered].slice(0, 50); // keep up to 50 items

    const key = type === 'from' ? STORAGE_KEY_FROM : STORAGE_KEY_TO;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save party memory:', err);
  }
}

export function removePartyMemory(type: 'from' | 'to', value: string): void {
  try {
    const current = getPartyMemory(type);
    const updated = current.filter(
      (item) => item.toLowerCase() !== value.toLowerCase()
    );
    const key = type === 'from' ? STORAGE_KEY_FROM : STORAGE_KEY_TO;
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove party memory:', err);
  }
}

/**
 * Searches the memory for matches given a query string.
 * CRITICAL RULE: If query is empty or whitespace, return EMPTY array.
 * Suggestions only show when the user has typed an initial character (e.g. 's', 'sa', etc.)
 */
export function searchPartyMemory(type: 'from' | 'to', query: string): string[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return []; // No initial typed -> do not show anything!
  }

  const items = getPartyMemory(type);

  // Exact prefix matches first, then contains matches
  const prefixMatches = items.filter((item) =>
    item.toLowerCase().startsWith(cleanQuery)
  );
  const otherMatches = items.filter(
    (item) =>
      !item.toLowerCase().startsWith(cleanQuery) &&
      item.toLowerCase().includes(cleanQuery)
  );

  return [...prefixMatches, ...otherMatches].slice(0, 6);
}
