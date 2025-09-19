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
 * Static asset path for the Solomon Chop image
 * Uses the GitHub Pages base path for proper deployment
 */
const solomonChopImage = '/Solomon_Draft/solomon_chop.png';

/**
 * Main application component that manages the overall game state
 * and coordinates between different UI sections.
 * 
 * This component handles:
 * - Deck list loading from URLs or seeds
 * - Draft creation and management
 * - UI state management (loading, errors, history visibility)
 * - Navigation between start screen and draft interface
 * 
 * @returns JSX element representing the complete Solomon Draft application
 */
const App: React.FC = () => {
  // Core game state - tracks whether a draft is active and any loading/error states
  const [gameState, setGameState] = useState<GameState>({
    draft: null,
    isLoading: false,
    error: null,
  });
  
  // UI state - controls visibility of the draft history panel
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
  // Deck list state - stores parsed deck list from URL input
  const [parsedDeckList, setParsedDeckList] = useState<DeckListInput | null>(null);
  
  // Seeded deck list state - stores deck list loaded from a seed
  const [seededDeckList, setSeededDeckList] = useState<DeckListInput | null>(null);

  /**
   * Handles deck list input and parsing from a URL.
   * Supports Moxfield and CubeCobra URLs.
   * 
   * @param url - The deck list URL to parse (Moxfield or CubeCobra)
   * @throws Will set error state if URL parsing fails
   */
  const handleDeckInput = useCallback(async (url: string): Promise<void> => {
    // Set loading state and clear any previous errors
    setGameState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Parse the deck list URL and fetch card data
      const deckList = await DeckListParser.parseDeckListUrl(url);
      setParsedDeckList(deckList);
      setGameState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      // Handle parsing errors and update state
      setGameState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to parse deck list' 
      }));
    }
  }, []);

  /**
   * Starts a new draft with the given settings and automatically deals the first pack.
   * This function is called when starting a draft from a URL-loaded deck list.
   * 
   * @param packSize - Number of cards per pack (typically 6-8)
   * @param numberOfRounds - Number of rounds to draft (each round = 2 packs)
   * @throws Will set error state if draft creation fails
   */
  const handleStartDraft = useCallback((
    packSize: number, 
    numberOfRounds: number
  ): void => {
    // Validate that we have a deck list loaded
    if (!parsedDeckList) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'Please load a deck list first' 
      }));
      return;
    }

    try {
      // Create the draft with the loaded deck list and settings
      const draft = DraftService.createDraft(parsedDeckList, packSize, numberOfRounds);
      
      // Automatically deal the first pack to start the draft
      const draftWithFirstPack = DraftService.performDraftAction(draft, 'start-round', {});
      
      // Update game state to show the draft interface
      setGameState(prev => ({ ...prev, draft: draftWithFirstPack, error: null }));
    } catch (error) {
      // Handle draft creation errors
      setGameState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to create draft' 
      }));
    }
  }, [parsedDeckList]);

  /**
   * Handles loading a seed and parsing it into a deck list.
   * Seeds allow recreating the exact same draft order from a previous session.
   * 
   * @param seed - The seed string to load (base64 encoded card order)
   * @throws Will set error state if seed parsing or card fetching fails
   */
  const handleLoadSeed = useCallback(async (seed: string): Promise<void> => {
    // Set loading state and clear any previous errors
    setGameState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Dynamically import seed utilities to avoid circular dependencies
      const { dehashCardOrder } = await import('@/utils/seedUtils');
      
      // Parse the seed to get the original card order and quantities
      const cardData = dehashCardOrder(seed);
      
      // Convert card data to raw deck list format for Scryfall API
      const deckList = cardData
        .map(card => `${card.quantity} ${card.name}`)
        .join('\n');
      
      // Use the existing deck list parser to fetch full card data from Scryfall
      const parsedDeckList = await DeckListParser.parseRawDeckList(deckList);
      
      // Create a seeded deck list input with the actual cards and seed info
      const seededDeckList: DeckListInput = {
        url: `seed:${seed.substring(0, 20)}...`, // Truncated for display
        type: 'seed',
        cards: parsedDeckList.cards,
        name: parsedDeckList.name,
        seed: seed
      };

      // Update state with the seeded deck list and clear any URL-loaded list
      setSeededDeckList(seededDeckList);
      setParsedDeckList(null); // Clear any existing deck list
      setGameState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      // Handle seed parsing or card fetching errors
      setGameState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load seed' 
      }));
    }
  }, []);


  /**
   * Starts a draft with the current seeded deck list.
   * This function is called when starting a draft from a seed-loaded deck list.
   * The seed ensures the exact same card order as the original draft.
   * 
   * @param packSize - Number of cards per pack (typically 6-8)
   * @param numberOfRounds - Number of rounds to draft (each round = 2 packs)
   * @throws Will set error state if seeded draft creation fails
   */
  const handleStartSeededDraftFromList = useCallback(async (
    packSize: number, 
    numberOfRounds: number
  ): Promise<void> => {
    // Validate that we have a seeded deck list loaded
    if (!seededDeckList?.seed) {
      setGameState(prev => ({ 
        ...prev, 
        error: 'No seed loaded' 
      }));
      return;
    }

    // Set loading state and clear any previous errors
    setGameState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create the seeded draft using the original seed for consistent card order
      const draft = await DraftService.createSeededDraft(seededDeckList.seed, packSize, numberOfRounds);
      
      // Automatically deal the first pack to start the draft
      const draftWithFirstPack = DraftService.performDraftAction(draft, 'start-round', {});
      
      // Update game state to show the draft interface
      setGameState(prev => ({ ...prev, draft: draftWithFirstPack, isLoading: false, error: null }));
    } catch (error) {
      // Handle seeded draft creation errors
      setGameState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create seeded draft' 
      }));
    }
  }, [seededDeckList]);

  /**
   * Handles draft actions (splitting packs, choosing piles, etc.).
   * This is the main function that processes all user interactions during a draft.
   * 
   * @param action - The action to perform (e.g., 'split-pack', 'choose-pile', 'start-round')
   * @param data - Additional data for the action (e.g., pile assignments, chosen pile ID)
   * @throws Will set error state if the draft action fails
   */
  const handleDraftAction = useCallback((action: string, data?: unknown): void => {
    // Ensure we have an active draft before processing actions
    if (!gameState.draft) return;

    try {
      // Process the draft action and get the updated draft state
      const updatedDraft = DraftService.performDraftAction(gameState.draft, action, data);
      setGameState(prev => ({ ...prev, draft: updatedDraft }));
    } catch (error) {
      // Handle draft action errors
      setGameState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Draft action failed' 
      }));
    }
  }, [gameState.draft]);

  /**
   * Resets the game state to start over.
   * Clears all draft data, deck lists, and UI state to return to the start screen.
   */
  const handleReset = useCallback((): void => {
    // Reset all state to initial values
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
   * Toggles the visibility of the draft history panel.
   * This allows users to view all actions taken during the current draft.
   */
  const toggleHistory = useCallback((): void => {
    setShowHistory(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="mx-auto px-4 py-8 w-full max-w-[2000px]">
        {/* Global error display - shows any errors that occur during the app lifecycle */}
        {gameState.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {gameState.error}
          </div>
        )}

        {/* Conditional rendering: Start screen vs Draft interface */}
        {!gameState.draft ? (
          /* START SCREEN: Three-column layout with story, image, and controls */
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
                  {/* Deck List Input - URL and seed loading */}
                  <DeckInputForm 
                    onDeckInput={handleDeckInput}
                    onLoadSeed={handleLoadSeed}
                    isLoading={gameState.isLoading}
                  />
                  
                  {/* Draft Settings - Pack size, rounds, and start button */}
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
          /* DRAFT INTERFACE: Main game area when a draft is active */
          <div className="space-y-8">
            {/* Main draft interface - handles pack splitting and pile choosing */}
            <DraftInterface 
              draft={gameState.draft}
              onDraftAction={handleDraftAction}
              onReset={handleReset}
            />
            
            {/* Player pick areas - shows cards collected by each player */}
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
            
            {/* Export section - only shown when draft is complete */}
            {gameState.draft.isComplete && (
              <ExportSection 
                p1Picks={gameState.draft.p1Picks}
                p2Picks={gameState.draft.p2Picks}
              />
            )}
            
            {/* Draft history - collapsible panel showing all actions taken */}
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
