import React from 'react';
import { Card as CardType, CardInPool } from '@/types/card';
import { CardSize, getCardDimensions } from '@/constants/cardDimensions';

interface CardProps {
  cardInPool: CardInPool;
  size?: CardSize;
  onClick?: () => void;
  isSelected?: boolean;
  isDraggable?: boolean;
}

/**
 * Component for displaying individual Magic: The Gathering cards
 * Shows card image, name, mana cost, and other relevant information
 */
export const Card: React.FC<CardProps> = ({ 
  cardInPool, 
  size = 'medium', 
  onClick, 
  isSelected = false,
  isDraggable = false 
}) => {
  const { card, quantity } = cardInPool;
  
  const dimensions = getCardDimensions(size);
  const sizeClasses = `${dimensions.tailwindWidth} ${dimensions.tailwindHeight}`;

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  /**
   * Handles card click events
   */
  const handleClick = (): void => {
    if (onClick) {
      onClick();
    }
  };

  /**
   * Handles drag start events for draggable cards
   * @param event - Drag event
   */
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>): void => {
    if (isDraggable) {
      event.dataTransfer.setData('text/plain', JSON.stringify(cardInPool));
    }
  };

  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-200 hover:scale-105
        ${sizeClasses[size]}
        ${onClick ? 'hover:shadow-lg' : ''}
      `}
      onClick={handleClick}
      draggable={isDraggable}
      onDragStart={handleDragStart}
    >
      {/* Card Image */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-200">
        <img
          src={card.image_uris?.normal || card.image_uris?.small || '/placeholder-card.png'}
          alt={card.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-card.png';
          }}
        />
        
        {/* Quantity Badge */}
        {quantity > 1 && (
          <div className="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {quantity}
          </div>
        )}
      </div>

      {/* Card Info Overlay - Removed to show clean card images */}
    </div>
  );
};

/**
 * Component for displaying a placeholder card when loading or when card data is unavailable
 */
export const CardPlaceholder: React.FC<{ size?: CardSize }> = ({ 
  size = 'medium' 
}) => {
  const dimensions = getCardDimensions(size);
  const sizeClasses = `${dimensions.tailwindWidth} ${dimensions.tailwindHeight}`;

  return (
    <div className={`
      ${sizeClasses} 
      bg-gray-300 rounded-lg flex items-center justify-center
      animate-pulse
    `}>
      <div className="text-gray-500 text-xs">Loading...</div>
    </div>
  );
};


