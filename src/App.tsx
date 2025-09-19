import React, { useState, useCallback } from 'react';
import { GameState, DeckListInput } from '@/types/draft';
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
  const [seededDeckList, setSeededDeckList] = useState<DeckListInput | null>(null);

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
   * Starts a new draft with the given settings and automatically deals the first pack
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
      // Create the draft
      const draft = DraftService.createDraft(parsedDeckList, packSize, numberOfRounds);
      
      // Automatically deal the first pack
      const draftWithFirstPack = DraftService.performDraftAction(draft, 'start-round', {});
      
      setGameState(prev => ({ ...prev, draft: draftWithFirstPack, error: null }));
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to create draft' 
      }));
    }
  }, [parsedDeckList]);

  /**
   * Handles loading a seed and parsing it into a deck list
   * @param seed - The seed string to load
   */
  const handleLoadSeed = useCallback(async (seed: string): Promise<void> => {
    setGameState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Parse the seed to get card data
      const { dehashCardOrder } = await import('@/utils/seedUtils');
      const cardData = dehashCardOrder(seed);
      
      // Convert card data to deck list format for Scryfall
      const deckList = cardData
        .map(card => `${card.quantity} ${card.name}`)
        .join('\n');
      
      // Use the existing deck list parser to fetch full card data
      const parsedDeckList = await DeckListParser.parseRawDeckList(deckList);
      
      // Create a seeded deck list input with the actual cards
      const seededDeckList: DeckListInput = {
        url: `seed:${seed.substring(0, 20)}...`, // Truncated for display
        type: 'seed',
        cards: parsedDeckList.cards,
        name: parsedDeckList.name,
        seed: seed
      };

      setSeededDeckList(seededDeckList);
      setParsedDeckList(null); // Clear any existing deck list
      setGameState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load seed' 
      }));
    }
  }, []);


  /**
   * Starts a draft with the current seeded deck list
   * @param packSize - Number of cards per pack
   * @param numberOfRounds - Number of rounds to draft
   */
  const handleStartSeededDraftFromList = useCallback(async (
    packSize: number, 
    numberOfRounds: number
  ): Promise<void> => {
    if (!seededDeckList?.seed) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'No seed loaded' 
      }));
      return;
    }

    setGameState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create the seeded draft
      const draft = await DraftService.createSeededDraft(seededDeckList.seed, packSize, numberOfRounds);
      
      // Automatically deal the first pack
      const draftWithFirstPack = DraftService.performDraftAction(draft, 'start-round', {});
      
      setGameState(prev => ({ ...prev, draft: draftWithFirstPack, isLoading: false, error: null }));
    } catch (error) {
      setGameState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create seeded draft' 
      }));
    }
  }, [seededDeckList]);

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
    setSeededDeckList(null);
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
            <div className="grid grid-cols-2 gap-6">
            <DeckInputForm 
              onDeckInput={handleDeckInput}
              onLoadSeed={handleLoadSeed}
              isLoading={gameState.isLoading}
              parsedDeckList={parsedDeckList || seededDeckList}
            />
            <DraftSettings 
              onStartDraft={parsedDeckList ? handleStartDraft : handleStartSeededDraftFromList}
              isLoading={gameState.isLoading}
              hasDeckList={!!(parsedDeckList || seededDeckList)}
              parsedDeckList={parsedDeckList || seededDeckList}
            />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <DraftInterface 
              draft={gameState.draft}
              onDraftAction={handleDraftAction}
              onReset={handleReset}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PlayerPicks 
                player="P1" 
                picks={gameState.draft.p1Picks}
                cardSize="large"
              />
              <PlayerPicks 
                player="P2" 
                picks={gameState.draft.p2Picks}
                cardSize="large"
              />
            </div>
            {gameState.draft.isComplete && (
              <ExportSection 
                p1Picks={gameState.draft.p1Picks}
                p2Picks={gameState.draft.p2Picks}
              />
            )}
            
            <DraftHistory 
              history={gameState.draft.history}
              isVisible={showHistory}
              onToggle={toggleHistory}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
