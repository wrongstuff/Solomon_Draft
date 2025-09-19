import React, { useState } from 'react';
import { DraftAction } from '@/types/draft';
import { Card } from './Card';

interface DraftHistoryProps {
  history: DraftAction[];
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * Component for displaying the complete draft history
 * Shows all pack deals, splits, and choices in chronological order
 */
export const DraftHistory: React.FC<DraftHistoryProps> = ({ 
  history, 
  isVisible, 
  onToggle 
}) => {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  /**
   * Toggles the expansion state of a history action
   * @param actionId - ID of the action to toggle
   */
  const toggleExpanded = (actionId: string): void => {
    setExpandedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  /**
   * Gets the display text for an action type
   * @param actionType - Type of action
   * @returns Human-readable action description
   */
  const getActionDescription = (action: DraftAction): string => {
    switch (action.actionType) {
      case 'pack-dealt':
        return `Pack dealt to ${action.phase.includes('P1') ? 'Player 1' : 'Player 2'}`;
      case 'pack-split':
        return `${action.data.splitter} split pack into 2 piles`;
      case 'pile-chosen':
        return `${action.data.chooser} chose pile ${action.data.chosenPile?.replace('pile-', '')}`;
      default:
        return 'Unknown action';
    }
  };

  /**
   * Gets the icon for an action type
   * @param actionType - Type of action
   * @returns Icon character
   */
  const getActionIcon = (actionType: DraftAction['actionType']): string => {
    switch (actionType) {
      case 'pack-dealt':
        return '📦';
      case 'pack-split':
        return '✂️';
      case 'pile-chosen':
        return '✅';
      default:
        return '❓';
    }
  };

  /**
   * Formats a timestamp for display
   * @param timestamp - Date object to format
   * @returns Formatted time string
   */
  const formatTime = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isVisible) {
    return (
      <div className="card">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Draft History</h3>
          <button onClick={onToggle} className="btn btn-secondary">
            Show History ({history.length} actions)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Draft History</h3>
        <button onClick={onToggle} className="btn btn-secondary">
          Hide History
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No actions yet</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((action, index) => {
            const isExpanded = expandedActions.has(action.id);
            
            return (
              <div
                key={action.id}
                className="border rounded-lg p-3 bg-gray-50"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpanded(action.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getActionIcon(action.actionType)}</span>
                    <div>
                      <div className="font-medium">
                        Round {action.round} - {getActionDescription(action)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(action.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {action.actionType === 'pack-dealt' && action.data.packCards && (
                      <div>
                        <h4 className="font-medium mb-2">Pack Contents:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {action.data.packCards.map((cardInPool) => (
                            <Card
                              key={cardInPool.card.id}
                              cardInPool={cardInPool}
                              size="small"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {action.actionType === 'pack-split' && action.data.piles && (
                      <div>
                        <h4 className="font-medium mb-2">Split Result:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {action.data.piles.map((pile, index) => (
                            <div key={pile.id} className="border rounded p-2">
                              <h5 className="font-medium mb-2">
                                Pile {index + 1} ({pile.cards.length} cards)
                              </h5>
                              <div className="grid grid-cols-2 gap-1">
                                {pile.cards.map((cardInPool) => (
                                  <Card
                                    key={cardInPool.card.id}
                                    cardInPool={cardInPool}
                                    size="small"
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {action.actionType === 'pile-chosen' && (
                      <div>
                        <h4 className="font-medium mb-2">Choice Result:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded p-2 bg-green-50">
                            <h5 className="font-medium mb-2 text-green-800">
                              Chosen by {action.data.chooser} ({action.data.chosenCards?.length} cards)
                            </h5>
                            <div className="grid grid-cols-2 gap-1">
                              {action.data.chosenCards?.map((cardInPool) => (
                                <Card
                                  key={cardInPool.card.id}
                                  cardInPool={cardInPool}
                                  size="small"
                                />
                              ))}
                            </div>
                          </div>
                          <div className="border rounded p-2 bg-gray-50">
                            <h5 className="font-medium mb-2 text-gray-600">
                              Remaining ({action.data.remainingCards?.length} cards)
                            </h5>
                            <div className="grid grid-cols-2 gap-1">
                              {action.data.remainingCards?.map((cardInPool) => (
                                <Card
                                  key={cardInPool.card.id}
                                  cardInPool={cardInPool}
                                  size="small"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};



