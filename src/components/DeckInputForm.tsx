import React, { useState, useEffect } from 'react';
import { copyToClipboard, hashCardOrder } from '@/utils/seedUtils';

interface DeckInputFormProps {
  onDeckInput: (url: string) => Promise<void>;
  onLoadSeed: (seed: string) => Promise<void>;
  isLoading: boolean;
  parsedDeckList: { url: string; type: 'moxfield' | 'cubecobra' | 'seed'; cards: any[]; name?: string; seed?: string } | null;
}

/**
 * Form component for inputting deck list URLs
 * Supports Moxfield and CubeCobra URLs
 */
export const DeckInputForm: React.FC<DeckInputFormProps> = ({ onDeckInput, onLoadSeed, isLoading, parsedDeckList }) => {
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generatedSeed, setGeneratedSeed] = useState<string>('');
  const [customSeed, setCustomSeed] = useState<string>('');
  const [isLoadingSeed, setIsLoadingSeed] = useState<boolean>(false);

  // Generate seed when deck list is loaded
  useEffect(() => {
    if (parsedDeckList && parsedDeckList.cards.length > 0) {
      // Create a simple shuffled order for seed generation
      const shuffledCards = [...parsedDeckList.cards].sort(() => Math.random() - 0.5);
      const seed = hashCardOrder(shuffledCards);
      setGeneratedSeed(seed);
    }
  }, [parsedDeckList]);

  /**
   * Handles copying the seed to clipboard
   */
  const handleCopySeed = async (): Promise<void> => {
    try {
      await copyToClipboard(generatedSeed);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy seed:', error);
    }
  };

  /**
   * Handles loading a seed
   */
  const handleLoadSeed = async (): Promise<void> => {
    if (!customSeed.trim()) {
      alert('Please enter a seed');
      return;
    }

    setIsLoadingSeed(true);
    try {
      // Just load the seed data, don't start the draft yet
      await onLoadSeed(customSeed.trim());
    } catch (error) {
      alert(`Failed to load seed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingSeed(false);
    }
  };

  /**
   * Handles form submission and deck list parsing
   * @param event - Form submit event
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Please enter a deck list URL');
      return;
    }

    try {
      await onDeckInput(url.trim());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse deck list';
      
      // Provide more helpful error messages
      if (errorMessage.includes('CubeCobra')) {
        setError(`${errorMessage}\n\nTry using a different cube URL or check if the cube exists.`);
      } else if (errorMessage.includes('Moxfield')) {
        setError(`${errorMessage}\n\nMake sure the deck is public and the URL is correct.`);
      } else {
        setError(errorMessage);
      }
    }
  };

  /**
   * Handles URL input changes
   * @param event - Input change event
   */
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setUrl(event.target.value);
    if (error) setError(null); // Clear error when user starts typing
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Deck List Input</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="deck-url" className="block text-sm font-medium text-gray-700 mb-2">
            Deck List URL - Supports Moxfield and CubeCobra URLs
          </label>
          <div className="flex gap-2">
            <input
              id="deck-url"
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://www.moxfield.com/decks/... or https://cubecobra.com/cube/list/..."
              className="input flex-1"
              disabled={isLoading}
              required
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <pre className="whitespace-pre-wrap font-sans">{error}</pre>
          </div>
        )}

      </form>

      {parsedDeckList && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-medium text-green-900 mb-2">✓ Deck List Loaded Successfully</h3>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Source:</strong> {parsedDeckList.type === 'moxfield' ? 'Moxfield' : 'CubeCobra'}</p>
            <p><strong>Total Cards:</strong> {parsedDeckList.cards.length}</p>
            <p className="text-green-600">Ready to configure draft settings below!</p>
          </div>
          
          {/* Seed Display */}
          {generatedSeed && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Draft Seed:</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this seed to recreate the same draft order
                  </p>
                </div>
                <button 
                  onClick={handleCopySeed}
                  className="btn btn-sm"
                >
                  Copy Seed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seed Input Section */}
      <div className="mt-6">
        <div>
          <label htmlFor="seed-input" className="block text-sm font-medium text-gray-700 mb-2">
            Draft Seed
          </label>
          <div className="flex gap-2">
            <input
              id="seed-input"
              type="text"
              value={customSeed}
              onChange={(e) => setCustomSeed(e.target.value)}
              placeholder="Paste a seed to recreate an existing draft order"
              className="input flex-1"
              disabled={isLoading || isLoadingSeed}
            />
            <button 
              onClick={handleLoadSeed}
              disabled={!customSeed.trim() || isLoading || isLoadingSeed}
              className="btn btn-primary"
            >
              {isLoadingSeed ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
