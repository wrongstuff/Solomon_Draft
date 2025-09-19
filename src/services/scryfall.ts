import { Card, CardInPool } from '@/types/card';

/**
 * Service for interacting with the Scryfall API with built-in rate limiting
 * to respect their guidelines of max 10 requests per second
 */
class ScryfallService {
  private readonly baseUrl = 'https://api.scryfall.com';
  private readonly requestQueue: Array<() => Promise<unknown>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // 100ms between requests (10 requests per second max)

  /**
   * Processes the request queue with rate limiting to respect Scryfall's API guidelines
   * Ensures we don't exceed 10 requests per second by spacing requests appropriately
   */
  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Wait if we're making requests too quickly to respect rate limits
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
      }
      
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
          this.lastRequestTime = Date.now();
        } catch (error) {
          console.error('Scryfall API request failed:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Makes a rate-limited request to the Scryfall API
   * @param endpoint - The API endpoint to call
   * @param options - Optional fetch options
   * @returns Promise resolving to the API response data
   */
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push(async (): Promise<void> => {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, options);
          
          if (response.status === 429) {
            // Rate limited - respect the Retry-After header and retry
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
            await new Promise<void>(resolve => setTimeout(resolve, waitTime));
            const retryResult = await this.makeRequest<T>(endpoint);
            resolve(retryResult);
            return;
          }
          
          if (!response.ok) {
            throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json() as T;
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Searches for a single card by name using Scryfall's search API
   * @param cardName - The exact name of the card to search for
   * @returns Promise resolving to the Card object
   * @throws Error if card is not found
   */
  async searchCard(cardName: string): Promise<Card> {
    const encodedName = encodeURIComponent(cardName);
    const data = await this.makeRequest<{ data: Card[] }>(`/cards/search?q=!"${encodedName}"`);
    
    if (data.data.length === 0) {
      throw new Error(`Card not found: ${cardName}`);
    }
    
    return data.data[0];
  }

  /**
   * Retrieves a card by its Scryfall ID
   * @param id - The Scryfall card ID
   * @returns Promise resolving to the Card object
   */
  async getCardById(id: string): Promise<Card> {
    return this.makeRequest<Card>(`/cards/${id}`);
  }

  /**
   * Searches for multiple cards by name using Scryfall's collection endpoint (more efficient)
   * @param cardNames - Array of card names to search for
   * @returns Promise resolving to array of found Card objects (excludes failed searches)
   */
  async searchCards(cardNames: string[]): Promise<Card[]> {
    if (cardNames.length === 0) return [];
    
    // Preprocess card names to handle split cards
    const processedCardNames = this.preprocessCardNames(cardNames);
    
    // Use collection endpoint for bulk searches (up to 75 cards per request)
    const batchSize = 75; // Scryfall's collection endpoint limit
    const cards: Card[] = [];
    
    for (let i = 0; i < processedCardNames.length; i += batchSize) {
      const batch = processedCardNames.slice(i, i + batchSize);
      try {
        const batchCards = await this.searchCardsBatch(batch);
        cards.push(...batchCards);
      } catch (error) {
        console.warn(`Batch search failed, falling back to individual searches:`, error);
        // Fallback to individual searches for this batch
        const individualCards = await this.searchCardsIndividually(batch);
        cards.push(...individualCards);
      }
    }
    
    return cards;
  }

  /**
   * Preprocesses card names to handle split cards and other special cases
   * @param cardNames - Array of card names to preprocess
   * @returns Array of processed card names
   */
  private preprocessCardNames(cardNames: string[]): string[] {
    const processedNames: string[] = [];
    
    for (const name of cardNames) {
      // Handle split cards like "Find // Finality" by trying both halves
      if (name.includes(' // ')) {
        const halves = name.split(' // ');
        if (halves.length === 2) {
          // Try both halves, Scryfall will return the full split card
          processedNames.push(halves[0].trim());
          processedNames.push(halves[1].trim());
        } else {
          processedNames.push(name);
        }
      } else {
        processedNames.push(name);
      }
    }
    
    return processedNames;
  }

  /**
   * Searches for a batch of cards using Scryfall's collection endpoint
   * @param cardNames - Array of card names (max 75)
   * @returns Promise resolving to array of found Card objects
   */
  private async searchCardsBatch(cardNames: string[]): Promise<Card[]> {
    const identifiers = cardNames.map(name => ({ name }));
    
    const requestBody = {
      identifiers: identifiers
    };
    
    // Use the rate-limited request system for collection endpoint
    return new Promise<Card[]>((resolve, reject) => {
      this.requestQueue.push(async (): Promise<void> => {
        try {
          const response = await fetch(`${this.baseUrl}/cards/collection`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          
          if (response.status === 429) {
            // Rate limited - respect the Retry-After header and retry
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
            await new Promise<void>(resolve => setTimeout(resolve, waitTime));
            const retryResult = await this.searchCardsBatch(cardNames);
            resolve(retryResult);
            return;
          }
          
          if (!response.ok) {
            throw new Error(`Collection search failed: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json() as { data: Card[]; not_found: Array<{ name: string }> };
          
          if (data.not_found && data.not_found.length > 0) {
            console.warn(`Cards not found in batch:`, data.not_found.map(nf => nf.name));
          }
          
          resolve(data.data || []);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Fallback method: searches for multiple cards individually (original implementation)
   * @param cardNames - Array of card names to search for
   * @returns Promise resolving to array of found Card objects (excludes failed searches)
   */
  private async searchCardsIndividually(cardNames: string[]): Promise<Card[]> {
    const cards: Card[] = [];
    const batchSize = 10; // Process in smaller batches to avoid overwhelming the API
    
    for (let i = 0; i < cardNames.length; i += batchSize) {
      const batch = cardNames.slice(i, i + batchSize);
      const batchPromises = batch.map(name => 
        this.searchCard(name).catch(error => {
          console.warn(`Failed to fetch card: ${name}`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      cards.push(...batchResults.filter((card): card is Card => card !== null));
    }
    
    return cards;
  }

  /**
   * Fetches multiple cards by their Scryfall IDs
   * @param cardIds - Array of Scryfall card IDs
   * @returns Promise resolving to array of Card objects
   */
  async fetchCardsByIds(cardIds: string[]): Promise<Card[]> {
    if (cardIds.length === 0) return [];

    console.log('Fetching cards by IDs:', cardIds.slice(0, 5), '... (total:', cardIds.length, ')');

    // Use Scryfall's collection endpoint for bulk fetching
    const data = await this.makeRequest<{ data: Card[], not_found: any[] }>('/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifiers: cardIds.map(id => ({ id }))
      })
    });
    console.log('Scryfall response:', {
      found: data.data?.length || 0,
      not_found: data.not_found?.length || 0,
      total_requested: cardIds.length
    });

    if (data.not_found && data.not_found.length > 0) {
      console.warn('Cards not found:', data.not_found);
    }

    return data.data || [];
  }

  /**
   * Converts a deck list string (format: "4 Lightning Bolt") into CardInPool objects
   * @param deckList - The deck list string with quantity and card name on each line
   * @returns Promise resolving to array of CardInPool objects
   */
  async convertDeckListToCards(deckList: string): Promise<CardInPool[]> {
    const lines = deckList.split('\n').filter(line => line.trim());
    const cardEntries: Array<{ name: string; quantity: number }> = [];
    
    // Parse each line to extract quantity and card name
    for (const line of lines) {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1]);
        const name = match[2].trim();
        cardEntries.push({ name, quantity });
      }
    }
    
    const cardNames = cardEntries.map(entry => entry.name);
    const cards = await this.searchCards(cardNames);
    
    // Create a map for quick lookup when matching cards to quantities
    const cardMap = new Map(cards.map(card => [card.name, card]));
    
    const result = cardEntries
      .map(entry => {
        // Try exact match first
        let card = cardMap.get(entry.name);
        
        // If not found, try case-insensitive match
        if (!card) {
          for (const [cardName, cardData] of cardMap.entries()) {
            if (cardName.toLowerCase() === entry.name.toLowerCase()) {
              card = cardData;
              break;
            }
          }
        }
        
        // If still not found, try partial match (for cards with different punctuation)
        if (!card) {
          const normalizedEntryName = entry.name.toLowerCase().replace(/[^\w\s]/g, '');
          for (const [cardName, cardData] of cardMap.entries()) {
            const normalizedCardName = cardName.toLowerCase().replace(/[^\w\s]/g, '');
            if (normalizedCardName === normalizedEntryName) {
              card = cardData;
              console.log(`Found card with partial match: "${entry.name}" -> "${cardName}"`);
              break;
            }
          }
        }
        
        // If still not found, try split card matching (for cards like "Kellan, Inquisitive Prodigy" -> "Kellan, Inquisitive Prodigy // Tail the Suspect")
        if (!card) {
          for (const [cardName, cardData] of cardMap.entries()) {
            // Check if the card name starts with our entry name (for split cards)
            if (cardName.toLowerCase().startsWith(entry.name.toLowerCase())) {
              card = cardData;
              console.log(`Found card with split card match: "${entry.name}" -> "${cardName}"`);
              break;
            }
          }
        }
        
        if (!card) {
          console.warn(`Card not found in Scryfall: "${entry.name}"`);
          return null;
        }
        return { card, quantity: entry.quantity };
      })
      .filter((entry): entry is CardInPool => entry !== null);
    
    // Log summary of missing cards
    const missingCount = cardEntries.length - result.length;
    if (missingCount > 0) {
      console.warn(`Warning: ${missingCount} cards were not found in Scryfall and were excluded from the deck list`);
      console.warn(`Total cards requested: ${cardEntries.length}, Cards found: ${result.length}`);
    }
    
    return result;
  }
}

export const scryfallService = new ScryfallService();
