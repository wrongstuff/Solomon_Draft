import React from 'react';
import { Pack } from '@/types/card';
import { Card } from './Card';
import { CardSize, getZoneHeight } from '@/constants/cardDimensions';

interface PackDisplayProps {
  pack: Pack;
  onCardSelect: (cardId: string, pileNumber: 1 | 2) => void;
  pile1Cards: string[];
  pile2Cards: string[];
  onSplitPack: () => void;
  currentPhase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
  cardSize?: CardSize;
}

/**
 * Component for displaying the current pack and handling pile splitting
 * Shows cards in a grid with options to assign them to different piles
 */
export const PackDisplay: React.FC<PackDisplayProps> = ({
  pack,
  onCardSelect,
  pile1Cards,
  pile2Cards,
  onSplitPack,
  currentPhase,
  cardSize = 'large',
}) => {
  const isSplittingPhase = currentPhase === 'P1-split' || currentPhase === 'P2-split';
  const bothPilesHaveCards = pile1Cards.length > 0 && pile2Cards.length > 0;

  /**
   * Handles card click for pile assignment
   * @param cardId - ID of the clicked card
   */
  const handleCardClick = (cardId: string): void => {
    if (!isSplittingPhase) return;

    // If card is already in pile 1, move to pile 2
    if (pile1Cards.includes(cardId)) {
      onCardSelect(cardId, 1); // Remove from pile 1
      onCardSelect(cardId, 2); // Add to pile 2
    }
    // If card is already in pile 2, move to pile 1
    else if (pile2Cards.includes(cardId)) {
      onCardSelect(cardId, 2); // Remove from pile 2
      onCardSelect(cardId, 1); // Add to pile 1
    }
    // If card is not assigned, add to pile 1
    else {
      onCardSelect(cardId, 1);
    }
  };


  // Separate cards by their current state
  const unassignedCards = pack.cards.filter(cardInPool => 
    !pile1Cards.includes(cardInPool.card.id) && !pile2Cards.includes(cardInPool.card.id)
  );
  const pile1CardObjects = pack.cards.filter(cardInPool => 
    pile1Cards.includes(cardInPool.card.id)
  );
  const pile2CardObjects = pack.cards.filter(cardInPool => 
    pile2Cards.includes(cardInPool.card.id)
  );

  return (
    <div className="space-y-4">
      {/* Three Column Layout */}
      <div className="flex border border-black rounded-lg overflow-hidden shadow-lg">
        {/* Pile A (Left Column) */}
        <div className="bg-green-200 p-1 flex-1 border-r border-black">
          <h3 className="text-sm font-medium text-gray-800 text-center mb-1">Pile A</h3>
          <div className={`grid grid-cols-3 ${getZoneHeight(cardSize)}`} style={{ gap: '0.0625rem 0.25rem' }}>
            {pile1CardObjects.slice(0, 6).map((cardInPool) => (
              <div
                key={cardInPool.card.id}
                className={`
                  relative transition-all duration-200
                  ${isSplittingPhase ? 'cursor-pointer hover:scale-105' : ''}
                `}
                onClick={() => isSplittingPhase && handleCardClick(cardInPool.card.id)}
              >
                <Card
                  cardInPool={cardInPool}
                  size={cardSize}
                  isSelected={true}
                />
              </div>
            ))}
            {/* Show overflow indicator if more than 6 cards */}
            {pile1CardObjects.length > 6 && (
              <div className="col-span-3 flex items-center justify-center text-gray-500 text-xs">
                +{pile1CardObjects.length - 6} more cards
              </div>
            )}
            {pile1CardObjects.length === 0 && (
              <div className="col-span-3 flex items-center justify-center h-32 text-gray-500 text-sm">
                No cards assigned
              </div>
            )}
          </div>
        </div>

        {/* Initial Pack Area (Middle Column) */}
        <div className="bg-amber-200 p-1 flex-1 border-r border-black relative">
          <h3 className="text-sm font-medium text-gray-800 text-center mb-1">Initial Pack Area</h3>
          <div className={`grid grid-cols-3 ${getZoneHeight(cardSize)}`} style={{ gap: '0.0625rem 0.25rem' }}>
            {unassignedCards.slice(0, 6).map((cardInPool) => (
              <div
                key={cardInPool.card.id}
                className={`
                  relative transition-all duration-200
                  ${isSplittingPhase ? 'cursor-pointer hover:scale-105' : ''}
                `}
                onClick={() => isSplittingPhase && handleCardClick(cardInPool.card.id)}
              >
                <Card
                  cardInPool={cardInPool}
                  size={cardSize}
                  isSelected={false}
                />
              </div>
            ))}
            {/* Show overflow indicator if more than 6 cards */}
            {unassignedCards.length > 6 && (
              <div className="col-span-3 flex items-center justify-center text-gray-500 text-xs">
                +{unassignedCards.length - 6} more cards
              </div>
            )}
            {unassignedCards.length === 0 && !isSplittingPhase && (
              <div className="col-span-3 flex items-center justify-center h-32 text-gray-500 text-sm">
                All cards assigned
              </div>
            )}
          </div>
          {/* Show Split Pack button when all cards are assigned - positioned absolutely */}
          {unassignedCards.length === 0 && isSplittingPhase && (
            <div className="absolute top-4 left-1 right-1 bottom-0 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                <button
                  onClick={onSplitPack}
                  disabled={!bothPilesHaveCards}
                  className={`
                    btn btn-primary px-6 py-2 text-sm
                    ${!bothPilesHaveCards ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  Split Pack
                </button>
                {!bothPilesHaveCards && (
                  <p className="text-xs text-red-600 mt-1 text-center">
                    Each pile must have at least one card
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pile B (Right Column) */}
        <div className="bg-green-200 p-1 flex-1">
          <h3 className="text-sm font-medium text-gray-800 text-center mb-1">Pile B</h3>
          <div className={`grid grid-cols-3 ${getZoneHeight(cardSize)}`} style={{ gap: '0.0625rem 0.25rem' }}>
            {pile2CardObjects.slice(0, 6).map((cardInPool) => (
              <div
                key={cardInPool.card.id}
                className={`
                  relative transition-all duration-200
                  ${isSplittingPhase ? 'cursor-pointer hover:scale-105' : ''}
                `}
                onClick={() => isSplittingPhase && handleCardClick(cardInPool.card.id)}
              >
                <Card
                  cardInPool={cardInPool}
                  size={cardSize}
                  isSelected={true}
                />
              </div>
            ))}
            {/* Show overflow indicator if more than 6 cards */}
            {pile2CardObjects.length > 6 && (
              <div className="col-span-3 flex items-center justify-center text-gray-500 text-xs">
                +{pile2CardObjects.length - 6} more cards
              </div>
            )}
            {pile2CardObjects.length === 0 && (
              <div className="col-span-3 flex items-start justify-start h-32 text-gray-500 text-xs px-1 pt-4">
                <div className="text-left" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                  <div>Click cards to assign them to Piles.</div>
                  <div>Each pile must have at least one card.</div>
                  <div>All cards must be assigned.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};


