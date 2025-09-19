import { DeckListInput } from '@/types/draft';
import { scryfallService } from './scryfall';

/**
 * Parser for extracting deck lists from various online sources
 * Currently supports Moxfield and CubeCobra with extensible design for future sources
 */
export class DeckListParser {
  /**
   * Parses a Moxfield deck URL and extracts the deck list
   * @param url - The Moxfield deck URL (e.g., https://www.moxfield.com/decks/abc123)
   * @returns Promise resolving to DeckListInput with parsed cards
   * @throws Error if URL format is invalid or deck cannot be fetched
   */
  static async parseMoxfieldUrl(url: string): Promise<DeckListInput> {
    // Extract deck ID from Moxfield URL using regex pattern
    const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid Moxfield URL format');
    }
    
    const deckId = match[1];
    const apiUrl = `https://api.moxfield.com/v2/decks/${deckId}`;
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch deck: ${response.status}`);
      }
      
      const data = await response.json();
      const mainboard = data.mainboard || {};
      
      // Convert Moxfield's object format to standard deck list format
      const deckList = Object.entries(mainboard)
        .map(([cardName, quantity]) => `${quantity} ${cardName}`)
        .join('\n');
      
      const cards = await scryfallService.convertDeckListToCards(deckList);
      
      return {
        url,
        type: 'moxfield',
        cards
      };
    } catch (error) {
      throw new Error(`Failed to parse Moxfield deck: ${error}`);
    }
  }

  static async parseCubeCobraUrl(url: string): Promise<DeckListInput> {
    // Extract cube ID from CubeCobra URL - handle both /list/ and /overview/ formats
    const listMatch = url.match(/cubecobra\.com\/cube\/list\/([a-zA-Z0-9-]+)/);
    const overviewMatch = url.match(/cubecobra\.com\/cube\/overview\/([a-zA-Z0-9-]+)/);
    
    const cubeId = listMatch?.[1] || overviewMatch?.[1];
    if (!cubeId) {
      throw new Error('Invalid CubeCobra URL format. Expected format: https://cubecobra.com/cube/list/[cube-id] or https://cubecobra.com/cube/overview/[cube-id]');
    }
    
    // Use the reliable /cubelist/ endpoint through proxy
    const apiUrl = `/api/cubecobra/cube/api/cubelist/${cubeId}`;
    
    try {
      console.log(`Attempting to fetch: ${apiUrl}`);
      const response = await fetch(apiUrl);
      
      console.log(`Response received: ${response.status} ${response.statusText} from ${apiUrl}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cube: ${response.status} ${response.statusText}`);
      }
      
      // Parse plain text response from /cubelist/ endpoint
      const textData = await response.text();
      console.log(`Successfully parsed text from ${apiUrl}, length:`, textData.length);
      
      // Convert plain text to our expected format
      const cardNames = textData.split('\n').filter(name => name.trim());
      const cards = cardNames.map(name => ({ details: { name: name.trim() } }));
      console.log(`Converted ${cards.length} card names from text format`);
      
      if (cards.length === 0) {
        throw new Error('No cards found in cube');
      }
      
      // Convert CubeCobra format to our format
      const deckList = cards
        .map((card: any) => {
          // CubeCobra cards have details.name for the card name
          const cardName = card.details?.name || card.name || card.Name || card;
          return `1 ${cardName}`;
        })
        .join('\n');
      
      console.log(`Successfully parsed cube from ${apiUrl}, converting ${cards.length} cards with Scryfall`);
      const parsedCards = await scryfallService.convertDeckListToCards(deckList);
      console.log(`Successfully converted ${parsedCards.length} cards with Scryfall`);
      
      return {
        url,
        type: 'cubecobra',
        cards: parsedCards
      };
    } catch (error) {
      const errorMessage = `Failed to parse CubeCobra cube: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check if the cube URL is correct and the cube exists.`;
      throw new Error(errorMessage);
    }
  }

  static async parseDeckListUrl(url: string): Promise<DeckListInput> {
    if (url.includes('moxfield.com')) {
      return this.parseMoxfieldUrl(url);
    } else if (url.includes('cubecobra.com')) {
      return this.parseCubeCobraUrl(url);
    } else {
      throw new Error('Unsupported deck list URL. Please use Moxfield or CubeCobra.');
    }
  }

  // Future enhancement: Parse raw deck list text
  static async parseRawDeckList(deckListText: string): Promise<DeckListInput> {
    const cards = await scryfallService.convertDeckListToCards(deckListText);
    
    return {
      url: 'raw-text',
      type: 'moxfield', // Default type for raw text
      cards
    };
  }
}
