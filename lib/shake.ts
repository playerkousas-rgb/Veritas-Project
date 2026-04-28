// Shake Detection Service - Shake-to-Connect
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { getIdentity } from './identity';
import { collectSensorData } from './sensors';

const SHAKE_THRESHOLD = 2.0; // G-force threshold
const SHAKE_COOLDOWN = 3000; // 3 seconds between shakes

type ShakeCallback = (timestamp: number, gps: { lat: number; lng: number }) => void;

let isListening = false;
let lastShakeTime = 0;
let shakeCallback: ShakeCallback | null = null;
let subscription: { remove: () => void } | null = null;

export function startShakeDetection(callback: ShakeCallback): void {
  if (isListening) return;
  
  shakeCallback = callback;
  isListening = true;
  
  subscription = Accelerometer.addListener(async (data) => {
    const gForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
    const now = Date.now();
    
    if (gForce > SHAKE_THRESHOLD && now - lastShakeTime > SHAKE_COOLDOWN) {
      lastShakeTime = now;
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Get current GPS
      try {
        const sensorData = await collectSensorData();
        
        if (shakeCallback) {
          shakeCallback(now, {
            lat: sensorData.gps.latitude,
            lng: sensorData.gps.longitude,
          });
        }
      } catch (error) {
        console.error('Failed to get GPS for shake:', error);
      }
    }
  });
  
  Accelerometer.setUpdateInterval(100);
}

export function stopShakeDetection(): void {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  isListening = false;
  shakeCallback = null;
}

export function isShakeDetectionActive(): boolean {
  return isListening;
}

// Match shake with nearby users (mock implementation)
export async function matchShake(
  timestamp: number,
  gps: { lat: number; lng: number }
): Promise<{ uin: string; distance: number }[]> {
  // In production, this would query a server for nearby shakes
  // within a 10-meter radius and matching timestamp window
  
  const identity = await getIdentity();
  if (!identity) return [];
  
  // Mock: return empty array (no matches in demo)
  return [];
}
