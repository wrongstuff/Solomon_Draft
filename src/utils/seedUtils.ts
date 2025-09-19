import { CardInPool } from '@/types/card';

/**
 * Seed utilities for creating and reconstructing draft seeds.
 * 
 * Seeds allow users to recreate the exact same draft order by sharing
 * a compact string that encodes the card order and quantities.
 * 
 * This is useful for:
 * - Sharing interesting draft scenarios
 * - Replaying drafts for analysis
 * - Testing different pack sizes with the same card order
 */

// Hardcoded key for obfuscation (not security)
const HASH_KEY = "SolomonDraft2024!@#";

/**
 * Creates a compact representation of card order for hashing.
 * This interface stores only the essential data needed to reconstruct
 * a draft: card names and quantities.
 */
interface CardData {
  /** Name of the card */
  name: string;
  /** Number of copies in the pool */
  quantity: number;
}

/**
 * Generates a seed from a randomized card order.
 * 
 * This function creates a compact, shareable string that encodes the exact
 * order and quantities of cards in a draft pool. The seed can be used to
 * recreate the same draft with different pack sizes or settings.
 * 
 * @param cardOrder - The shuffled card order from the draft pool
 * @returns Base64-encoded seed string that can be shared
 */
export function hashCardOrder(cardOrder: CardInPool[]): string {
  // Create compact representation with only essential data
  const cardData: CardData[] = cardOrder.map(card => ({
    name: card.card.name,
    quantity: card.quantity
  }));
  
  console.log('Creating seed with card names:', cardData.slice(0, 5).map(c => c.name), '... (total:', cardData.length, ')');
  
  // Simple obfuscation with XOR to make the seed less readable
  const dataString = JSON.stringify(cardData);
  const obfuscated = xorEncrypt(dataString, HASH_KEY);
  
  // Convert to base64 for safe sharing and URL compatibility
  const seed = btoa(obfuscated);
  console.log('Generated seed length:', seed.length);
  return seed;
}

/**
 * Reconstructs card data from a seed.
 * 
 * This function reverses the hashing process to extract the original
 * card order and quantities from a shared seed string.
 * 
 * @param seed - The base64-encoded seed string to decode
 * @returns Array of card data with names and quantities
 * @throws Error if the seed format is invalid or corrupted
 */
export function dehashCardOrder(seed: string): CardData[] {
  try {
    console.log('Dehashing seed:', seed);
    
    // Decode from base64 to get the obfuscated data
    const obfuscated = atob(seed);
    console.log('Decoded obfuscated data length:', obfuscated.length);
    
    // Deobfuscate with XOR using the same key
    const dataString = xorDecrypt(obfuscated, HASH_KEY);
    console.log('Deobfuscated data string:', dataString.substring(0, 100) + '...');
    
    // Parse the JSON back to card data array
    const result = JSON.parse(dataString);
    console.log('Parsed card data count:', result.length);
    console.log('First few card names:', result.slice(0, 3).map((c: any) => c.name));
    return result;
  } catch (error) {
    console.error('Seed dehash error:', error);
    throw new Error(`Invalid seed format: ${error}`);
  }
}

/**
 * Simple XOR encryption for obfuscation
 * @param text - Text to encrypt
 * @param key - Encryption key
 * @returns Encrypted string
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Simple XOR decryption (XOR is symmetric)
 * @param encrypted - Encrypted text
 * @param key - Decryption key
 * @returns Decrypted string
 */
function xorDecrypt(encrypted: string, key: string): string {
  return xorEncrypt(encrypted, key); // XOR is symmetric
}

/**
 * Copies text to clipboard
 * @param text - Text to copy
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}
