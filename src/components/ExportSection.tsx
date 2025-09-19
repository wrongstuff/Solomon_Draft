import React from 'react';
import { PlayerPicks } from '@/types/card';

interface ExportSectionProps {
  p1Picks: PlayerPicks;
  p2Picks: PlayerPicks;
}

/**
 * Component for exporting final deck lists in standard MTG format
 * Allows downloading both players' final deck lists as text files
 */
export const ExportSection: React.FC<ExportSectionProps> = ({ p1Picks, p2Picks }) => {
  /**
   * Converts player picks to standard MTG deck list format
   * @param picks - Player's drafted cards organized by color
   * @returns Formatted deck list string
   */
  const formatDeckList = (picks: PlayerPicks): string => {
    const allCards: Array<{ name: string; quantity: number }> = [];
    
    // Flatten all cards from all colors
    Object.values(picks).forEach(cards => {
      cards.forEach(cardInPool => {
        const existingCard = allCards.find(c => c.name === cardInPool.card.name);
        if (existingCard) {
          existingCard.quantity += cardInPool.quantity;
        } else {
          allCards.push({
            name: cardInPool.card.name,
            quantity: cardInPool.quantity,
          });
        }
      });
    });

    // Sort by name for consistent output
    allCards.sort((a, b) => a.name.localeCompare(b.name));

    // Format as standard MTG deck list
    return allCards
      .map(card => `${card.quantity} ${card.name}`)
      .join('\n');
  };

  /**
   * Downloads a text file with the given content and filename
   * @param content - File content
   * @param filename - Name of the file to download
   */
  const downloadFile = (content: string, filename: string): void => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Handles downloading P1's deck list
   */
  const handleDownloadP1 = (): void => {
    const deckList = formatDeckList(p1Picks);
    downloadFile(deckList, 'player1-decklist.txt');
  };

  /**
   * Handles downloading P2's deck list
   */
  const handleDownloadP2 = (): void => {
    const deckList = formatDeckList(p2Picks);
    downloadFile(deckList, 'player2-decklist.txt');
  };

  /**
   * Handles downloading both deck lists as a combined file
   */
  const handleDownloadBoth = (): void => {
    const p1List = formatDeckList(p1Picks);
    const p2List = formatDeckList(p2Picks);
    const combined = `Player 1 Deck List:\n${p1List}\n\nPlayer 2 Deck List:\n${p2List}`;
    downloadFile(combined, 'draft-results.txt');
  };

  /**
   * Gets the total card count for a player
   * @param picks - Player's picks
   * @returns Total number of cards
   */
  const getTotalCardCount = (picks: PlayerPicks): number => {
    return Object.values(picks).reduce((total, cards) => total + cards.length, 0);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Export Deck Lists</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Player 1 Export */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Player 1</h3>
          <p className="text-sm text-gray-600 mb-3">
            {getTotalCardCount(p1Picks)} cards total
          </p>
          <button
            onClick={handleDownloadP1}
            className="btn btn-primary w-full"
          >
            Download P1 Deck List
          </button>
        </div>

        {/* Player 2 Export */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Player 2</h3>
          <p className="text-sm text-gray-600 mb-3">
            {getTotalCardCount(p2Picks)} cards total
          </p>
          <button
            onClick={handleDownloadP2}
            className="btn btn-primary w-full"
          >
            Download P2 Deck List
          </button>
        </div>
      </div>

      {/* Combined Export */}
      <div className="text-center">
        <button
          onClick={handleDownloadBoth}
          className="btn btn-success px-8 py-3"
        >
          Download Both Deck Lists
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Downloads a single file with both players' deck lists
        </p>
      </div>

      {/* Preview Section */}
      <div className="mt-8">
        <h3 className="font-semibold mb-4">Deck List Preview</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Player 1</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {formatDeckList(p1Picks)}
            </pre>
          </div>
          <div>
            <h4 className="font-medium mb-2">Player 2</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {formatDeckList(p2Picks)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};


