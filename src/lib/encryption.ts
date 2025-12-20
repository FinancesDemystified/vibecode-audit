/**
 * Encryption utilities for sensitive data
 * Dependencies: crypto
 * Purpose: Encrypt/decrypt credentials at rest using AES-256-GCM
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 32 bytes = 256 bits

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64-character hex string (32 bytes)');
  }
  return Buffer.from(keyHex, 'hex');
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encrypt(text: string): EncryptedData {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

export function encryptCredentials(credentials: { username?: string; password?: string; email?: string }): EncryptedData | null {
  if (!credentials || (!credentials.password && !credentials.username && !credentials.email)) {
    return null;
  }
  return encrypt(JSON.stringify(credentials));
}

export function decryptCredentials(encryptedData: EncryptedData | string): { username?: string; password?: string; email?: string } | null {
  // Handle backward compatibility: if it's a plain string, assume it's unencrypted
  if (typeof encryptedData === 'string') {
    try {
      return JSON.parse(encryptedData);
    } catch {
      return null;
    }
  }
  
  // Handle encrypted format
  if (!encryptedData.encrypted || !encryptedData.iv || !encryptedData.tag) {
    return null;
  }
  
  try {
    const decrypted = decrypt(encryptedData.encrypted, encryptedData.iv, encryptedData.tag);
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('[Encryption] Failed to decrypt credentials:', err);
    return null;
  }
}

