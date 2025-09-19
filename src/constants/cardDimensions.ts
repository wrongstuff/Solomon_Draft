/**
 * Card dimension constants - single source of truth for all card sizes
 * Used across components to ensure consistency and enable future dynamic resizing
 */

export type CardSize = 'small' | 'medium' | 'large';

export interface CardDimensions {
  width: number; // in rem
  height: number; // in rem
  tailwindWidth: string; // Tailwind class for width
  tailwindHeight: string; // Tailwind class for height
}

export const CARD_DIMENSIONS: Record<CardSize, CardDimensions> = {
  small: {
    width: 4, // 4rem
    height: 6, // 6rem
    tailwindWidth: 'w-16',
    tailwindHeight: 'h-24',
  },
  medium: {
    width: 6, // 6rem
    height: 9, // 9rem
    tailwindWidth: 'w-24',
    tailwindHeight: 'h-36',
  },
  large: {
    width: 8, // 8rem
    height: 12, // 12rem
    tailwindWidth: 'w-32',
    tailwindHeight: 'h-48',
  },
};

/**
 * Calculates the optimal zone height for a 2x3 grid of cards
 * @param cardSize - The size of the cards
 * @returns Tailwind height class
 */
export const getZoneHeight = (cardSize: CardSize): string => {
  const cardHeight = CARD_DIMENSIONS[cardSize].height;
  const rows = 2;
  const padding = 0.5; // p-1 = 0.25rem on each side = 0.5rem total
  const headerSpace = 0.5; // space for title and margins (mb-1 = 0.25rem)
  
  const totalHeight = (cardHeight * rows) + padding + headerSpace;
  
  // Convert to Tailwind class
  if (totalHeight <= 8) return 'h-32';
  if (totalHeight <= 12) return 'h-48';
  if (totalHeight <= 16) return 'h-64';
  if (totalHeight <= 20) return 'h-80';
  if (totalHeight <= 24) return 'h-96';
  return 'h-96'; // fallback
};

/**
 * Gets card dimensions for a given size
 * @param cardSize - The size of the cards
 * @returns Card dimensions object
 */
export const getCardDimensions = (cardSize: CardSize): CardDimensions => {
  return CARD_DIMENSIONS[cardSize];
};
