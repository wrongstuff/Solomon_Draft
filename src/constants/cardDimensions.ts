/**
 * Card dimension constants - single source of truth for all card sizes
 * Used across components to ensure consistency and enable future dynamic resizing
 * 
 * This module provides a centralized way to manage card sizing throughout the application.
 * All card dimensions are defined here to maintain consistency and make it easy to
 * adjust card sizes globally if needed.
 */

/**
 * Available card sizes for different contexts.
 * - small: Used in compact views or when space is limited
 * - medium: Default size for most card displays
 * - large: Used in main draft areas and detailed views
 */
export type CardSize = 'small' | 'medium' | 'large';

/**
 * Represents the dimensions of a card in both rem units and Tailwind classes.
 * This interface provides both the raw numeric values and the corresponding
 * Tailwind CSS classes for consistent styling.
 */
export interface CardDimensions {
  /** Width in rem units */
  width: number;
  /** Height in rem units */
  height: number;
  /** Tailwind CSS class for width (e.g., 'w-24') */
  tailwindWidth: string;
  /** Tailwind CSS class for height (e.g., 'h-36') */
  tailwindHeight: string;
}

/**
 * Card dimension definitions for all available sizes.
 * Each size is optimized for different use cases and screen contexts.
 */
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
 * Calculates the optimal zone height for a 2x3 grid of cards.
 * This function determines the appropriate container height based on card size,
 * accounting for padding, headers, and spacing to ensure cards fit properly.
 * 
 * @param cardSize - The size of the cards to calculate height for
 * @returns Tailwind CSS height class (e.g., 'h-48', 'h-64')
 */
export const getZoneHeight = (cardSize: CardSize): string => {
  const cardHeight = CARD_DIMENSIONS[cardSize].height;
  const rows = 2; // Standard 2-row grid for card zones
  const padding = 0.5; // p-1 = 0.25rem on each side = 0.5rem total
  const headerSpace = 0.5; // space for title and margins (mb-1 = 0.25rem)
  
  const totalHeight = (cardHeight * rows) + padding + headerSpace;
  
  // Convert to appropriate Tailwind height class
  if (totalHeight <= 8) return 'h-32';
  if (totalHeight <= 12) return 'h-48';
  if (totalHeight <= 16) return 'h-64';
  if (totalHeight <= 20) return 'h-80';
  if (totalHeight <= 24) return 'h-96';
  return 'h-96'; // fallback for very large cards
};

/**
 * Gets the complete card dimensions for a given size.
 * This is a simple accessor function that returns the dimensions object
 * for the specified card size.
 * 
 * @param cardSize - The size of the cards to get dimensions for
 * @returns Complete CardDimensions object with width, height, and Tailwind classes
 */
export const getCardDimensions = (cardSize: CardSize): CardDimensions => {
  return CARD_DIMENSIONS[cardSize];
};
