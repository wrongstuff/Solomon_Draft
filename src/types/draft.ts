import { CardInPool, Pile, Pack, PlayerPicks } from './card';

export interface DraftSettings {
  packSize: number;
  numberOfRounds: number;
  poolSize: number;
  seed: string;
}

/**
 * Represents a single action in the draft history
 */
export interface DraftAction {
  id: string;
  round: number;
  phase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
  actionType: 'pack-dealt' | 'pack-split' | 'pile-chosen';
  timestamp: Date;
  data: {
    // For pack-dealt actions
    packCards?: CardInPool[];
    // For pack-split actions
    piles?: Pile[];
    splitter?: 'P1' | 'P2';
    // For pile-chosen actions
    chosenPile?: string;
    chooser?: 'P1' | 'P2';
    chosenCards?: CardInPool[];
    remainingCards?: CardInPool[];
  };
}

export interface DraftState {
  settings: DraftSettings;
  cardsInPool: CardInPool[];
  currentRound: number;
  currentPhase: 'P1-split' | 'P1-choose' | 'P2-split' | 'P2-choose';
  activePack: Pack | null;
  p1Picks: PlayerPicks;
  p2Picks: PlayerPicks;
  isComplete: boolean;
  history: DraftAction[];
}

export interface GameState {
  draft: DraftState | null;
  isLoading: boolean;
  error: string | null;
}

export interface DeckListInput {
  url: string;
  type: 'moxfield' | 'cubecobra';
  cards: CardInPool[];
}
