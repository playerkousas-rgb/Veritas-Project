// Hardware Binding & Identity Management
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { generateKeyPair, getPublicKey, generateUIN, hashString } from './crypto';
import type { DeviceIdentity } from './types';

const IDENTITY_KEY = 'veritas_identity';
const LEDGER_URL = 'https://veritas-ledger.example.com'; // Mock ledger URL

export async function getDeviceUUID(): Promise<string> {
  // Get device-specific identifier
  const deviceId = Device.modelId || Device.osBuildId || Device.deviceName || 'unknown';
  const installationId = await SecureStore.getItemAsync('installation_id');
  
  if (installationId) return installationId;
  
  // Generate new installation ID
  const newId = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${deviceId}-${Date.now()}-${Math.random()}`
  );
  
  await SecureStore.setItemAsync('installation_id', newId);
  return newId;
}

export async function getDeviceHash(): Promise<string> {
  const uuid = await getDeviceUUID();
  const deviceInfo = `${Device.modelName}-${Device.osName}-${Device.osVersion}`;
  return await hashString(uuid + deviceInfo);
}

export async function initializeIdentity(): Promise<DeviceIdentity> {
  // Check for existing identity
  const existing = await getIdentity();
  if (existing) return existing;
  
  // Generate new identity
  const deviceUUID = await getDeviceUUID();
  const deviceHash = await getDeviceHash();
  const { publicKey } = await generateKeyPair();
  
  // Register with ledger (mock implementation)
  const uin = await registerWithLedger(deviceUUID, publicKey);
  
  const identity: DeviceIdentity = {
    deviceUUID,
    deviceHash,
    uin,
    socialName: `User_${uin.slice(-4)}`,
    publicKey,
    createdAt: Date.now(),
  };
  
  // Store identity securely
  await SecureStore.setItemAsync(IDENTITY_KEY, JSON.stringify(identity));
  
  return identity;
}

export async function getIdentity(): Promise<DeviceIdentity | null> {
  const stored = await SecureStore.getItemAsync(IDENTITY_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export async function updateSocialName(name: string): Promise<void> {
  const identity = await getIdentity();
  if (!identity) throw new Error('No identity found');
  
  identity.socialName = name;
  await SecureStore.setItemAsync(IDENTITY_KEY, JSON.stringify(identity));
}

async function registerWithLedger(deviceUUID: string, publicKey: string): Promise<string> {
  // Mock ledger registration
  // In production, this would POST to actual ledger
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate deterministic UIN based on device UUID
  const hash = await hashString(deviceUUID + publicKey);
  const uin = (parseInt(hash.slice(0, 8), 16) % 90000000 + 10000000).toString();
  
  return uin;
}

export async function resolveUIN(uin: string): Promise<{ publicKey: string } | null> {
  // Mock ledger resolution
  // In production, this would GET from actual ledger
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock public key
  return {
    publicKey: 'mock_public_key_' + uin,
  };
}

export async function checkEmulator(): Promise<boolean> {
  // Check if running on emulator/simulator
  return Device.isDevice === false;
}

export async function deleteIdentity(): Promise<void> {
  await SecureStore.deleteItemAsync(IDENTITY_KEY);
  await SecureStore.deleteItemAsync('installation_id');
}
