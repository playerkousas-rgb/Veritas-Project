// Polaroid Rendering Service
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { hashString, signData } from './crypto';
import { getIdentity } from './identity';
import { collectSensorData } from './sensors';
import { saveBundle, saveImageToVault } from './storage';
import { createManifest } from './truthValidation';
import type { PolaroidBundle, SensorData } from './types';

const POLAROID_WIDTH = 800;
const POLAROID_HEIGHT = 950; // Extra height for bottom margin
const PHOTO_SIZE = 700;
const MARGIN = 50;

export async function renderPolaroid(
  originalUri: string,
  sensorData: SensorData,
  uin: string
): Promise<string> {
  // Load and process the original image
  const manipResult = await ImageManipulator.manipulateAsync(
    originalUri,
    [
      { resize: { width: PHOTO_SIZE, height: PHOTO_SIZE } },
    ],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
  );
  
  // Apply polaroid-style color grading
  const colorGraded = await ImageManipulator.manipulateAsync(
    manipResult.uri,
    [],
    { 
      compress: 0.9, 
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  
  // In a real implementation, we would:
  // 1. Create a canvas with white polaroid frame
  // 2. Apply cyan-tinted, low-saturation filter
  // 3. Add physical texture
  // 4. Render the photo in the center
  // 5. Add watermark text at bottom
  
  // For now, return the processed image
  return manipResult.uri;
}

export async function addWatermark(
  imageUri: string,
  sensorData: SensorData,
  uin: string,
  timestamp: number
): Promise<string> {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const coords = `${sensorData.gps.latitude.toFixed(6)}, ${sensorData.gps.longitude.toFixed(6)}`;
  
  // Watermark text
  const watermarkText = `${dateStr} / ${timeStr} / ${coords} / UIN:${uin}`;
  
  // In real implementation, render text onto image
  // For now, we just return the original
  return imageUri;
}

export async function addDiaryText(
  imageUri: string,
  diaryText: string
): Promise<string> {
  // Add handwritten-style diary text to polaroid
  // Text should appear in blue handwritten font style
  
  // In real implementation:
  // 1. Load image
  // 2. Create text layer with handwritten font
  // 3. Composite text onto image
  // 4. Return new image
  
  return imageUri;
}

export async function createPolaroidBundle(
  originalUri: string,
  diaryText?: string
): Promise<PolaroidBundle> {
  // Get identity
  const identity = await getIdentity();
  if (!identity) throw new Error('No identity found');
  
  // Collect sensor data
  const sensorData = await collectSensorData();
  
  // Render polaroid frame
  const polaroidUri = await renderPolaroid(originalUri, sensorData, identity.uin);
  
  // Add watermark
  let finalUri = await addWatermark(
    polaroidUri,
    sensorData,
    identity.uin,
    Date.now()
  );
  
  // Add diary text if provided
  if (diaryText) {
    finalUri = await addDiaryText(finalUri, diaryText);
  }
  
  // Calculate hash
  const imageInfo = await FileSystem.getInfoAsync(finalUri);
  const originalHash = await hashString(finalUri + Date.now());
  
  // Create manifest and sign
  const manifest = await createManifest(
    finalUri,
    sensorData,
    identity.uin,
    Date.now()
  );
  const signature = await signData(manifest);
  
  // Create bundle
  const bundle: PolaroidBundle = {
    id: `polaroid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    imageUri: finalUri,
    originalHash,
    sensorData,
    uin: identity.uin,
    signature,
    createdAt: Date.now(),
    diary: diaryText,
    isWallPhoto: false,
  };
  
  // Save bundle
  await saveBundle(bundle);
  
  return bundle;
}

export async function updateBundleWithDiary(
  bundleId: string,
  diaryText: string
): Promise<PolaroidBundle> {
  const { getBundleById, updateBundle } = await import('./storage');
  
  const bundle = await getBundleById(bundleId);
  if (!bundle) throw new Error('Bundle not found');
  
  // Check if already has diary
  if (bundle.diary) {
    throw new Error('Diary already written. Cannot modify.');
  }
  
  // Add diary text to image
  const newImageUri = await addDiaryText(bundle.imageUri, diaryText);
  
  // Update bundle
  bundle.imageUri = newImageUri;
  bundle.diary = diaryText;
  
  // Re-sign
  const manifest = await createManifest(
    newImageUri,
    bundle.sensorData,
    bundle.uin,
    bundle.createdAt
  );
  bundle.signature = await signData(manifest);
  
  await updateBundle(bundle);
  
  return bundle;
}

export function formatDateForDisplay(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeForDisplay(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
