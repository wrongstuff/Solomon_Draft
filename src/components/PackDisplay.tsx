import React from 'react';
import { Pack } from '@/types/card';
import { Card } from './Card';

interface PackDisplayProps {
  pack: Pack;
  onCardSelect: (cardId: string, pileNumber: 1 | 2) => void;
  pile1Cards: string[];
  pile2Cards: string[];
  onSplitPack: () => void;
  currentPhase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
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
}) => {
  const isSplittingPhase = currentPhase === 'P1-split' || currentPhase === 'P2-split';
  const allCardsAssigned = pile1Cards.length + pile2Cards.length === pack.cards.length;
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

  /**
   * Gets the visual state of a card based on its pile assignment
   * @param cardId - ID of the card
   * @returns Visual state string
   */
  const getCardState = (cardId: string): 'unassigned' | 'pile1' | 'pile2' => {
    if (pile1Cards.includes(cardId)) return 'pile1';
    if (pile2Cards.includes(cardId)) return 'pile2';
    return 'unassigned';
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Current Pack</h3>
        <div className="text-sm text-gray-600">
          {pack.cards.length} cards
        </div>
      </div>

      {isSplittingPhase && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium text-blue-900 mb-2">Split Instructions</h4>
          <p className="text-sm text-blue-800">
            Click cards to assign them to Pile 1 or Pile 2. Each pile must have at least one card.
          </p>
          <div className="mt-2 flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              Pile 1: {pile1Cards.length} cards
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              Pile 2: {pile2Cards.length} cards
            </span>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {pack.cards.map((cardInPool) => {
          const cardState = getCardState(cardInPool.card.id);
          const isSelected = pile1Cards.includes(cardInPool.card.id) || 
                           pile2Cards.includes(cardInPool.card.id);

          return (
            <div
              key={cardInPool.card.id}
              className={`
                relative transition-all duration-200
                ${isSplittingPhase ? 'cursor-pointer' : ''}
                ${isSelected ? 'scale-105' : ''}
              `}
              onClick={() => handleCardClick(cardInPool.card.id)}
            >
              <Card
                cardInPool={cardInPool}
                size="medium"
                isSelected={isSelected}
              />
              
              {/* Pile indicator overlay */}
              {isSelected && (
                <div className={`
                  absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold
                  ${cardState === 'pile1' ? 'bg-blue-500' : 'bg-green-500'}
                `}>
                  {cardState === 'pile1' ? '1' : '2'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Split Pack Button */}
      {isSplittingPhase && (
        <div className="text-center">
          <button
            onClick={onSplitPack}
            disabled={!allCardsAssigned || !bothPilesHaveCards}
            className={`
              btn btn-primary px-8 py-3
              ${!allCardsAssigned || !bothPilesHaveCards ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Split Pack
          </button>
          {!allCardsAssigned && (
            <p className="text-sm text-red-600 mt-2">
              All cards must be assigned to piles
            </p>
          )}
          {!bothPilesHaveCards && allCardsAssigned && (
            <p className="text-sm text-red-600 mt-2">
              Each pile must contain at least one card
            </p>
          )}
        </div>
      )}
    </div>
  );
};


