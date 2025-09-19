import React, { useState } from 'react';

interface DraftSettingsProps {
  onStartDraft: (packSize: number, numberOfRounds: number) => void;
  isLoading: boolean;
  hasDeckList: boolean;
}

/**
 * Component for configuring draft settings before starting
 * Allows players to set pack size and number of rounds
 */
export const DraftSettings: React.FC<DraftSettingsProps> = ({ onStartDraft, isLoading, hasDeckList }) => {
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
            <p className="text-sm text-gray-500 mt-1">
              Number of cards per pack
            </p>
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
            <p className="text-sm text-gray-500 mt-1">
              Number of rounds to draft
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-medium text-blue-900 mb-2">Draft Configuration</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Total cards needed: <strong>{totalCardsNeeded}</strong></p>
            <p>• Cards per round: <strong>{2 * packSize}</strong> (2 packs per round)</p>
            <p>• Total rounds: <strong>{numberOfRounds}</strong></p>
          </div>
        </div>

        <button
          onClick={handleStartDraft}
          className="btn btn-success w-full"
          disabled={isLoading || !hasDeckList}
        >
          {isLoading ? 'Starting Draft...' : 'Start Draft'}
        </button>
      </div>
    </div>
  );
};
