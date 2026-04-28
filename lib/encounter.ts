// Encounter Log - "擦肩而過" Records
import * as SecureStore from 'expo-secure-store';
import type { PolaroidBundle } from './types';
import { calculateDistance } from './privacy';

const ENCOUNTERS_KEY = 'veritas_encounters';
const ENCOUNTER_EXPIRY = 3 * 24 * 60 * 60 * 1000; // 3 days

export interface Encounter {
  id: string;
  otherUIN: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  theirPublicPhoto?: PolaroidBundle;
  hasInteracted: boolean;
}

// Record an encounter with a nearby user
export async function recordEncounter(
  otherUIN: string,
  location: { latitude: number; longitude: number },
  distance: number,
  theirPhoto?: PolaroidBundle
): Promise<Encounter> {
  const encounter: Encounter = {
    id: `enc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    otherUIN,
    timestamp: Date.now(),
    location,
    distance,
    theirPublicPhoto: theirPhoto,
    hasInteracted: false,
  };
  
  const encounters = await getEncounters();
  encounters.push(encounter);
  await SecureStore.setItemAsync(ENCOUNTERS_KEY, JSON.stringify(encounters));
  
  return encounter;
}

// Get all encounters
export async function getEncounters(): Promise<Encounter[]> {
  const stored = await SecureStore.getItemAsync(ENCOUNTERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Get recent encounters (within 3 days)
export async function getRecentEncounters(): Promise<Encounter[]> {
  const encounters = await getEncounters();
  const now = Date.now();
  
  return encounters.filter(e => now - e.timestamp < ENCOUNTER_EXPIRY);
}

// Mark encounter as interacted
export async function markEncounterInteracted(encounterId: string): Promise<void> {
  const encounters = await getEncounters();
  const index = encounters.findIndex(e => e.id === encounterId);
  
  if (index !== -1) {
    encounters[index].hasInteracted = true;
    await SecureStore.setItemAsync(ENCOUNTERS_KEY, JSON.stringify(encounters));
  }
}

// Run decay - remove old encounters
export async function runEncounterDecay(): Promise<void> {
  const encounters = await getEncounters();
  const now = Date.now();
  
  const validEncounters = encounters.filter(
    e => now - e.timestamp < ENCOUNTER_EXPIRY
  );
  
  await SecureStore.setItemAsync(ENCOUNTERS_KEY, JSON.stringify(validEncounters));
}

// Format encounter for display
export function formatEncounterTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const diffMs = now.getTime() - timestamp;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}天前`;
  }
  
  if (diffHours > 0) {
    return `${diffHours}小時前`;
  }
  
  return '剛剛';
}

// Format encounter location
export function formatEncounterLocation(encounter: Encounter): string {
  return `${encounter.location.latitude.toFixed(4)}, ${encounter.location.longitude.toFixed(4)}`;
}
