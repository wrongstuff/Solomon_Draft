// Card types based on Scryfall API structure
export interface Card {
  id: string;
  name: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  power?: string;
  toughness?: string;
  colors: string[];
  color_identity: string[];
  image_uris: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  rarity: string;
  set: string;
  set_name: string;
  collector_number: string;
  legalities: Record<string, string>;
}

export interface CardInPool {
  card: Card;
  quantity: number;
}

export interface Pile {
  id: string;
  cards: CardInPool[];
}

export interface Pack {
  id: string;
  cards: CardInPool[];
  isActive: boolean;
}

export type ColorIdentity = 'W' | 'U' | 'B' | 'R' | 'G' | 'C' | 'M';

export interface PlayerPicks {
  [key: string]: CardInPool[]; // key is color identity
}


