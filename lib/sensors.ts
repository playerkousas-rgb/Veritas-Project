// Sensor Data Collection Service
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import type { SensorData } from './types';

type SensorSubscription = { remove: () => void };

let accelerometerSubscription: SensorSubscription | null = null;
let gyroscopeSubscription: SensorSubscription | null = null;

let lastAccelerometerData = { x: 0, y: 0, z: 0, timestamp: Date.now() };
let lastGyroscopeData = { x: 0, y: 0, z: 0, timestamp: Date.now() };

export async function requestSensorPermissions(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export function startSensorListening(): void {
  accelerometerSubscription = Accelerometer.addListener(data => {
    lastAccelerometerData = {
      x: data.x,
      y: data.y,
      z: data.z,
      timestamp: Date.now(),
    };
  });
  
  gyroscopeSubscription = Gyroscope.addListener(data => {
    lastGyroscopeData = {
      x: data.x,
      y: data.y,
      z: data.z,
      timestamp: Date.now(),
    };
  });
  
  // Set update intervals
  Accelerometer.setUpdateInterval(100);
  Gyroscope.setUpdateInterval(100);
}

export function stopSensorListening(): void {
  accelerometerSubscription?.remove();
  gyroscopeSubscription?.remove();
  accelerometerSubscription = null;
  gyroscopeSubscription = null;
}

export async function getCurrentGPS(): Promise<SensorData['gps']> {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude,
    accuracy: location.coords.accuracy || 0,
    timestamp: location.timestamp,
  };
}

export async function collectSensorData(): Promise<SensorData> {
  const gps = await getCurrentGPS();
  
  return {
    gps,
    accelerometer: { ...lastAccelerometerData },
    gyroscope: { ...lastGyroscopeData },
    timestamp: Date.now(),
  };
}

export function getAccelerometerData(): typeof lastAccelerometerData {
  return { ...lastAccelerometerData };
}

export function getGyroscopeData(): typeof lastGyroscopeData {
  return { ...lastGyroscopeData };
}

export function calculateGForce(): number {
  const { x, y, z } = lastAccelerometerData;
  return Math.sqrt(x * x + y * y + z * z);
}

export async function checkMockLocation(): Promise<boolean> {
  // Check if mock location is enabled
  // On Android, we can check if location is mocked
  const location = await Location.getCurrentPositionAsync({});
  
  // @ts-ignore - mockLocation exists on Android
  if (location.mocked || location.coords.mocked) {
    return true;
  }
  
  return false;
}

export function analyzeMotionBlur(): { isMoving: boolean; blurLevel: number } {
  const { x, y, z } = lastAccelerometerData;
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  
  // If device is moving significantly
  const isMoving = magnitude > 10.5 || magnitude < 9.5;
  const blurLevel = isMoving ? Math.min(1, Math.abs(magnitude - 9.8) / 2) : 0;
  
  return { isMoving, blurLevel };
}
