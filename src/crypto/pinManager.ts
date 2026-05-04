import {
  hashPin,
  generateSalt,
  generateEncryptionKey,
  deriveCryptoKey,
  wrapKey,
  unwrapKey,
  bufferToHex,
  hexToBuffer,
  bufferToBase64,
  base64ToBuffer,
} from './keyDerivation';

const SETTINGS_KEY = 'budget-tracker-settings';

interface StoredSettings {
  pinHash: string;
  pinSalt: string;
  recoveryHash: string;
  recoverySalt: string;
  securityQuestion: string;
  wrappedKey: string;
  wrappedKeyIv: string;
  recoveryWrappedKey: string;
  recoveryWrappedKeyIv: string;
  hasPinEnabled: boolean;
}

export function getStoredSettings(): StoredSettings | null {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSettings(settings: StoredSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function isPinConfigured(): boolean {
  const settings = getStoredSettings();
  return settings?.hasPinEnabled ?? false;
}

export async function setupPin(
  pin: string,
  securityQuestion: string,
  securityAnswer: string
): Promise<CryptoKey> {
  const pinSalt = generateSalt();
  const recoverySalt = generateSalt();

  // Hash the PIN for verification
  const pinHash = await hashPin(pin, pinSalt);

  // Hash the security answer for verification
  const recoveryHash = await hashPin(
    securityAnswer.toLowerCase().trim(),
    recoverySalt
  );

  // Generate the master encryption key
  const encryptionKey = await generateEncryptionKey();

  // Derive wrapping key from PIN
  const pinDerivedKey = await deriveCryptoKey(pin, pinSalt);
  const { wrapped: wrappedKey, iv: wrappedKeyIv } = await wrapKey(
    encryptionKey,
    pinDerivedKey
  );

  // Derive wrapping key from security answer (for recovery)
  const recoveryDerivedKey = await deriveCryptoKey(
    securityAnswer.toLowerCase().trim(),
    recoverySalt
  );
  const { wrapped: recoveryWrappedKey, iv: recoveryWrappedKeyIv } =
    await wrapKey(encryptionKey, recoveryDerivedKey);

  const settings: StoredSettings = {
    pinHash,
    pinSalt: bufferToHex(pinSalt),
    recoveryHash,
    recoverySalt: bufferToHex(recoverySalt),
    securityQuestion,
    wrappedKey: bufferToBase64(wrappedKey),
    wrappedKeyIv: bufferToBase64(wrappedKeyIv.buffer as ArrayBuffer),
    recoveryWrappedKey: bufferToBase64(recoveryWrappedKey),
    recoveryWrappedKeyIv: bufferToBase64(recoveryWrappedKeyIv.buffer as ArrayBuffer),
    hasPinEnabled: true,
  };

  saveSettings(settings);
  return encryptionKey;
}

export async function verifyPin(pin: string): Promise<CryptoKey | null> {
  const settings = getStoredSettings();
  if (!settings) return null;

  const pinSalt = hexToBuffer(settings.pinSalt);
  const hash = await hashPin(pin, pinSalt);

  if (hash !== settings.pinHash) return null;

  // Unwrap the encryption key
  const pinDerivedKey = await deriveCryptoKey(pin, pinSalt);
  try {
    const encryptionKey = await unwrapKey(
      base64ToBuffer(settings.wrappedKey),
      pinDerivedKey,
      new Uint8Array(base64ToBuffer(settings.wrappedKeyIv))
    );
    return encryptionKey;
  } catch {
    return null;
  }
}

export async function recoverWithSecurityAnswer(
  answer: string,
  newPin: string
): Promise<CryptoKey | null> {
  const settings = getStoredSettings();
  if (!settings) return null;

  const recoverySalt = hexToBuffer(settings.recoverySalt);
  const normalizedAnswer = answer.toLowerCase().trim();
  const hash = await hashPin(normalizedAnswer, recoverySalt);

  if (hash !== settings.recoveryHash) return null;

  // Unwrap encryption key using recovery key
  const recoveryDerivedKey = await deriveCryptoKey(
    normalizedAnswer,
    recoverySalt
  );
  try {
    const encryptionKey = await unwrapKey(
      base64ToBuffer(settings.recoveryWrappedKey),
      recoveryDerivedKey,
      new Uint8Array(base64ToBuffer(settings.recoveryWrappedKeyIv))
    );

    // Re-wrap with new PIN
    const newPinSalt = generateSalt();
    const newPinHash = await hashPin(newPin, newPinSalt);
    const newPinDerivedKey = await deriveCryptoKey(newPin, newPinSalt);
    const { wrapped: newWrappedKey, iv: newWrappedKeyIv } = await wrapKey(
      encryptionKey,
      newPinDerivedKey
    );

    // Update settings with new PIN
    settings.pinHash = newPinHash;
    settings.pinSalt = bufferToHex(newPinSalt);
    settings.wrappedKey = bufferToBase64(newWrappedKey);
    settings.wrappedKeyIv = bufferToBase64(newWrappedKeyIv.buffer as ArrayBuffer);
    saveSettings(settings);

    return encryptionKey;
  } catch {
    return null;
  }
}

export async function changePin(
  currentPin: string,
  newPin: string
): Promise<CryptoKey | null> {
  const settings = getStoredSettings();
  if (!settings) return null;

  const pinSalt = hexToBuffer(settings.pinSalt);
  const hash = await hashPin(currentPin, pinSalt);
  if (hash !== settings.pinHash) return null;

  // Unwrap encryption key with current PIN
  const currentDerivedKey = await deriveCryptoKey(currentPin, pinSalt);
  let encryptionKey: CryptoKey;
  try {
    encryptionKey = await unwrapKey(
      base64ToBuffer(settings.wrappedKey),
      currentDerivedKey,
      new Uint8Array(base64ToBuffer(settings.wrappedKeyIv))
    );
  } catch {
    return null;
  }

  // Rewrap with new PIN
  const newPinSalt = generateSalt();
  const newPinHash = await hashPin(newPin, newPinSalt);
  const newPinDerivedKey = await deriveCryptoKey(newPin, newPinSalt);
  const { wrapped: newWrappedKey, iv: newWrappedKeyIv } = await wrapKey(
    encryptionKey,
    newPinDerivedKey
  );

  settings.pinHash = newPinHash;
  settings.pinSalt = bufferToHex(newPinSalt);
  settings.wrappedKey = bufferToBase64(newWrappedKey);
  settings.wrappedKeyIv = bufferToBase64(newWrappedKeyIv.buffer as ArrayBuffer);
  saveSettings(settings);

  return encryptionKey;
}

export async function disablePin(currentPin: string): Promise<boolean> {
  const settings = getStoredSettings();
  if (!settings) return false;

  const pinSalt = hexToBuffer(settings.pinSalt);
  const hash = await hashPin(currentPin, pinSalt);
  if (hash !== settings.pinHash) return false;

  settings.hasPinEnabled = false;
  saveSettings(settings);
  return true;
}

export function getSecurityQuestion(): string | null {
  const settings = getStoredSettings();
  return settings?.securityQuestion ?? null;
}

export function getPinSetupStatus(): 'unseen' | 'dismissed' | 'configured' {
  const settings = getStoredSettings();
  if (!settings) {
    const dismissed = localStorage.getItem('budget-tracker-pin-dismissed');
    return dismissed ? 'dismissed' : 'unseen';
  }
  return settings.hasPinEnabled ? 'configured' : 'dismissed';
}

export function dismissPinSetup(): void {
  localStorage.setItem('budget-tracker-pin-dismissed', 'true');
}

export function clearAllData(): void {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem('budget-tracker-pin-dismissed');
}
