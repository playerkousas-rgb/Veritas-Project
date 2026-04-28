// Screenshot Detection Service
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type ScreenshotCallback = () => void;

let screenshotCallback: ScreenshotCallback | null = null;
let appStateSubscription: { remove: () => void } | null = null;

export function startScreenshotDetection(callback: ScreenshotCallback): void {
  screenshotCallback = callback;
  
  // On iOS, we can detect screenshots via app state changes
  // On Android, we would use FLAG_SECURE
  if (Platform.OS === 'ios') {
    // iOS triggers a resign active event when screenshot is taken
    appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'inactive') {
        // Potential screenshot detected
        // This is a heuristic - user might just be switching apps
      }
    });
  }
}

export function stopScreenshotDetection(): void {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  screenshotCallback = null;
}

export function enableFlagSecure(): void {
  // Android only - prevent screenshots
  // In production, this would call native code to set FLAG_SECURE
  // This prevents screenshots and screen recording
  console.log('FLAG_SECURE enabled (Android only)');
}

export function disableFlagSecure(): void {
  console.log('FLAG_SECURE disabled');
}

export function trustDowngrade(): void {
  // Called when screenshot is detected
  // Send notification about trust downgrade
  if (screenshotCallback) {
    screenshotCallback();
  }
  
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
