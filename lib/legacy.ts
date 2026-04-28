// Legacy Recovery - 24 Word Mnemonic
import * as SecureStore from 'expo-secure-store';
import { hashString } from './crypto';

const MNEMONIC_KEY = 'veritas_mnemonic_hash';
const LEGACY_VERIFIED_KEY = 'veritas_legacy_verified';

// Word list for mnemonic generation (simplified - use BIP39 in production)
const WORD_LIST = [
  'TIME', 'SPACE', 'TRUTH', 'MEMO', 'EXIST', 'PHYS', 'DATA', 'SOUL',
  'STREET', 'PROJ', 'ECHO', 'LINK', 'DIST', 'AXIS', 'SIGN', 'AUTH',
  'SHOT', 'LOG', 'PEER', 'ALIEN', 'TRACE', 'FILM', 'SHUT', 'BEAM',
  'CITY', 'WILD', 'FLUX', 'TERM', 'EVER', 'ONCE', 'MARK', 'PROOF',
];

export interface LegacyState {
  hasMnemonic: boolean;
  isVerified: boolean;
  verifiedAt?: number;
}

// Generate 24-word mnemonic
export function generateMnemonic(): string[] {
  const mnemonic: string[] = [];
  
  for (let i = 0; i < 24; i++) {
    const index = Math.floor(Math.random() * WORD_LIST.length);
    mnemonic.push(WORD_LIST[index]);
  }
  
  return mnemonic;
}

// Store mnemonic hash (never store the actual mnemonic)
export async function storeMnemonicHash(mnemonic: string[]): Promise<void> {
  const mnemonicString = mnemonic.join(' ');
  const hash = await hashString(mnemonicString);
  
  await SecureStore.setItemAsync(MNEMONIC_KEY, hash);
}

// Verify mnemonic
export async function verifyMnemonic(mnemonic: string[]): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(MNEMONIC_KEY);
  if (!storedHash) return false;
  
  const mnemonicString = mnemonic.join(' ');
  const hash = await hashString(mnemonicString);
  
  const isValid = hash === storedHash;
  
  if (isValid) {
    await SecureStore.setItemAsync(LEGACY_VERIFIED_KEY, JSON.stringify({
      isVerified: true,
      verifiedAt: Date.now(),
    }));
  }
  
  return isValid;
}

// Get legacy state
export async function getLegacyState(): Promise<LegacyState> {
  const storedHash = await SecureStore.getItemAsync(MNEMONIC_KEY);
  const verified = await SecureStore.getItemAsync(LEGACY_VERIFIED_KEY);
  
  let isVerified = false;
  let verifiedAt: number | undefined;
  
  if (verified) {
    try {
      const parsed = JSON.parse(verified);
      isVerified = parsed.isVerified;
      verifiedAt = parsed.verifiedAt;
    } catch {}
  }
  
  return {
    hasMnemonic: !!storedHash,
    isVerified,
    verifiedAt,
  };
}

// Format mnemonic for display (in groups of 4)
export function formatMnemonic(mnemonic: string[]): string[][] {
  const groups: string[][] = [];
  
  for (let i = 0; i < mnemonic.length; i += 4) {
    groups.push(mnemonic.slice(i, i + 4));
  }
  
  return groups;
}

// Recovery warning message
export const RECOVERY_WARNING = `
⚠️ 物理繼承警告 ⚠️

這 24 個詞是你唯一的恢復手段。
請用紙筆抄寫，妥善保管。

如果助記詞遺失，你的 UIN 與所有日記
將永遠消失在數位荒漠中。

這不是威脅，這是物理法則。
`;
