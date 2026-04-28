// Resonance Service - Passive Spatial Resonance (No Likes, No Active Search)
import * as SecureStore from 'expo-secure-store';
import { getIdentity } from './identity';
import type { PolaroidBundle } from './types';

const RESONANCE_KEY = 'veritas_resonances';

export interface SpatialResonance {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  witnessUINs: string[]; // UINs that also witnessed this location
  myBundleId: string;
}

export interface ResonanceReveal {
  location: { latitude: number; longitude: number };
  myTime: number;
  theirUIN: string;
  theirTime: number;
  timeDifference: number; // How far apart in time
}

// Record a location witness (called after photo development completes)
export async function recordLocationWitness(
  bundle: PolaroidBundle
): Promise<void> {
  const identity = await getIdentity();
  if (!identity) return;
  
  // Store in local resonance log
  const resonances = await getResonances();
  
  // Round coordinates to ~10m precision for matching
  const roundedLat = Math.round(bundle.sensorData.gps.latitude * 10000) / 10000;
  const roundedLng = Math.round(bundle.sensorData.gps.longitude * 10000) / 10000;
  
  // Check for existing resonance at this location
  const existing = resonances.find(r => 
    Math.abs(r.location.latitude - roundedLat) < 0.0001 &&
    Math.abs(r.location.longitude - roundedLng) < 0.0001
  );
  
  if (existing) {
    // Add this witness
    if (!existing.witnessUINs.includes(identity.uin)) {
      existing.witnessUINs.push(identity.uin);
    }
  } else {
    // Create new resonance point
    resonances.push({
      id: `res_${Date.now()}`,
      location: { latitude: roundedLat, longitude: roundedLng },
      timestamp: bundle.createdAt,
      witnessUINs: [identity.uin],
      myBundleId: bundle.id,
    });
  }
  
  await SecureStore.setItemAsync(RESONANCE_KEY, JSON.stringify(resonances));
}

// Reveal resonances AFTER development completes (retrospective only)
export async function revealResonances(
  bundle: PolaroidBundle
): Promise<ResonanceReveal[]> {
  const resonances = await getResonances();
  const identity = await getIdentity();
  if (!identity) return [];
  
  const roundedLat = Math.round(bundle.sensorData.gps.latitude * 10000) / 10000;
  const roundedLng = Math.round(bundle.sensorData.gps.longitude * 10000) / 10000;
  
  // Find resonances at this location (excluding self)
  const matches = resonances.filter(r =>
    Math.abs(r.location.latitude - roundedLat) < 0.0001 &&
    Math.abs(r.location.longitude - roundedLng) < 0.0001 &&
    r.witnessUINs.some(uin => uin !== identity.uin)
  );
  
  const reveals: ResonanceReveal[] = [];
  
  for (const match of matches) {
    for (const uin of match.witnessUINs) {
      if (uin !== identity.uin) {
        reveals.push({
          location: match.location,
          myTime: bundle.createdAt,
          theirUIN: uin,
          theirTime: match.timestamp,
          timeDifference: Math.abs(bundle.createdAt - match.timestamp),
        });
      }
    }
  }
  
  return reveals;
}

async function getResonances(): Promise<SpatialResonance[]> {
  const stored = await SecureStore.getItemAsync(RESONANCE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Format resonance time difference
export function formatTimeDifference(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天前`;
  }
  if (hours > 0) {
    return `${hours}小時前`;
  }
  if (minutes > 0) {
    return `${minutes}分鐘前`;
  }
  return '剛剛';
}

// No active search function - resonance is retrospective only
// "真理不應該被預知，只能被見證。"
