import React, { useState } from 'react';
import { PlayerPicks as PlayerPicksType, ColorIdentity } from '@/types/card';
import { Card } from './Card';
import { CardSize } from '@/constants/cardDimensions';

interface PlayerPicksProps {
  player: 'P1' | 'P2';
  picks: PlayerPicksType;
  cardSize?: CardSize;
}

/**
 * Component for displaying a player's drafted cards organized by color identity
 * Shows cards in columns sorted by color (W, U, B, R, G, C, M) and CMC
 */
export const PlayerPicks: React.FC<PlayerPicksProps> = ({ player, picks, cardSize = 'large' }) => {
  const [sortOrder, setSortOrder] = useState<'default' | 'cmc' | 'alphabetical'>('default');

  /**
   * Gets the color identity display name
   * @param colorIdentity - Color identity string
   * @returns Display name for the color
   */
  const getColorDisplayName = (colorIdentity: ColorIdentity): string => {
    const colorNames = {
      'W': 'White',
      'U': 'Blue', 
      'B': 'Black',
      'R': 'Red',
      'G': 'Green',
      'C': 'Colorless',
      'M': 'Multicolor',
    };
    return colorNames[colorIdentity];
  };

  /**
   * Gets the color identity CSS class
   * @param colorIdentity - Color identity string
   * @returns CSS class for the color
   */
  const getColorClass = (colorIdentity: ColorIdentity): string => {
    const colorClasses = {
      'W': 'color-w',
      'U': 'color-u',
      'B': 'color-b', 
      'R': 'color-r',
      'G': 'color-g',
      'C': 'color-c',
      'M': 'color-m',
    };
    return colorClasses[colorIdentity];
  };

  /**
   * Sorts cards within a color column based on the current sort order
   * @param cards - Array of cards to sort
   * @returns Sorted array of cards
   */
  const sortCards = (cards: any[]): any[] => {
    switch (sortOrder) {
      case 'cmc':
        return [...cards].sort((a, b) => {
          if (a.card.cmc !== b.card.cmc) {
            return a.card.cmc - b.card.cmc; // Ascending CMC
          }
          return a.card.name.localeCompare(b.card.name); // Alphabetical within same CMC
        });
      case 'alphabetical':
        return [...cards].sort((a, b) => a.card.name.localeCompare(b.card.name));
      default:
        return [...cards].sort((a, b) => {
          if (a.card.cmc !== b.card.cmc) {
            return a.card.cmc - b.card.cmc; // Ascending CMC
          }
          return a.card.name.localeCompare(b.card.name); // Alphabetical within same CMC
        });
    }
  };

  /**
   * Gets the total number of cards across all colors
   * @returns Total card count
   */
  const getTotalCardCount = (): number => {
    return Object.values(picks).reduce((total, cards) => total + cards.length, 0);
  };

  /**
   * Handles sort order changes
   * @param newSortOrder - New sort order to apply
   */
  const handleSortChange = (newSortOrder: 'default' | 'cmc' | 'alphabetical'): void => {
    setSortOrder(newSortOrder);
  };

  const colorOrder: ColorIdentity[] = ['W', 'U', 'B', 'R', 'G', 'C', 'M'];

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{player} Picks</h3>
        <div className="text-sm text-gray-600">
          Total: {getTotalCardCount()} cards
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-4 flex gap-2">
        <span className="text-sm text-gray-600">Sort by:</span>
        {(['default', 'cmc', 'alphabetical'] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => handleSortChange(sort)}
            className={`
              px-3 py-1 text-xs rounded
              ${sortOrder === sort 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {sort.charAt(0).toUpperCase() + sort.slice(1)}
          </button>
        ))}
      </div>

      {/* Color Columns */}
      <div className="flex gap-2">
        {colorOrder.map((colorIdentity) => {
          const cards = picks[colorIdentity] || [];
          const sortedCards = sortCards(cards);

          if (sortedCards.length === 0) return null;

          return (
            <div key={colorIdentity} className="border rounded-lg p-2 flex-1 min-w-0">
              <div className="text-center mb-2">
                <h4 className={`font-medium text-sm ${getColorClass(colorIdentity)}`}>
                  {getColorDisplayName(colorIdentity)}
                </h4>
                <span className="text-xs text-gray-500">
                  {sortedCards.length}
                </span>
              </div>
              
              <div className="relative" style={{ height: '12rem' }}>
                {sortedCards.map((cardInPool, index) => {
                  const isBottomCard = index === sortedCards.length - 1;
                  return (
                    <div 
                      key={cardInPool.card.id} 
                      className="absolute w-full group cursor-pointer transition-all duration-200"
                      style={{ 
                        top: `${index * 2}rem`, // 2rem spacing for more art visibility
                        zIndex: isBottomCard ? 10 : index // Bottom card always on top (z-10), others by index
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.zIndex = '20';
                        // Show 100% of the card when hovering
                        const cardDiv = e.currentTarget.querySelector('div') as HTMLElement;
                        if (cardDiv) {
                          cardDiv.style.height = '12rem';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.zIndex = isBottomCard ? '10' : index.toString();
                        // Return to original height when not hovering
                        const cardDiv = e.currentTarget.querySelector('div') as HTMLElement;
                        if (cardDiv) {
                          cardDiv.style.height = isBottomCard ? '12rem' : '3rem';
                        }
                      }}
                    >
                      <div 
                        className="overflow-hidden rounded"
                        style={{ 
                          height: isBottomCard ? '12rem' : '3rem' // Full height for bottom card, 25% for others
                        }}
                      >
                        <Card
                          cardInPool={cardInPool}
                          size="large"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {getTotalCardCount() === 0 && (
        <div className="text-center text-gray-500 py-8">
          No cards drafted yet
        </div>
      )}
    </div>
  );
};


