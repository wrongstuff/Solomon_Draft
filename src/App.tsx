import React, { useState, useCallback } from 'react';
import { GameState, DraftState, DeckListInput } from '@/types/draft';
import { DeckListParser } from '@/services/deckParsers';
import { DraftService } from '@/services/draftService';
import { Header } from '@/components/Header';
import { DeckInputForm } from '@/components/DeckInputForm';
import { DraftSettings } from '@/components/DraftSettings';
import { DraftInterface } from '@/components/DraftInterface';
import { PlayerPicks } from '@/components/PlayerPicks';
import { ExportSection } from '@/components/ExportSection';
import { DraftHistory } from '@/components/DraftHistory';

/**
 * Main application component that manages the overall game state
 * and coordinates between different UI sections
 */
const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    draft: null,
    isLoading: false,
    error: null,
  });
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [parsedDeckList, setParsedDeckList] = useState<DeckListInput | null>(null);

  /**
   * Handles deck list input and parsing
   * @param url - The deck list URL to parse
   */
  const handleDeckInput = useCallback(async (url: string): Promise<void> => {
    setGameState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const deckList = await DeckListParser.parseDeckListUrl(url);
      setParsedDeckList(deckList);
      setGameState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to parse deck list' 
      }));
    }
  }, []);

  /**
   * Starts a new draft with the given settings
   * @param packSize - Number of cards per pack
   * @param numberOfRounds - Number of rounds to draft
   */
  const handleStartDraft = useCallback((
    packSize: number, 
    numberOfRounds: number
  ): void => {
    if (!parsedDeckList) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'Please load a deck list first' 
      }));
      return;
    }

    try {
      const draft = DraftService.createDraft(parsedDeckList, packSize, numberOfRounds);
      setGameState(prev => ({ ...prev, draft, error: null }));
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to create draft' 
      }));
    }
  }, [parsedDeckList]);

  /**
   * Handles draft actions (splitting packs, choosing piles)
   * @param action - The action to perform
   * @param data - Additional data for the action
   */
  const handleDraftAction = useCallback((action: string, data?: unknown): void => {
    if (!gameState.draft) return;

    try {
      const updatedDraft = DraftService.performDraftAction(gameState.draft, action, data);
      setGameState(prev => ({ ...prev, draft: updatedDraft }));
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Draft action failed' 
      }));
    }
  }, [gameState.draft]);

  /**
   * Resets the game state to start over
   */
  const handleReset = useCallback((): void => {
    setGameState({
      draft: null,
      isLoading: false,
      error: null,
    });
    setShowHistory(false);
    setParsedDeckList(null);
  }, []);

  /**
   * Toggles the visibility of the draft history
   */
  const toggleHistory = useCallback((): void => {
    setShowHistory(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {gameState.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {gameState.error}
          </div>
        )}

        {!gameState.draft ? (
          <div className="space-y-8">
            <DeckInputForm 
              onDeckInput={handleDeckInput}
              isLoading={gameState.isLoading}
            />
            <DraftSettings 
              onStartDraft={handleStartDraft}
              isLoading={gameState.isLoading}
              hasDeckList={!!parsedDeckList}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <DraftInterface 
              draft={gameState.draft}
              onDraftAction={handleDraftAction}
              onReset={handleReset}
            />
            
            <DraftHistory 
              history={gameState.draft.history}
              isVisible={showHistory}
              onToggle={toggleHistory}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PlayerPicks 
                player="P1" 
                picks={gameState.draft.p1Picks} 
              />
              <PlayerPicks 
                player="P2" 
                picks={gameState.draft.p2Picks} 
              />
            </div>
            {gameState.draft.isComplete && (
              <ExportSection 
                p1Picks={gameState.draft.p1Picks}
                p2Picks={gameState.draft.p2Picks}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
