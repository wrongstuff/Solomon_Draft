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
// Import the image as a static asset
const solomonChopImage = '/Solomon_Draft/solomon_chop.png';

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
      
      <main className="mx-auto px-4 py-8 w-full max-w-[2000px]">
        {gameState.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {gameState.error}
          </div>
        )}

        {!gameState.draft ? (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Story and Rules */}
              <div className="card aspect-square overflow-y-auto">
                <h2 className="text-3xl font-bold mb-4">The Story of King Solomon</h2>
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg">
                    Two women came before King Solomon, each claiming to be the mother of the same baby. With no witnesses 
                    and both women insisting the child was theirs, Solomon faced an impossible decision.
 
                    In his wisdom, Solomon ordered the baby to be cut in half so each woman could have a portion. Something something "religion"
                  </p>
                  
                  <h3 className="text-2xl font-semibold mt-6 mb-3 text-gray-800">How Solomon Draft Works</h3>
                  
                  <div className="space-y-3 text-lg">
                    <div>
                      - The environment is meant to be a subset of an existing cube, though any card list can work. 
                      You know what cards CAN be in the environment, but not if they will. Just because you see an A doesn't mean you'll see the B
                      </div>
                      <div>
                      - One player splits the pack into two piles. They must assign every card to a pile, and each pile must have at least one card.
                    </div>
                    <div>
                      - The other player chooses which pile to add to their collection. 
                      The remaining pile goes to the splitter.
                    </div>
                    <div>
                      - Players alternate who splits and who chooses each pack. This continues until all of the rounds are complete. A round consists of two packs.

                    </div>
                    <div>
                      <strong> Do you try to cut your opponent off of something, or to push them into a direction 
                      so you get what you want? </strong>                    
                      </div>
                    <div>
                      This format is designed to be played as commander limited (30 life). 
                      Any two monocolored creatures can be used as commanders, however, all cards in your 60 card deck must
                      be playable with those commanders and adhere to their color identity. This constraint is the core of the format, as 
                      just because you drafted cards doesn't mean you can play them. Staying flexible early is important, lots of pivoting
                      is key.
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column - Image */}
              <div className="flex items-center justify-center aspect-square">
                <img 
                  src={solomonChopImage} 
                  alt="Solomon Chop" 
                  className="w-full h-full object-cover rounded-lg shadow-md"
                />
              </div>

              {/* Right Column - All Input and Settings */}
              <div className="card aspect-square overflow-y-auto">
                <div className="space-y-6">
                  {/* Deck List Input */}
                  <DeckInputForm 
                    onDeckInput={handleDeckInput}
                    onLoadSeed={handleLoadSeed}
                    isLoading={gameState.isLoading}
                  />
                  
                  {/* Draft Settings */}
                  <DraftSettings 
                    onStartDraft={parsedDeckList ? handleStartDraft : handleStartSeededDraftFromList}
                    isLoading={gameState.isLoading}
                    hasDeckList={!!(parsedDeckList || seededDeckList)}
                    parsedDeckList={parsedDeckList || seededDeckList}
                  />
                </div>
              </div>
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
