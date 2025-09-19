import { CardInPool } from '@/types/card';

// Hardcoded key for obfuscation (not security)
const HASH_KEY = "SolomonDraft2024!@#";

/**
 * Creates a compact representation of card order for hashing
 */
interface CardData {
  name: string;
  quantity: number;
}

/**
 * Generates a seed from a randomized card order
 * @param cardOrder - The shuffled card order
 * @returns Obfuscated seed string
 */
export function hashCardOrder(cardOrder: CardInPool[]): string {
  // Create compact representation
  const cardData: CardData[] = cardOrder.map(card => ({
    name: card.card.name,
    quantity: card.quantity
  }));
  
  console.log('Creating seed with card names:', cardData.slice(0, 5).map(c => c.name), '... (total:', cardData.length, ')');
  
  // Simple obfuscation with XOR
  const dataString = JSON.stringify(cardData);
  const obfuscated = xorEncrypt(dataString, HASH_KEY);
  
  // Convert to base64 for sharing - keep full string for reconstruction
  const seed = btoa(obfuscated);
  console.log('Generated seed length:', seed.length);
  return seed;
}

/**
 * Reconstructs card data from a seed
 * @param seed - The obfuscated seed string
 * @returns Array of card data with names and quantities
 */
export function dehashCardOrder(seed: string): CardData[] {
  try {
    console.log('Dehashing seed:', seed);
    
    // Decode from base64
    const obfuscated = atob(seed);
    console.log('Decoded obfuscated data length:', obfuscated.length);
    
    // Deobfuscate
    const dataString = xorDecrypt(obfuscated, HASH_KEY);
    console.log('Deobfuscated data string:', dataString.substring(0, 100) + '...');
    
    // Parse back to card data
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
