// Migration Bridge Service - Device Transfer
import { File, Directory, Paths } from 'expo-file-system';
import { getIdentity } from './identity';
import { getBundles, deleteAllData } from './storage';
import { getPublicKey, signData } from './crypto';
import type { PolaroidBundle, MigrationPayload } from './types';

const VAULT_DIR = new Directory(Paths.document, 'vault');

export async function prepareMigrationData(targetUIN: string): Promise<MigrationPayload> {
  const identity = await getIdentity();
  if (!identity) throw new Error('No identity found');
  
  const publicKey = await getPublicKey();
  if (!publicKey) throw new Error('No public key found');
  
  // Get all vault data
  const bundles = await getBundles();
  
  // In production, this would:
  // 1. Read all files from vault
  // 2. Encrypt with target public key
  // 3. Create transfer package
  
  const payload: MigrationPayload = {
    encryptedData: JSON.stringify(bundles), // In production, this would be encrypted
    signature: await signData(JSON.stringify(bundles)),
    targetUIN,
    timestamp: Date.now(),
  };
  
  return payload;
}

export async function verifyMigrationAck(ack: string): Promise<boolean> {
  // Verify that the target device received the data
  // In production, this would verify a signature from the target device
  return ack === 'ACK_SUCCESS';
}

export async function completeMigration(): Promise<void> {
  // Delete all local data after successful transfer
  await deleteAllData();
  
  // Delete identity
  const { deleteIdentity } = await import('./identity');
  await deleteIdentity();
  
  // Clear vault directory
  if (VAULT_DIR.exists) {
    await VAULT_DIR.delete();
  }
}

export async function receiveMigrationData(
  payload: MigrationPayload
): Promise<PolaroidBundle[]> {
  // In production, this would:
  // 1. Decrypt data with local private key
  // 2. Verify signature
  // 3. Import bundles
  
  const bundles: PolaroidBundle[] = JSON.parse(payload.encryptedData);
  
  // Verify the payload is for us
  const identity = await getIdentity();
  if (!identity || identity.uin !== payload.targetUIN) {
    throw new Error('Migration data not for this device');
  }
  
  return bundles;
}

export function generateMigrationCode(): string {
  // Generate a 6-digit code for P2P pairing
  return Math.floor(100000 + Math.random() * 900000).toString();
}
