// Snapshot Privacy Service - Three Visibility Levels
import { getTrustedPeers } from './storage';
import { getIdentity } from './identity';
import type { PolaroidBundle } from './types';

export type VisibilityLevel = 'public' | 'friends' | 'private';

export interface VisibilitySettings {
  level: VisibilityLevel;
  designatedUINs?: string[]; // For private, can specify who can see
  setAt: number;
}

export interface NearbyUser {
  uin: string;
  distance: number;
  lastSeen: number;
  publicPhoto?: PolaroidBundle;
}

// Check if a user can see a photo based on visibility settings
export async function canUserSeePhoto(
  photo: PolaroidBundle & { visibility: VisibilitySettings },
  viewerUIN: string,
  viewerLocation?: { lat: number; lng: number }
): Promise<boolean> {
  const ownerIdentity = await getIdentity();
  if (!ownerIdentity) return false;
  
  // Owner can always see their own photos
  if (viewerUIN === ownerIdentity.uin) return true;
  
  switch (photo.visibility.level) {
    case 'public':
      // Public photos are visible to nearby users (within 50m)
      if (viewerLocation && photo.sensorData.gps) {
        const distance = calculateDistance(
          viewerLocation.lat,
          viewerLocation.lng,
          photo.sensorData.gps.latitude,
          photo.sensorData.gps.longitude
        );
        return distance <= 50; // 50 meter radius
      }
      return false;
      
    case 'friends':
      // Only visible to trusted peers
      const peers = await getTrustedPeers();
      return peers.some(p => p.uin === viewerUIN);
      
    case 'private':
      // Only visible to designated users or owner
      if (photo.visibility.designatedUINs) {
        return photo.visibility.designatedUINs.includes(viewerUIN);
      }
      return false;
      
    default:
      return false;
  }
}

// Calculate distance between two GPS coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Get visibility label for display
export function getVisibilityLabel(level: VisibilityLevel): string {
  switch (level) {
    case 'public':
      return '街頭投影';
    case 'friends':
      return '空間共鳴';
    case 'private':
      return '個人回憶';
  }
}

// Get visibility icon
export function getVisibilityIcon(level: VisibilityLevel): string {
  switch (level) {
    case 'public':
      return 'globe-outline';
    case 'friends':
      return 'people-outline';
    case 'private':
      return 'lock-closed-outline';
  }
}

// Get visibility color
export function getVisibilityColor(level: VisibilityLevel): string {
  switch (level) {
    case 'public':
      return '#000000';
    case 'friends':
      return '#0000FF';
    case 'private':
      return '#6B7280';
  }
}
