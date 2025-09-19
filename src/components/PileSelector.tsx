import React, { useState } from 'react';
import { Pile } from '@/types/card';
import { Card } from './Card';

interface PileSelectorProps {
  piles: Pile[];
  onChoosePile: (pileId: string) => void;
  currentPhase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
}

/**
 * Component for displaying two piles and allowing the active player to choose one
 * Shows both piles side by side with clear visual distinction
 */
export const PileSelector: React.FC<PileSelectorProps> = ({
  piles,
  onChoosePile,
  currentPhase,
}) => {
  const [selectedPile, setSelectedPile] = useState<string | null>(null);
  const isChoosingPhase = currentPhase === 'P1-choose' || currentPhase === 'P2-choose';

  /**
   * Handles pile selection
   * @param pileId - ID of the selected pile
   */
  const handlePileSelect = (pileId: string): void => {
    if (!isChoosingPhase) return;
    setSelectedPile(pileId);
  };

  /**
   * Handles confirming the pile choice
   */
  const handleConfirmChoice = (): void => {
    if (selectedPile) {
      onChoosePile(selectedPile);
    }
  };

  /**
   * Gets the pile display title
   * @param pileIndex - Index of the pile (0 or 1)
   * @returns Display title for the pile
   */
  const getPileTitle = (pileIndex: number): string => {
    return `Pile ${pileIndex + 1} (${piles[pileIndex].cards.length} cards)`;
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Choose a Pile</h3>
          <p className="text-gray-600">
            {isChoosingPhase 
              ? 'Select which pile you want to add to your collection'
              : 'Waiting for pile selection...'
            }
          </p>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex border border-black rounded-lg overflow-hidden shadow-lg">
        {/* Pile A (Left Column) */}
        <div 
          className={`
            bg-green-200 p-2 flex-1 border-r border-black transition-all duration-200
            ${selectedPile === piles[0]?.id 
              ? 'ring-2 ring-blue-500 ring-inset' 
              : isChoosingPhase 
                ? 'hover:bg-green-300 cursor-pointer' 
                : ''
            }
          `}
          onClick={() => handlePileSelect(piles[0]?.id || '')}
        >
          <h3 className="text-sm font-medium text-gray-800 text-center mb-2">Pile A</h3>
          <div className="grid grid-cols-3 gap-0.5 h-72">
            {piles[0]?.cards.slice(0, 6).map((cardInPool) => (
                <Card
                  key={cardInPool.card.id}
                  cardInPool={cardInPool}
                  size="medium"
                />
            ))}
            {/* Show overflow indicator if more than 6 cards */}
            {piles[0]?.cards && piles[0].cards.length > 6 && (
              <div className="col-span-3 flex items-center justify-center text-gray-500 text-xs">
                +{piles[0].cards.length - 6} more cards
              </div>
            )}
            {selectedPile === piles[0]?.id && (
              <div className="col-span-3 mt-3 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Selected
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Empty Middle Column for Visual Balance */}
        <div className="bg-amber-200 p-2 flex-1 border-r border-black">
          <h3 className="text-sm font-medium text-gray-800 text-center mb-2">Choose One</h3>
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Select Pile A or Pile B
          </div>
        </div>

        {/* Pile B (Right Column) */}
        <div 
          className={`
            bg-green-200 p-2 flex-1 transition-all duration-200
            ${selectedPile === piles[1]?.id 
              ? 'ring-2 ring-green-500 ring-inset' 
              : isChoosingPhase 
                ? 'hover:bg-green-300 cursor-pointer' 
                : ''
            }
          `}
          onClick={() => handlePileSelect(piles[1]?.id || '')}
        >
          <h3 className="text-sm font-medium text-gray-800 text-center mb-2">Pile B</h3>
          <div className="grid grid-cols-3 gap-0.5 h-72">
            {piles[1]?.cards.slice(0, 6).map((cardInPool) => (
                <Card
                  key={cardInPool.card.id}
                  cardInPool={cardInPool}
                  size="medium"
                />
            ))}
            {/* Show overflow indicator if more than 6 cards */}
            {piles[1]?.cards && piles[1].cards.length > 6 && (
              <div className="col-span-3 flex items-center justify-center text-gray-500 text-xs">
                +{piles[1].cards.length - 6} more cards
              </div>
            )}
            {selectedPile === piles[1]?.id && (
              <div className="col-span-3 mt-3 text-center">
                <div className="inline-flex items-center gap-2 text-green-600 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Selected
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Choice Button */}
      {isChoosingPhase && (
        <div className="card text-center">
          <button
            onClick={handleConfirmChoice}
            disabled={!selectedPile}
            className={`
              btn btn-primary px-8 py-3
              ${!selectedPile ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Choose This Pile
          </button>
          {!selectedPile && (
            <p className="text-sm text-gray-500 mt-2">
              Please select a pile to continue
            </p>
          )}
        </div>
      )}
    </div>
  );
};


