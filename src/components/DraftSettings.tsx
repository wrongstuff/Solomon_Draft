import React, { useState } from 'react';

interface DraftSettingsProps {
  onStartDraft: (packSize: number, numberOfRounds: number) => void;
  isLoading: boolean;
  hasDeckList: boolean;
  parsedDeckList: { url: string; type: 'moxfield' | 'cubecobra' | 'seed'; cards: any[]; name?: string; seed?: string } | null;
}

/**
 * Component for configuring draft settings before starting
 * Allows players to set pack size and number of rounds
 */
export const DraftSettings: React.FC<DraftSettingsProps> = ({ onStartDraft, isLoading, hasDeckList, parsedDeckList }) => {
  const [packSize, setPackSize] = useState<number>(6);
  const [numberOfRounds, setNumberOfRounds] = useState<number>(15);

  /**
   * Handles starting a new draft with the current settings
   */
  const handleStartDraft = (): void => {
    if (!hasDeckList) {
      alert('Please load a deck list first');
      return;
    }

    onStartDraft(packSize, numberOfRounds);
  };


  /**
   * Handles pack size input changes
   * @param event - Input change event
   */
  const handlePackSizeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setPackSize(value);
    }
  };

  /**
   * Handles number of rounds input changes
   * @param event - Input change event
   */
  const handleRoundsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setNumberOfRounds(value);
    }
  };

  const totalCardsNeeded = 2 * packSize * numberOfRounds;
  const availableCards = parsedDeckList?.cards.length || 0;
  const hasEnoughCards = availableCards >= totalCardsNeeded;
  const validationMessage = hasEnoughCards 
    ? `✓ Sufficient cards available (${availableCards} >= ${totalCardsNeeded})`
    : `⚠️ Not enough cards! Need ${totalCardsNeeded} but only have ${availableCards}`;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Draft Settings</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pack-size" className="block text-sm font-medium text-gray-700 mb-2">
              Pack Size
            </label>
            <input
              id="pack-size"
              type="number"
              min="1"
              max="20"
              value={packSize}
              onChange={handlePackSizeChange}
              className="input"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="rounds" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rounds
            </label>
            <input
              id="rounds"
              type="number"
              min="1"
              max="50"
              value={numberOfRounds}
              onChange={handleRoundsChange}
              className="input"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={`border rounded p-4 ${hasEnoughCards ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`font-medium mb-2 ${hasEnoughCards ? 'text-green-900' : 'text-red-900'}`}>
            {hasDeckList ? '✓ Deck List Loaded Successfully' : 'Draft Configuration'}
          </h3>
          <div className={`text-sm space-y-1 ${hasEnoughCards ? 'text-green-800' : 'text-red-800'}`}>
            {hasDeckList && (
              <>
                <p>• Source: <strong>{parsedDeckList?.type === 'moxfield' ? 'Moxfield' : parsedDeckList?.type === 'cubecobra' ? 'CubeCobra' : 'Seed'}</strong></p>
                <p>• Total Cards: <strong>{parsedDeckList?.cards.length || 0}</strong></p>
              </>
            )}
            <p>• Pack size: <strong>{packSize}</strong> cards</p>
            <p>• Total rounds: <strong>{numberOfRounds}</strong></p>
            <p>• Total cards needed: <strong>{totalCardsNeeded}</strong></p>
            <p className="font-medium">{validationMessage}</p>
            {hasEnoughCards && hasDeckList && (
              <p className="text-green-600 font-medium">Ready to start your draft!</p>
            )}
            {!hasEnoughCards && hasDeckList && (
              <p className="text-red-600 font-medium">Please load a larger deck list or reduce settings.</p>
            )}
            {!hasDeckList && (
              <p className="text-gray-600 font-medium">Load a deck list to begin drafting.</p>
            )}
          </div>
        </div>


        <button
          onClick={handleStartDraft}
          className={`btn w-full ${hasEnoughCards ? 'btn-success' : 'btn-disabled'}`}
          disabled={isLoading || !hasDeckList || !hasEnoughCards}
        >
          {isLoading ? 'Starting Draft...' : hasEnoughCards ? 'Start New Draft' : 'Not Enough Cards'}
        </button>
      </div>
    </div>
  );
};
