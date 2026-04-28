// Anti-AI & Physical Provenance Validation
import { checkEmulator } from './identity';
import { checkMockLocation, analyzeMotionBlur, getAccelerometerData } from './sensors';
import { verifySignature, hashString } from './crypto';
import type { SensorData, VerificationResult, PolaroidBundle } from './types';

export async function validateHardwareEnvironment(): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  // Check if running on real device
  const isEmulator = await checkEmulator();
  if (isEmulator) {
    return {
      isValid: false,
      reason: 'Virtual device detected. Camera disabled for security.',
    };
  }
  
  // Check for mock location
  const isMockLocation = await checkMockLocation();
  if (isMockLocation) {
    return {
      isValid: false,
      reason: 'Mock location detected. Photo capture denied.',
    };
  }
  
  return { isValid: true };
}

export async function validateSensorConsistency(
  sensorData: SensorData,
  imageBrightness?: number
): Promise<{ isConsistent: boolean; anomalies: string[] }> {
  const anomalies: string[] = [];
  
  // Check GPS accuracy
  if (sensorData.gps.accuracy > 20) {
    anomalies.push('GPS accuracy too low (>20m)');
  }
  
  // Check motion blur consistency
  const motion = analyzeMotionBlur();
  if (motion.isMoving && motion.blurLevel > 0.5) {
    // Device was moving significantly during capture
    // In a real photo, this should show some blur
    // AI-generated images often ignore this
    anomalies.push('Motion detected but may not match image');
  }
  
  // Check if accelerometer data is reasonable
  const accel = sensorData.accelerometer;
  const accelMagnitude = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
  if (accelMagnitude < 8 || accelMagnitude > 12) {
    anomalies.push('Unusual accelerometer readings');
  }
  
  return {
    isConsistent: anomalies.length === 0,
    anomalies,
  };
}

export async function createManifest(
  imageData: string,
  sensorData: SensorData,
  uin: string,
  timestamp: number
): Promise<string> {
  const manifest = {
    version: '1.0',
    type: 'veritas-photo',
    timestamp,
    uin,
    sensorData: {
      gps: {
        lat: sensorData.gps.latitude,
        lng: sensorData.gps.longitude,
        alt: sensorData.gps.altitude,
        acc: sensorData.gps.accuracy,
      },
      accelerometer: {
        x: sensorData.accelerometer.x,
        y: sensorData.accelerometer.y,
        z: sensorData.accelerometer.z,
      },
      gyroscope: {
        x: sensorData.gyroscope.x,
        y: sensorData.gyroscope.y,
        z: sensorData.gyroscope.z,
      },
    },
    imageHash: await hashString(imageData.substring(0, 1000)), // Partial hash for performance
  };
  
  return JSON.stringify(manifest);
}

export async function verifyBundle(
  bundle: PolaroidBundle
): Promise<VerificationResult> {
  try {
    // Check signature
    const manifest = await createManifest(
      bundle.imageUri,
      bundle.sensorData,
      bundle.uin,
      bundle.createdAt
    );
    
    const signatureValid = await verifySignature(
      manifest,
      bundle.signature,
      bundle.uin // In real impl, would resolve UIN to public key
    );
    
    // Check sensor consistency
    const { isConsistent, anomalies } = await validateSensorConsistency(
      bundle.sensorData
    );
    
    return {
      isValid: signatureValid && isConsistent,
      isPhysical: isConsistent,
      signatureValid,
      sensorConsistent: isConsistent,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      isValid: false,
      isPhysical: false,
      signatureValid: false,
      sensorConsistent: false,
      timestamp: Date.now(),
    };
  }
}

export function getVerificationBadge(result: VerificationResult): {
  label: string;
  color: string;
  icon: string;
} {
  if (result.isValid && result.signatureValid && result.sensorConsistent) {
    return {
      label: 'PHYSICALLY VERIFIED',
      color: '#22c55e',
      icon: 'checkmark-circle',
    };
  }
  
  if (result.signatureValid && !result.sensorConsistent) {
    return {
      label: 'SENSOR ANOMALY',
      color: '#f59e0b',
      icon: 'warning',
    };
  }
  
  return {
    label: 'UNVERIFIED',
    color: '#ef4444',
    icon: 'close-circle',
  };
}
