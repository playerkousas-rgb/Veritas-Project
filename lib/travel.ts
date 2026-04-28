// Travel Awareness - Spatio-Temporal Consistency
import * as SecureStore from 'expo-secure-store';
import { getIdentity } from './identity';

const LAST_LOCATION_KEY = 'veritas_last_location';
const LOCK_STATE_KEY = 'veritas_lock_state';
const COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const ACCLIMATION_DURATION = 30 * 60 * 1000; // 30 minutes

const MAX_SPEED_KMH = 1200; // Maximum reasonable speed (supersonic = spoofing)
const FLIGHT_SPEED_KMH = 1000; // Normal flight speed threshold

export interface LocationRecord {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
}

export interface LockState {
  isLocked: boolean;
  lockedAt: number;
  reason: string;
  unlockAt: number;
}

export interface AcclimationState {
  isInAcclimation: boolean;
  startedAt: number;
  endsAt: number;
  previousLocation: LocationRecord;
  currentLocation: LocationRecord;
}

// Calculate speed between two points
export function calculateSpeed(
  loc1: LocationRecord,
  loc2: LocationRecord
): number {
  const distance = calculateDistanceKm(
    loc1.latitude, loc1.longitude,
    loc2.latitude, loc2.longitude
  );
  
  const timeHours = (loc2.timestamp - loc1.timestamp) / (1000 * 60 * 60);
  
  if (timeHours === 0) return Infinity;
  return distance / timeHours;
}

// Calculate distance in kilometers
function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Check if travel is legitimate
export async function validateTravel(
  newLocation: LocationRecord
): Promise<{ isValid: boolean; requiresAcclimation: boolean; lockState?: LockState }> {
  const lastLocation = await getLastLocation();
  
  if (!lastLocation) {
    await saveLastLocation(newLocation);
    return { isValid: true, requiresAcclimation: false };
  }
  
  const speed = calculateSpeed(lastLocation, newLocation);
  const distance = calculateDistanceKm(
    lastLocation.latitude, lastLocation.longitude,
    newLocation.latitude, newLocation.longitude
  );
  
  // Check for impossible speed (spoofing)
  if (speed > MAX_SPEED_KMH) {
    const lockState: LockState = {
      isLocked: true,
      lockedAt: Date.now(),
      reason: '時空不穩定，系統已鎖定',
      unlockAt: Date.now() + COOLDOWN_DURATION,
    };
    
    await setLockState(lockState);
    return { isValid: false, requiresAcclimation: false, lockState };
  }
  
  // Check for long-distance travel (requires acclimation)
  const isInternational = distance > 500; // More than 500km
  const requiresAcclimation = isInternational && speed <= FLIGHT_SPEED_KMH;
  
  await saveLastLocation(newLocation);
  
  return { isValid: true, requiresAcclimation };
}

// Save last known location
async function saveLastLocation(location: LocationRecord): Promise<void> {
  await SecureStore.setItemAsync(LAST_LOCATION_KEY, JSON.stringify(location));
}

// Get last known location
async function getLastLocation(): Promise<LocationRecord | null> {
  const stored = await SecureStore.getItemAsync(LAST_LOCATION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Set lock state
async function setLockState(state: LockState): Promise<void> {
  await SecureStore.setItemAsync(LOCK_STATE_KEY, JSON.stringify(state));
}

// Get current lock state
export async function getLockState(): Promise<LockState | null> {
  const stored = await SecureStore.getItemAsync(LOCK_STATE_KEY);
  if (!stored) return null;
  try {
    const state = JSON.parse(stored);
    
    // Check if lock has expired
    if (state.isLocked && Date.now() > state.unlockAt) {
      state.isLocked = false;
      await setLockState(state);
    }
    
    return state;
  } catch {
    return null;
  }
}

// Start acclimation period
export async function startAcclimation(
  previousLocation: LocationRecord,
  currentLocation: LocationRecord
): Promise<AcclimationState> {
  const state: AcclimationState = {
    isInAcclimation: true,
    startedAt: Date.now(),
    endsAt: Date.now() + ACCLIMATION_DURATION,
    previousLocation,
    currentLocation,
  };
  
  return state;
}

// Check if device was off (for flight mode awareness)
export async function checkDeviceOffDuration(
  lastKnownTime: number
): Promise<{ wasOff: boolean; duration: number }> {
  const now = Date.now();
  const duration = now - lastKnownTime;
  
  return {
    wasOff: duration > 5 * 60 * 1000, // More than 5 minutes
    duration,
  };
}

// Validate flight travel
export function validateFlight(
  distance: number,
  timeOff: number
): boolean {
  // Minimum time for given distance at flight speed
  const minFlightTime = (distance / FLIGHT_SPEED_KMH) * 60 * 60 * 1000;
  
  // Add 30% buffer for boarding, taxiing, etc.
  const requiredTime = minFlightTime * 1.3;
  
  return timeOff >= requiredTime;
}
