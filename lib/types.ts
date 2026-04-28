// Veritas Type Definitions

export interface DeviceIdentity {
  deviceUUID: string;
  deviceHash: string;
  uin: string;
  socialName: string;
  publicKey: string;
  createdAt: number;
}

export interface SensorData {
  gps: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    timestamp: number;
  };
  accelerometer: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  lightLevel?: number;
  timestamp: number;
}

export interface PolaroidBundle {
  id: string;
  imageUri: string;
  originalHash: string;
  sensorData: SensorData;
  uin: string;
  signature: string;
  createdAt: number;
  diary?: string;
  isWallPhoto: boolean;
  wallDate?: string;
  visibility?: {
    level: 'public' | 'friends' | 'private';
    setAt: number;
    designatedUINs?: string[];
  };
}

export interface TrustedPeer {
  uin: string;
  publicKey: string;
  socialName?: string;
  connectedAt: number;
  isVoyager?: boolean; // True if connected via Voyager Sync (remote friend)
}

export interface PostBundle {
  bundle: PolaroidBundle;
  expiresAt: number;
  canSave: boolean;
  // NO viewCount - quantification prohibited
}

export interface VerificationResult {
  isValid: boolean;
  isPhysical: boolean;
  signatureValid: boolean;
  sensorConsistent: boolean;
  timestamp: number;
}

export interface ShakeMatch {
  uin: string;
  timestamp: number;
  distance: number;
}

export interface MigrationPayload {
  encryptedData: string;
  signature: string;
  targetUIN: string;
  timestamp: number;
}

// Resonance types
export interface SpatialResonance {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  witnessUINs: string[];
  myBundleId: string;
}

export interface ResonanceReveal {
  location: { latitude: number; longitude: number };
  myTime: number;
  theirUIN: string;
  theirTime: number;
  timeDifference: number;
}

// Voyager Sync types
export interface SyncSeed {
  id: string;
  seedCode: string;
  creatorUIN: string;
  creatorPublicKey: string;
  targetUIN: string;
  createdAt: number;
  expiresAt: number;
  isActivated: boolean;
}

export interface SyncSession {
  id: string;
  initiatorUIN: string;
  receiverUIN: string;
  initiatorPublicKey: string;
  receiverPublicKey: string;
  syncedAt: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}
