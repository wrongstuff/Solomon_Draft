import { DraftState, DraftSettings, DeckListInput, DraftAction } from '@/types/draft';
import { CardInPool, Pile, Pack, ColorIdentity } from '@/types/card';
import { hashCardOrder, dehashCardOrder } from '@/utils/seedUtils';
import { scryfallService } from './scryfall';

/**
 * Service for managing draft game logic and state transitions
 * Handles pack creation, pile splitting, and player actions
 */
export class DraftService {
  /**
   * Creates a new draft with the given settings and deck list
   * @param deckList - The parsed deck list to use for the draft
   * @param packSize - Number of cards per pack
   * @param numberOfRounds - Number of rounds to draft
   * @returns New draft state ready to begin
   */
  static createDraft(deckList: DeckListInput, packSize: number, numberOfRounds: number): DraftState {
    const poolSize = 2 * packSize * numberOfRounds;
    
    if (deckList.cards.length < poolSize) {
      throw new Error(`Not enough cards in deck list. Need at least ${poolSize}, got ${deckList.cards.length}`);
    }

    // Create a copy of the deck list and shuffle it to create the pool
    const shuffledCards = this.shuffleArray([...deckList.cards]);
    const cardsInPool = shuffledCards.slice(0, poolSize);
    
    // Generate a seed from the card order
    const seed = hashCardOrder(cardsInPool);

    const settings: DraftSettings = {
      packSize,
      numberOfRounds,
      poolSize,
      seed,
    };

    return {
      settings,
      cardsInPool,
      currentRound: 1,
      currentPack: 1,
      currentPhase: 'P1-split',
      activePack: null,
      p1Picks: this.initializePlayerPicks(),
      p2Picks: this.initializePlayerPicks(),
      isComplete: false,
      history: [],
    };
  }

  /**
   * Creates a new draft from a seed
   * @param seed - The seed string to reconstruct the draft from
   * @param packSize - Number of cards per pack
   * @param numberOfRounds - Number of rounds to draft
   * @returns Promise resolving to new draft state ready to begin
   */
  static async createSeededDraft(seed: string, packSize: number, numberOfRounds: number): Promise<DraftState> {
    try {
      // 1. Dehash seed to get card data (card names and quantities)
      const cardData = dehashCardOrder(seed);
      
      // 2. Convert card data to deck list format for Scryfall
      const deckList = cardData
        .map(card => `${card.quantity} ${card.name}`)
        .join('\n');
      
      console.log('Reconstructed deck list from seed:', deckList.substring(0, 200) + '...');
      
      // 3. Fetch full card data from Scryfall using the deck list
      const cardOrder = await scryfallService.convertDeckListToCards(deckList);
      
      if (cardOrder.length === 0) {
        throw new Error('No valid cards found in seed');
      }
      
      console.log('Successfully loaded', cardOrder.length, 'cards from seed');
      
      // 4. Create draft with reconstructed cards
      return this.createDraftWithCards(cardOrder, packSize, numberOfRounds);
    } catch (error) {
      throw new Error(`Failed to create seeded draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a draft with a specific card order (internal helper)
   * @param cardsInPool - The exact cards to use in the draft pool
   * @param packSize - Number of cards per pack
   * @param numberOfRounds - Number of rounds to draft
   * @returns New draft state ready to begin
   */
  private static createDraftWithCards(cardsInPool: CardInPool[], packSize: number, numberOfRounds: number): DraftState {
    const poolSize = 2 * packSize * numberOfRounds;
    
    if (cardsInPool.length < poolSize) {
      throw new Error(`Not enough cards in seed. Need at least ${poolSize}, got ${cardsInPool.length}`);
    }

    // Use only the cards we need for the draft
    const draftCards = cardsInPool.slice(0, poolSize);
    
    // Generate a seed from the card order
    const seed = hashCardOrder(draftCards);

    const settings: DraftSettings = {
      packSize,
      numberOfRounds,
      poolSize,
      seed,
    };

    return {
      settings,
      cardsInPool: draftCards,
      currentRound: 1,
      currentPack: 1,
      currentPhase: 'P1-split',
      activePack: null,
      p1Picks: this.initializePlayerPicks(),
      p2Picks: this.initializePlayerPicks(),
      isComplete: false,
      history: [],
    };
  }

  /**
   * Performs a draft action and returns the updated draft state
   * @param draft - Current draft state
   * @param action - Action to perform
   * @param data - Additional data for the action
   * @returns Updated draft state
   */
  static performDraftAction(draft: DraftState, action: string, data?: unknown): DraftState {
    switch (action) {
      case 'start-round':
        return this.startRound(draft);
      case 'split-pack':
        return this.splitPack(draft, data as { piles: Pile[] });
      case 'choose-pile':
        return this.choosePile(draft, data as { pileId: string });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Creates a new history entry for tracking draft actions
   * @param actionType - Type of action being recorded
   * @param round - Current round number
   * @param phase - Current phase
   * @param data - Action-specific data
   * @returns New DraftAction object
   */
  private static createHistoryEntry(
    actionType: DraftAction['actionType'],
    round: number,
    phase: DraftAction['phase'],
    data: DraftAction['data']
  ): DraftAction {
    return {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round,
      phase,
      actionType,
      timestamp: new Date(),
      data,
    };
  }

  /**
   * Starts a new round by dealing a pack to the active player
   * @param draft - Current draft state
   * @returns Updated draft state with new pack
   */
  private static startRound(draft: DraftState): DraftState {
    if (draft.cardsInPool.length < draft.settings.packSize) {
      // Not enough cards for a full pack, draft is complete
      return { ...draft, isComplete: true };
    }

    const packCards = draft.cardsInPool.splice(0, draft.settings.packSize);
    const activePack: Pack = {
      id: `pack-${draft.currentRound}-${draft.currentPhase}`,
      cards: packCards,
      isActive: true,
    };

    // Record pack dealt action in history
    const historyEntry = this.createHistoryEntry(
      'pack-dealt',
      draft.currentRound,
      draft.currentPhase,
      { packCards: [...packCards] }
    );

    return {
      ...draft,
      activePack,
      history: [...draft.history, historyEntry],
    };
  }

  /**
   * Handles pack splitting by the active player
   * @param draft - Current draft state
   * @param data - Pile data from the split
   * @returns Updated draft state
   */
  private static splitPack(draft: DraftState, data: { piles: Pile[] }): DraftState {
    if (!draft.activePack || data.piles.length !== 2) {
      throw new Error('Invalid pack split data');
    }

    const { piles } = data;
    const totalCards = piles[0].cards.length + piles[1].cards.length;
    
    if (totalCards !== draft.activePack.cards.length) {
      throw new Error('All cards must be assigned to piles');
    }

    if (piles[0].cards.length === 0 || piles[1].cards.length === 0) {
      throw new Error('Each pile must contain at least one card');
    }

    // Determine who is splitting
    const splitter = draft.currentPhase === 'P1-split' ? 'P1' : 'P2';
    
    // Record pack split action in history
    const historyEntry = this.createHistoryEntry(
      'pack-split',
      draft.currentRound,
      draft.currentPhase,
      { 
        piles: [...piles], 
        splitter 
      }
    );

    // Store the piles and move to the choosing phase
    const nextPhase = draft.currentPhase === 'P1-split' ? 'P2-choose' : 'P1-choose';
    
    return {
      ...draft,
      currentPhase: nextPhase,
      activePack: {
        ...draft.activePack,
        piles,
      },
      history: [...draft.history, historyEntry],
    };
  }

  /**
   * Handles pile selection by the choosing player
   * @param draft - Current draft state
   * @param data - Pile selection data
   * @returns Updated draft state
   */
  private static choosePile(draft: DraftState, data: { pileId: string }): DraftState {
    if (!draft.activePack || !draft.activePack.piles) {
      throw new Error('No active pack with piles');
    }

    const { pileId } = data;
    const chosenPile = draft.activePack.piles.find(pile => pile.id === pileId);
    const otherPile = draft.activePack.piles.find(pile => pile.id !== pileId);

    if (!chosenPile || !otherPile) {
      throw new Error('Invalid pile selection');
    }

    // Determine which player is choosing and which is splitting
    const isP1Choosing = draft.currentPhase === 'P1-choose';
    const chooser = isP1Choosing ? 'P1' : 'P2';
    const choosingPlayer = isP1Choosing ? 'p1Picks' : 'p2Picks';
    const splittingPlayer = isP1Choosing ? 'p2Picks' : 'p1Picks';

    // Add cards to the choosing player's picks
    const updatedDraft = { ...draft };
    chosenPile.cards.forEach(cardInPool => {
      this.addCardToPlayerPicks(updatedDraft[choosingPlayer], cardInPool);
    });

    // Add remaining cards to the splitting player's picks
    otherPile.cards.forEach(cardInPool => {
      this.addCardToPlayerPicks(updatedDraft[splittingPlayer], cardInPool);
    });

    // Record pile chosen action in history
    const historyEntry = this.createHistoryEntry(
      'pile-chosen',
      draft.currentRound,
      draft.currentPhase,
      {
        chosenPile: pileId,
        chooser,
        chosenCards: [...chosenPile.cards],
        remainingCards: [...otherPile.cards],
      }
    );

    // Determine next phase, pack, and round
    // Odd packs (1, 3, 5...): P1 splits → P2 chooses
    // Even packs (2, 4, 6...): P2 splits → P1 chooses
    let nextPhase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
    let nextPack: number;
    let nextRound: number;

    if (draft.currentPack === 1) {
      // Just finished pack 1, move to pack 2 with P2 splitting
      nextPhase = 'P2-split';
      nextPack = 2;
      nextRound = draft.currentRound;
    } else {
      // Just finished pack 2, move to next round with P1 splitting pack 1
      nextPhase = 'P1-split';
      nextPack = 1;
      nextRound = draft.currentRound + 1;
    }

    // Create updated draft state with pile choice
    const draftAfterChoice = {
      ...updatedDraft,
      currentPhase: nextPhase,
      currentPack: nextPack,
      currentRound: nextRound,
      activePack: null,
      history: [...updatedDraft.history, historyEntry],
    };

    // If the draft is not complete, automatically deal the next pack
    if (!draftAfterChoice.isComplete) {
      return this.startRound(draftAfterChoice);
    }

    return draftAfterChoice;
  }

  /**
   * Adds a card to a player's picks, organizing by color identity
   * @param playerPicks - Player's current picks
   * @param cardInPool - Card to add
   */
  private static addCardToPlayerPicks(playerPicks: Record<string, CardInPool[]>, cardInPool: CardInPool): void {
    const colorIdentity = this.getCardColorIdentity(cardInPool.card);
    
    if (!playerPicks[colorIdentity]) {
      playerPicks[colorIdentity] = [];
    }
    
    playerPicks[colorIdentity].push(cardInPool);
  }

  /**
   * Determines the color identity of a card for sorting purposes
   * @param card - Card to analyze
   * @returns Color identity string for sorting
   */
  private static getCardColorIdentity(card: any): ColorIdentity {
    const { color_identity } = card;
    
    if (color_identity.length === 0) return 'C'; // Colorless
    if (color_identity.length === 1) return color_identity[0]; // Single color
    return 'M'; // Multicolor
  }

  /**
   * Initializes empty player picks organized by color identity
   * @returns Empty player picks structure
   */
  private static initializePlayerPicks(): Record<string, CardInPool[]> {
    return {
      'W': [],
      'U': [],
      'B': [],
      'R': [],
      'G': [],
      'C': [],
      'M': [],
    };
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm
   * @param array - Array to shuffle
   * @returns Shuffled array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

}
