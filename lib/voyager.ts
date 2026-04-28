// Voyager Sync Protocol - For Distant Friends
import * as SecureStore from 'expo-secure-store';
import { getIdentity } from './identity';
import { getPublicKey } from './crypto';

const SYNC_SEEDS_KEY = 'veritas_sync_seeds';
const SYNC_SESSIONS_KEY = 'veritas_sync_sessions';

export interface SyncSeed {
  id: string;
  seedCode: string; // 6-digit code
  creatorUIN: string;
  creatorPublicKey: string;
  targetUIN: string;
  createdAt: number;
  expiresAt: number; // 24 hours
  isActivated: boolean;
}

export interface SyncSession {
  id: string;
  initiatorUIN: string;
  receiverUIN: string;
  initiatorPublicKey: string;
  receiverPublicKey: string;
  syncedAt: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export interface SyncState {
  isSyncing: boolean;
  partnerUIN: string | null;
  progress: number; // 0-100
  timeRemaining: number; // seconds
  phase: 'idle' | 'waiting' | 'longpress' | 'verifying' | 'completed' | 'failed';
}

// Generate a sync seed for remote friend
export async function createSyncSeed(targetUIN: string): Promise<SyncSeed> {
  const identity = await getIdentity();
  const publicKey = await getPublicKey();
  if (!identity || !publicKey) throw new Error('No identity');
  
  const seedCode = generateSyncCode();
  
  const seed: SyncSeed = {
    id: `seed_${Date.now()}`,
    seedCode,
    creatorUIN: identity.uin,
    creatorPublicKey: publicKey,
    targetUIN,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    isActivated: false,
  };
  
  const seeds = await getSyncSeeds();
  seeds.push(seed);
  await SecureStore.setItemAsync(SYNC_SEEDS_KEY, JSON.stringify(seeds));
  
  return seed;
}

// Activate a sync seed (receiver side)
export async function activateSyncSeed(seedCode: string): Promise<SyncSeed | null> {
  const seeds = await getSyncSeeds();
  const seed = seeds.find(s => s.seedCode === seedCode && !s.isActivated);
  
  if (!seed) return null;
  if (Date.now() > seed.expiresAt) return null;
  
  seed.isActivated = true;
  await SecureStore.setItemAsync(SYNC_SEEDS_KEY, JSON.stringify(seeds));
  
  return seed;
}

// Generate 6-digit sync code
function generateSyncCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getSyncSeeds(): Promise<SyncSeed[]> {
  const stored = await SecureStore.getItemAsync(SYNC_SEEDS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Verify time synchronization (both parties must long-press within 60s window)
export async function verifyTimeSync(
  localTimestamp: number,
  remoteTimestamp: number,
  maxOffset: number = 60000 // 60 seconds
): Promise<{ isValid: boolean; offset: number }> {
  const offset = Math.abs(localTimestamp - remoteTimestamp);
  
  return {
    isValid: offset <= maxOffset,
    offset,
  };
}

// Complete sync - exchange keys
export async function completeVoyagerSync(
  partnerUIN: string,
  partnerPublicKey: string
): Promise<void> {
  const identity = await getIdentity();
  if (!identity) throw new Error('No identity');
  
  // Save as trusted peer
  const { saveTrustedPeer } = await import('./storage');
  await saveTrustedPeer({
    uin: partnerUIN,
    publicKey: partnerPublicKey,
    connectedAt: Date.now(),
  isVoyager: true, // Mark as voyager friend
  });
}

// "地理是限制，但同步是意志。"
