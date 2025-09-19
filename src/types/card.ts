/**
 * Card types based on Scryfall API structure
 * These interfaces define the structure of Magic: The Gathering cards
 * as returned by the Scryfall API
 */

/**
 * Represents a Magic: The Gathering card with all its properties.
 * This interface matches the Scryfall API response structure.
 */
export interface Card {
  /** Unique identifier for the card (Scryfall ID) */
  id: string;
  /** The name of the card */
  name: string;
  /** Mana cost in Scryfall format (e.g., "{2}{R}{R}") */
  mana_cost: string;
  /** Converted mana cost (total mana required) */
  cmc: number;
  /** Type line (e.g., "Creature — Dragon") */
  type_line: string;
  /** Oracle text (rules text) */
  oracle_text: string;
  /** Power (for creatures) */
  power?: string;
  /** Toughness (for creatures) */
  toughness?: string;
  /** Colors of the card (e.g., ["R", "G"]) */
  colors: string[];
  /** Color identity (colors that can be used to cast the card) */
  color_identity: string[];
  /** Image URIs in various sizes */
  image_uris: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  /** Rarity (common, uncommon, rare, mythic) */
  rarity: string;
  /** Set code (e.g., "MH2") */
  set: string;
  /** Full set name (e.g., "Modern Horizons 2") */
  set_name: string;
  /** Collector number within the set */
  collector_number: string;
  /** Legalities in various formats */
  legalities: Record<string, string>;
}

/**
 * Represents a card in the draft pool with its quantity.
 * Used to track how many copies of a card are available.
 */
export interface CardInPool {
  /** The card data from Scryfall */
  card: Card;
  /** Number of copies of this card in the pool */
  quantity: number;
}

/**
 * Represents a pile of cards during the splitting phase.
 * Each pile has an ID and contains cards assigned to it.
 */
export interface Pile {
  /** Unique identifier for the pile */
  id: string;
  /** Cards assigned to this pile */
  cards: CardInPool[];
}

/**
 * Represents a pack of cards in the draft.
 * Contains the cards and tracks whether it's currently being drafted.
 */
export interface Pack {
  /** Unique identifier for the pack */
  id: string;
  /** Cards in this pack */
  cards: CardInPool[];
  /** Whether this pack is currently being drafted */
  isActive: boolean;
  /** Piles created during the splitting phase (optional) */
  piles?: Pile[];
}

/**
 * Color identity types for Magic: The Gathering cards.
 * Used to categorize cards by their color requirements.
 */
export type ColorIdentity = 'W' | 'U' | 'B' | 'R' | 'G' | 'C' | 'M';

/**
 * Represents a player's collected cards organized by color identity.
 * Keys are color identities (W, U, B, R, G, C, M) and values are arrays of cards.
 */
export interface PlayerPicks {
  /** Cards organized by color identity */
  [key: string]: CardInPool[]; // key is color identity
}


