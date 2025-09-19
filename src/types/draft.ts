import { CardInPool, Pile, Pack, PlayerPicks } from './card';

/**
 * Draft types and interfaces for the Solomon Draft format
 * These define the structure of draft state, actions, and game flow
 */

/**
 * Configuration settings for a draft session.
 * Defines the parameters that control how the draft is conducted.
 */
export interface DraftSettings {
  /** Number of cards per pack */
  packSize: number;
  /** Number of rounds to draft (each round = 2 packs) */
  numberOfRounds: number;
  /** Total number of cards in the draft pool */
  poolSize: number;
  /** Seed string for reproducible draft order */
  seed: string;
}

/**
 * Represents a single action in the draft history.
 * Each action is recorded with full context for replay and analysis.
 */
export interface DraftAction {
  /** Unique identifier for this action */
  id: string;
  /** Round number when this action occurred */
  round: number;
  /** Phase of the draft when this action occurred */
  phase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
  /** Type of action performed */
  actionType: 'pack-dealt' | 'pack-split' | 'pile-chosen';
  /** When this action occurred */
  timestamp: Date;
  /** Action-specific data */
  data: {
    // For pack-dealt actions
    /** Cards in the dealt pack */
    packCards?: CardInPool[];
    // For pack-split actions
    /** Piles created during splitting */
    piles?: Pile[];
    /** Which player did the splitting */
    splitter?: 'P1' | 'P2';
    // For pile-chosen actions
    /** ID of the chosen pile */
    chosenPile?: string;
    /** Which player made the choice */
    chooser?: 'P1' | 'P2';
    /** Cards that were chosen */
    chosenCards?: CardInPool[];
    /** Cards that remained with the splitter */
    remainingCards?: CardInPool[];
  };
}

/**
 * Represents the complete state of an active draft.
 * Contains all information needed to render the draft interface and continue the game.
 */
export interface DraftState {
  /** Configuration settings for this draft */
  settings: DraftSettings;
  /** All cards available in the draft pool */
  cardsInPool: CardInPool[];
  /** Current round number (1-based) */
  currentRound: number;
  /** Current pack within the round (1 or 2) */
  currentPack: number;
  /** Current phase of the draft */
  currentPhase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
  /** Currently active pack being drafted */
  activePack: Pack | null;
  /** Player 1's collected cards organized by color */
  p1Picks: PlayerPicks;
  /** Player 2's collected cards organized by color */
  p2Picks: PlayerPicks;
  /** Whether the draft is complete */
  isComplete: boolean;
  /** Complete history of all actions taken */
  history: DraftAction[];
}

/**
 * Represents the overall game state of the application.
 * Tracks whether a draft is active and any loading/error states.
 */
export interface GameState {
  /** Active draft state (null if no draft is active) */
  draft: DraftState | null;
  /** Whether the app is currently loading */
  isLoading: boolean;
  /** Any error message to display */
  error: string | null;
}

/**
 * Represents a deck list input from various sources.
 * Can be loaded from URLs (Moxfield/CubeCobra) or from seeds.
 */
export interface DeckListInput {
  /** Source URL or seed identifier */
  url: string;
  /** Type of input source */
  type: 'moxfield' | 'cubecobra' | 'seed';
  /** Cards in the deck list */
  cards: CardInPool[];
  /** Optional name of the deck list */
  name?: string;
  /** Optional seed string for reproducible drafts */
  seed?: string;
}
