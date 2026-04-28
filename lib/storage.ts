// File System Operations
import { File, Directory, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import type { PolaroidBundle, TrustedPeer } from './types';

const VAULT_DIR = new Directory(Paths.document, 'vault');
const TEMP_DIR = new Directory(Paths.cache, 'temp');
const PEERS_KEY = 'veritas_trusted_peers';
const BUNDLES_KEY = 'veritas_bundles';
const WALL_PHOTOS_KEY = 'veritas_wall_photos';

export async function initializeStorage(): Promise<void> {
  if (!VAULT_DIR.exists) {
    await VAULT_DIR.create();
  }
  
  if (!TEMP_DIR.exists) {
    await TEMP_DIR.create();
  }
}

export async function saveToVault(
  filename: string,
  content: string
): Promise<string> {
  const file = new File(VAULT_DIR, filename);
  await file.write(content);
  return file.uri;
}

export async function saveImageToVault(
  filename: string,
  base64Data: string
): Promise<string> {
  const file = new File(VAULT_DIR, filename);
  await file.write(base64Data);
  return file.uri;
}

export async function readFromVault(filename: string): Promise<string> {
  const file = new File(VAULT_DIR, filename);
  return await file.text();
}

export async function deleteFromVault(filename: string): Promise<void> {
  const file = new File(VAULT_DIR, filename);
  if (file.exists) {
    await file.delete();
  }
}

export async function clearVault(): Promise<void> {
  if (VAULT_DIR.exists) {
    await VAULT_DIR.delete();
    await VAULT_DIR.create();
  }
}

export async function clearTempStorage(): Promise<void> {
  if (TEMP_DIR.exists) {
    await TEMP_DIR.delete();
    await TEMP_DIR.create();
  }
}

export async function saveBundle(bundle: PolaroidBundle): Promise<void> {
  const bundles = await getBundles();
  bundles.push(bundle);
  await SecureStore.setItemAsync(BUNDLES_KEY, JSON.stringify(bundles));
}

export async function getBundles(): Promise<PolaroidBundle[]> {
  const stored = await SecureStore.getItemAsync(BUNDLES_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function getBundleById(id: string): Promise<PolaroidBundle | null> {
  const bundles = await getBundles();
  return bundles.find(b => b.id === id) || null;
}

export async function updateBundle(updatedBundle: PolaroidBundle): Promise<void> {
  const bundles = await getBundles();
  const index = bundles.findIndex(b => b.id === updatedBundle.id);
  if (index !== -1) {
    bundles[index] = updatedBundle;
    await SecureStore.setItemAsync(BUNDLES_KEY, JSON.stringify(bundles));
  }
}

export async function deleteBundle(id: string): Promise<void> {
  const bundles = await getBundles();
  const filtered = bundles.filter(b => b.id !== id);
  await SecureStore.setItemAsync(BUNDLES_KEY, JSON.stringify(filtered));
  
  // Also delete the image file
  const bundle = bundles.find(b => b.id === id);
  if (bundle) {
    try {
      const file = new File(bundle.imageUri);
      if (file.exists) {
        await file.delete();
      }
    } catch {}
  }
}

export async function saveTrustedPeer(peer: TrustedPeer): Promise<void> {
  const peers = await getTrustedPeers();
  const existing = peers.findIndex(p => p.uin === peer.uin);
  if (existing !== -1) {
    peers[existing] = peer;
  } else {
    peers.push(peer);
  }
  await SecureStore.setItemAsync(PEERS_KEY, JSON.stringify(peers));
}

export async function getTrustedPeers(): Promise<TrustedPeer[]> {
  const stored = await SecureStore.getItemAsync(PEERS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function getWallPhotos(): Promise<PolaroidBundle[]> {
  const stored = await SecureStore.getItemAsync(WALL_PHOTOS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function saveWallPhoto(bundle: PolaroidBundle): Promise<void> {
  const photos = await getWallPhotos();
  photos.push(bundle);
  await SecureStore.setItemAsync(WALL_PHOTOS_KEY, JSON.stringify(photos));
}

export async function deleteAllData(): Promise<void> {
  await clearVault();
  await clearTempStorage();
  await SecureStore.deleteItemAsync(BUNDLES_KEY);
  await SecureStore.deleteItemAsync(PEERS_KEY);
  await SecureStore.deleteItemAsync(WALL_PHOTOS_KEY);
}

export async function getStorageUsage(): Promise<{ used: number; total: number }> {
  // Get total disk space
  const total = Paths.totalDiskSpace;
  // For used space, we'll approximate
  const used = 0; // Simplified for now
  
  return {
    used,
    total,
  };
}
