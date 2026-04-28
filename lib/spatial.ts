// Spatial Awareness - Nearby Public Projections
import { getIdentity } from './identity';
import { getCurrentGPS } from './sensors';
import { calculateDistance } from './privacy';
import { recordEncounter, type Encounter } from './encounter';
import type { PolaroidBundle } from './types';

const VISIBILITY_RANGE = 50; // 50 meters
const EXTENDED_RANGE = 100; // 100 meters for active users

export interface SpatialData {
  userUIN: string;
  userLocation: { latitude: number; longitude: number };
  nearbyPublics: NearbyProjection[];
  encounterCount: number;
  visibilityRange: number;
}

export interface NearbyProjection {
  uin: string;
  distance: number;
  direction: number; // Angle in degrees
  photo: PolaroidBundle;
  timestamp: number;
}

// Calculate user's visibility range based on activity
export function calculateVisibilityRange(
  photosToday: number,
  friendsCount: number
): number {
  // Base range is 50m
  let range = VISIBILITY_RANGE;
  
  // Each photo today adds 5m (max 25m bonus)
  range += Math.min(photosToday * 5, 25);
  
  // Each friend adds 2m (max 25m bonus)
  range += Math.min(friendsCount * 2, 25);
  
  return Math.min(range, EXTENDED_RANGE);
}

// Scan for nearby public projections
export async function scanNearbyProjections(
  userHeading?: number
): Promise<SpatialData | null> {
  const identity = await getIdentity();
  if (!identity) return null;
  
  const gps = await getCurrentGPS();
  
  // In production, this would query a server for nearby public photos
  // For now, return mock data
  const nearbyPublics: NearbyProjection[] = [];
  
  return {
    userUIN: identity.uin,
    userLocation: { latitude: gps.latitude, longitude: gps.longitude },
    nearbyPublics,
    encounterCount: nearbyPublics.length,
    visibilityRange: VISIBILITY_RANGE,
  };
}

// Calculate direction to another point (relative to north)
export function calculateDirection(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLng = toLng - fromLng;
  const y = Math.sin(dLng * Math.PI / 180);
  const x = Math.cos(toLat * Math.PI / 180) * Math.tan((toLat - fromLat) * Math.PI / 180);
  const angle = Math.atan2(y, x) * 180 / Math.PI;
  
  return (angle + 360) % 360;
}

// Check if a point is in the "view cone" based on device heading
export function isInViewCone(
  direction: number,
  heading: number,
  coneAngle: number = 60
): boolean {
  const diff = Math.abs(direction - heading);
  return diff <= coneAngle / 2 || diff >= 360 - coneAngle / 2;
}

// Spatial resonance - calculate area "heat"
export interface SpatialResonance {
  location: { latitude: number; longitude: number };
  radius: number;
  photoCount: number;
  temperature: 'cold' | 'cool' | 'warm' | 'hot';
  color: string;
}

export function calculateResonance(
  photoCount: number
): SpatialResonance['temperature'] {
  if (photoCount === 0) return 'cold';
  if (photoCount < 3) return 'cool';
  if (photoCount < 10) return 'warm';
  return 'hot';
}

export function getResonanceColor(
  temperature: SpatialResonance['temperature']
): string {
  switch (temperature) {
    case 'cold': return '#1a1a2e';
    case 'cool': return '#16213e';
    case 'warm': return '#0f3460';
    case 'hot': return '#e94560';
  }
}
