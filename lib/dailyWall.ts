// Daily Wall Service - One Photo Per Day
import { getBundles, updateBundle, deleteBundle, getWallPhotos, saveWallPhoto } from './storage';
import { getIdentity } from './identity';
import type { PolaroidBundle } from './types';

export async function getTodaysPhotos(): Promise<PolaroidBundle[]> {
  const bundles = await getBundles();
  const today = getDateString(new Date());
  
  return bundles.filter(b => {
    const photoDate = getDateString(new Date(b.createdAt));
    return photoDate === today && !b.isWallPhoto;
  });
}

export async function getWallPhotoForDate(date: Date): Promise<PolaroidBundle | null> {
  const wallPhotos = await getWallPhotos();
  const targetDate = getDateString(date);
  
  return wallPhotos.find(p => p.wallDate === targetDate) || null;
}

export async function getAllWallPhotos(): Promise<PolaroidBundle[]> {
  return await getWallPhotos();
}

export async function selectWallPhoto(
  bundleId: string,
  diaryText?: string
): Promise<PolaroidBundle> {
  const bundles = await getBundles();
  const bundle = bundles.find(b => b.id === bundleId);
  
  if (!bundle) throw new Error('Photo not found');
  
  // Check if already a wall photo
  if (bundle.isWallPhoto) {
    throw new Error('This photo is already on the wall');
  }
  
  // Check if today already has a wall photo
  const today = getDateString(new Date());
  const wallPhotos = await getWallPhotos();
  const existingToday = wallPhotos.find(p => p.wallDate === today);
  
  if (existingToday) {
    throw new Error('Today already has a wall photo. Only one per day allowed.');
  }
  
  // Add diary text if provided
  if (diaryText && !bundle.diary) {
    const { updateBundleWithDiary } = await import('./polaroid');
    await updateBundleWithDiary(bundleId, diaryText);
  }
  
  // Mark as wall photo
  bundle.isWallPhoto = true;
  bundle.wallDate = today;
  
  await updateBundle(bundle);
  await saveWallPhoto(bundle);
  
  return bundle;
}

export async function runDailyPurge(): Promise<{ deleted: number; kept: number }> {
  const bundles = await getBundles();
  const today = getDateString(new Date());
  
  let deleted = 0;
  let kept = 0;
  
  for (const bundle of bundles) {
    const photoDate = getDateString(new Date(bundle.createdAt));
    
    // Skip today's photos
    if (photoDate === today) continue;
    
    // Delete if not a wall photo
    if (!bundle.isWallPhoto) {
      await deleteBundle(bundle.id);
      deleted++;
    } else {
      kept++;
    }
  }
  
  return { deleted, kept };
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getWallStats(): Promise<{
  totalPhotos: number;
  wallPhotos: number;
  todayPhotos: number;
}> {
  const bundles = await getBundles();
  const wallPhotos = await getWallPhotos();
  const today = getDateString(new Date());
  
  const todayPhotos = bundles.filter(b => {
    const photoDate = getDateString(new Date(b.createdAt));
    return photoDate === today;
  });
  
  return {
    totalPhotos: bundles.length,
    wallPhotos: wallPhotos.length,
    todayPhotos: todayPhotos.length,
  };
}

export async function checkAndRunMidnightPurge(): Promise<void> {
  const lastPurgeKey = 'last_purge_date';
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  const lastPurge = await AsyncStorage.getItem(lastPurgeKey);
  const today = getDateString(new Date());
  
  if (lastPurge !== today) {
    await runDailyPurge();
    await AsyncStorage.setItem(lastPurgeKey, today);
  }
}
