import React, { useState } from 'react';
import { DraftState } from '@/types/draft';
import { Pile } from '@/types/card';
import { Card } from './Card';
import { PackDisplay } from './PackDisplay';
import { PileSelector } from './PileSelector';

interface DraftInterfaceProps {
  draft: DraftState;
  onDraftAction: (action: string, data?: unknown) => void;
  onReset: () => void;
}

/**
 * Main interface component for the draft process
 * Handles pack display, pile splitting, and pile selection
 */
export const DraftInterface: React.FC<DraftInterfaceProps> = ({ 
  draft, 
  onDraftAction, 
  onReset 
}) => {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [pile1Cards, setPile1Cards] = useState<string[]>([]);
  const [pile2Cards, setPile2Cards] = useState<string[]>([]);

  /**
   * Handles starting a new round by dealing a pack
   */
  const handleStartRound = (): void => {
    onDraftAction('start-round');
  };

  /**
   * Handles splitting the current pack into two piles
   */
  const handleSplitPack = (): void => {
    if (pile1Cards.length === 0 || pile2Cards.length === 0) {
      alert('Each pile must contain at least one card');
      return;
    }

    if (pile1Cards.length + pile2Cards.length !== draft.activePack?.cards.length) {
      alert('All cards must be assigned to piles');
      return;
    }

    const piles: Pile[] = [
      {
        id: 'pile-1',
        cards: pile1Cards.map(cardId => 
          draft.activePack!.cards.find(c => c.card.id === cardId)!
        ),
      },
      {
        id: 'pile-2',
        cards: pile2Cards.map(cardId => 
          draft.activePack!.cards.find(c => c.card.id === cardId)!
        ),
      },
    ];

    onDraftAction('split-pack', { piles });
    setSelectedCards(new Set());
    setPile1Cards([]);
    setPile2Cards([]);
  };

  /**
   * Handles choosing a pile
   * @param pileId - ID of the chosen pile
   */
  const handleChoosePile = (pileId: string): void => {
    onDraftAction('choose-pile', { pileId });
  };

  /**
   * Handles card selection for pile splitting
   * @param cardId - ID of the card to toggle
   * @param pileNumber - Which pile to assign the card to (1 or 2)
   */
  const handleCardSelect = (cardId: string, pileNumber: 1 | 2): void => {
    if (pileNumber === 1) {
      setPile1Cards(prev => 
        prev.includes(cardId) 
          ? prev.filter(id => id !== cardId)
          : [...prev, cardId]
      );
    } else {
      setPile2Cards(prev => 
        prev.includes(cardId) 
          ? prev.filter(id => id !== cardId)
          : [...prev, cardId]
      );
    }
  };

  /**
   * Gets the current phase description for display
   */
  const getPhaseDescription = (): string => {
    const { currentPhase, currentRound, settings } = draft;
    const phaseDescriptions = {
      'P1-split': `Round ${currentRound}/${settings.numberOfRounds} - Player 1: Split Pack`,
      'P1-choose': `Round ${currentRound}/${settings.numberOfRounds} - Player 1: Choose Pile`,
      'P2-split': `Round ${currentRound}/${settings.numberOfRounds} - Player 2: Split Pack`,
      'P2-choose': `Round ${currentRound}/${settings.numberOfRounds} - Player 2: Choose Pile`,
    };
    return phaseDescriptions[currentPhase];
  };

  if (draft.isComplete) {
    return (
      <div className="card text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Draft Complete!</h2>
        <p className="text-gray-600 mb-4">
          Both players have finished drafting. You can now export the final deck lists.
        </p>
        <button onClick={onReset} className="btn btn-primary">
          Start New Draft
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Draft Status */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{getPhaseDescription()}</h2>
            <p className="text-gray-600">
              Cards remaining in pool: <strong>{draft.cardsInPool.length}</strong>
            </p>
          </div>
          <button onClick={onReset} className="btn btn-secondary">
            Reset Draft
          </button>
        </div>
      </div>

      {/* Pack Display and Actions */}
      {!draft.activePack ? (
        <div className="card text-center">
          <h3 className="text-lg font-semibold mb-4">Ready to Start Round</h3>
          <button onClick={handleStartRound} className="btn btn-primary">
            Deal Pack
          </button>
        </div>
      ) : draft.activePack.piles ? (
        <PileSelector 
          piles={draft.activePack.piles}
          onChoosePile={handleChoosePile}
          currentPhase={draft.currentPhase}
        />
      ) : (
        <PackDisplay
          pack={draft.activePack}
          onCardSelect={handleCardSelect}
          pile1Cards={pile1Cards}
          pile2Cards={pile2Cards}
          onSplitPack={handleSplitPack}
          currentPhase={draft.currentPhase}
        />
      )}
    </div>
  );
};


