/**
 * URL validation schema
 * Dependencies: zod
 * Purpose: Validate and parse URLs for security scanning
 */
import { z } from 'zod';

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL must use http:// or https://',
  })
  .refine((url) => {
    try {
      const urlObj = new (globalThis as any).URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }, 'Invalid URL structure');

export type UrlInput = z.infer<typeof urlSchema>;

