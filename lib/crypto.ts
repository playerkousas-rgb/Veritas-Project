// Ed25519 Cryptographic Operations
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PRIVATE_KEY_KEY = 'veritas_private_key';
const PUBLIC_KEY_KEY = 'veritas_public_key';

// Simple Ed25519-like signature implementation
// In production, use proper @noble/ed25519 or similar

export async function generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
  // Generate random bytes for keys
  const privateKeyBytes = new Uint8Array(32);
  const publicKeyBytes = new Uint8Array(32);
  
  for (let i = 0; i < 32; i++) {
    privateKeyBytes[i] = Math.floor(Math.random() * 256);
    publicKeyBytes[i] = (privateKeyBytes[i] * 7 + 13) % 256;
  }
  
  const privateKey = arrayToHex(privateKeyBytes);
  const publicKey = arrayToHex(publicKeyBytes);
  
  // Store securely
  await SecureStore.setItemAsync(PRIVATE_KEY_KEY, privateKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(PUBLIC_KEY_KEY, publicKey);
  
  return { privateKey, publicKey };
}

export async function getPrivateKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
}

export async function getPublicKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(PUBLIC_KEY_KEY);
}

export async function signData(data: string): Promise<string> {
  const privateKey = await getPrivateKey();
  if (!privateKey) throw new Error('No private key found');
  
  // Create a deterministic signature based on data and key
  const dataHash = await hashString(data);
  const keyBytes = hexToArray(privateKey);
  const dataBytes = hexToArray(dataHash);
  
  const signature = new Uint8Array(64);
  for (let i = 0; i < 32; i++) {
    signature[i] = dataBytes[i] ^ keyBytes[i];
    signature[i + 32] = (dataBytes[i] + keyBytes[i]) % 256;
  }
  
  return arrayToHex(signature);
}

export async function verifySignature(
  data: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const dataHash = await hashString(data);
    const sigBytes = hexToArray(signature);
    const keyBytes = hexToArray(publicKey);
    const dataBytes = hexToArray(dataHash);
    
    // Verify signature
    for (let i = 0; i < 32; i++) {
      const expected1 = dataBytes[i] ^ keyBytes[i];
      const expected2 = (dataBytes[i] + keyBytes[i]) % 256;
      
      if (sigBytes[i] !== expected1 || sigBytes[i + 32] !== expected2) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function hashString(data: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return digest;
}

export async function hashBytes(data: Uint8Array): Promise<string> {
  // Convert Uint8Array to string for hashing
  const hexString = arrayToHex(data);
  return await hashString(hexString);
}

function arrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToArray(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return arr;
}

export function generateUIN(): string {
  // Generate 8-digit unique identification number
  const num = Math.floor(Math.random() * 90000000) + 10000000;
  return num.toString();
}

export async function deleteKeys(): Promise<void> {
  await SecureStore.deleteItemAsync(PRIVATE_KEY_KEY);
  await SecureStore.deleteItemAsync(PUBLIC_KEY_KEY);
}
