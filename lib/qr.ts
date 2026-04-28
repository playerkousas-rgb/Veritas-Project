// QR Handshake Service
import * as Clipboard from 'expo-clipboard';
import { getIdentity, resolveUIN } from './identity';
import { saveTrustedPeer } from './storage';
import type { TrustedPeer } from './types';

export interface QRData {
  uin: string;
  token: string;
  timestamp: number;
}

export async function generateQRData(): Promise<QRData> {
  const identity = await getIdentity();
  if (!identity) throw new Error('No identity found');
  
  return {
    uin: identity.uin,
    token: generateToken(),
    timestamp: Date.now(),
  };
}

export function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export function encodeQRData(data: QRData): string {
  return JSON.stringify(data);
}

export function decodeQRData(data: string): QRData | null {
  try {
    const parsed = JSON.parse(data);
    
    // Validate structure
    if (!parsed.uin || !parsed.token || !parsed.timestamp) {
      return null;
    }
    
    // Check if token is expired (5 minutes)
    if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

export async function processQRHandshake(qrData: QRData): Promise<TrustedPeer> {
  // Resolve UIN to get public key
  const resolved = await resolveUIN(qrData.uin);
  if (!resolved) {
    throw new Error('Could not resolve UIN');
  }
  
  const peer: TrustedPeer = {
    uin: qrData.uin,
    publicKey: resolved.publicKey,
    connectedAt: Date.now(),
  };
  
  // Save as trusted peer
  await saveTrustedPeer(peer);
  
  return peer;
}

export async function copyQRToClipboard(data: QRData): Promise<void> {
  const encoded = encodeQRData(data);
  await Clipboard.setStringAsync(encoded);
}
