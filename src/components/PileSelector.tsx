import React from 'react';
import { Pile } from '@/types/card';
import { Card } from './Card';
import { CardSize, getZoneHeight } from '@/constants/cardDimensions';

interface PileSelectorProps {
  piles: Pile[];
  onChoosePile: (pileId: string) => void;
  currentPhase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
  cardSize?: CardSize;
}

/**
 * Component for displaying two piles and allowing the active player to choose one
 * Shows both piles side by side with clear visual distinction
 */
export const PileSelector: React.FC<PileSelectorProps> = ({
  piles,
  onChoosePile,
  currentPhase,
  cardSize = 'large',
}) => {
  const isChoosingPhase = currentPhase === 'P1-choose' || currentPhase === 'P2-choose';

  /**
   * Handles pile selection via button click
   * @param pileId - ID of the selected pile
   */
  const handlePileSelect = (pileId: string): void => {
    if (!isChoosingPhase) return;
    onChoosePile(pileId);
  };


  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Choose a Pile</h3>
          <p className="text-gray-600">
            {isChoosingPhase 
              ? 'Click "Select" on the pile you want to add to your collection'
              : 'Waiting for pile selection...'
            }
          </p>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex border border-black rounded-lg overflow-hidden shadow-lg">
        {/* Pile A (Left Column) */}
        <div className="bg-green-200 p-1 flex-1 border-r border-black flex flex-col">
          <h3 className="text-sm font-medium text-gray-800 text-center mb-1">Pile A</h3>
          <div className={`grid grid-cols-3 ${getZoneHeight(cardSize)}`} style={{ gap: '0.0625rem 0.25rem' }}>
            {piles[0]?.cards.slice(0, 6).map((cardInPool) => (
                <Card
                  key={cardInPool.card.id}
                  cardInPool={cardInPool}
                  size={cardSize}
                />
            ))}
            {/* Show overflow indicator if more than 6 cards */}
            {piles[0]?.cards && piles[0].cards.length > 6 && (
              <div className="col-span-3 flex items-center justify-center text-gray-500 text-xs">
                +{piles[0].cards.length - 6} more cards
              </div>
            )}
          </div>
          {/* Select Button */}
          {isChoosingPhase && (
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => handlePileSelect(piles[0]?.id || '')}
                className="btn btn-primary px-4 py-2 text-sm"
              >
                Select Pile A
              </button>
            </div>
          )}
        </div>

        {/* Empty Middle Column for Visual Balance */}
        <div className="bg-amber-200 p-1 flex-1 border-r border-black">
          <h3 className="text-sm font-medium text-gray-800 text-center mb-1">Choose One</h3>
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Select Pile A or Pile B
          </div>
        </div>

        {/* Pile B (Right Column) */}
        <div className="bg-green-200 p-1 flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-800 text-center mb-1">Pile B</h3>
          <div className={`grid grid-cols-3 ${getZoneHeight(cardSize)}`} style={{ gap: '0.0625rem 0.25rem' }}>
            {piles[1]?.cards.slice(0, 6).map((cardInPool) => (
                <Card
                  key={cardInPool.card.id}
                  cardInPool={cardInPool}
                  size={cardSize}
                />
            ))}
            {/* Show overflow indicator if more than 6 cards */}
            {piles[1]?.cards && piles[1].cards.length > 6 && (
              <div className="col-span-3 flex items-center justify-center text-gray-500 text-xs">
                +{piles[1].cards.length - 6} more cards
              </div>
            )}
          </div>
          {/* Select Button */}
          {isChoosingPhase && (
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => handlePileSelect(piles[1]?.id || '')}
                className="btn btn-primary px-4 py-2 text-sm"
              >
                Select Pile B
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};


