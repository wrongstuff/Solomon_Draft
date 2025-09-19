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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {piles.map((pile, index) => (
          <div
            key={pile.id}
            className={`
              border-2 rounded-lg p-4 transition-all duration-200
              ${selectedPile === pile.id 
                ? 'border-blue-500 bg-blue-50' 
                : isChoosingPhase 
                  ? 'border-gray-300 hover:border-blue-300 cursor-pointer' 
                  : 'border-gray-300'
              }
            `}
            onClick={() => handlePileSelect(pile.id)}
          >
            <h4 className="font-medium mb-3 text-center">
              {getPileTitle(index)}
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pile.cards.map((cardInPool) => (
                <Card
                  key={cardInPool.card.id}
                  cardInPool={cardInPool}
                  size="small"
                />
              ))}
            </div>

            {selectedPile === pile.id && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Selected
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isChoosingPhase && (
        <div className="text-center">
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


