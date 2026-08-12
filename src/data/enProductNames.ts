/**
 * English-market product names.
 *
 * The US and Canadian positioning is "receipt photo booth" — that is the term
 * American buyers actually search and it is the Kickstarter angle, so the two
 * Retro models are sold there as Receipt models.
 *
 * This deliberately does NOT live in src/data/products.ts: that file feeds the
 * Korean pages, where the models stay 레트로피키 / Retro Picky.
 */
// Upper case to match `name` in products.ts — these values substitute for it,
// so a title-case entry shows up as the one odd row in an all-caps lineup.
export const EN_PRODUCT_NAMES: Record<string, string> = {
  'modern-retro-picky': 'MODERN RECEIPT PICKY',
  'urban-retro-picky': 'URBAN RECEIPT PICKY',
};

/** English display name for a product id, falling back to the shared name. */
export function enProductName(id: string, fallback: string): string {
  return EN_PRODUCT_NAMES[id] ?? fallback;
}

/** The Kickstarter product, English markets only. Korean pages say Retro Picky. */
export const EN_KICKSTARTER_PRODUCT = 'Receipt Picky 2';
