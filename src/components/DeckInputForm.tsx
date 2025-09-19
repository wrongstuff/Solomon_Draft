import React, { useState } from 'react';

interface DeckInputFormProps {
  onDeckInput: (url: string) => Promise<void>;
  isLoading: boolean;
  parsedDeckList: { url: string; type: 'moxfield' | 'cubecobra'; cards: any[]; name?: string } | null;
}

/**
 * Form component for inputting deck list URLs
 * Supports Moxfield and CubeCobra URLs
 */
export const DeckInputForm: React.FC<DeckInputFormProps> = ({ onDeckInput, isLoading, parsedDeckList }) => {
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
            Deck List URL
          </label>
          <input
            id="deck-url"
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://www.moxfield.com/decks/... or https://cubecobra.com/cube/list/..."
            className="input"
            disabled={isLoading}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Supports Moxfield deck URLs and CubeCobra cube URLs
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <pre className="whitespace-pre-wrap font-sans">{error}</pre>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? 'Loading...' : 'Load Deck List'}
        </button>
      </form>

      {parsedDeckList && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-medium text-green-900 mb-2">✓ Deck List Loaded Successfully</h3>
          <div className="text-sm text-green-800 space-y-1">
            <p><strong>Source:</strong> {parsedDeckList.type === 'moxfield' ? 'Moxfield' : 'CubeCobra'}</p>
            <p><strong>Total Cards:</strong> {parsedDeckList.cards.length}</p>
            <p className="text-green-600">Ready to configure draft settings below!</p>
          </div>
        </div>
      )}
    </div>
  );
};
