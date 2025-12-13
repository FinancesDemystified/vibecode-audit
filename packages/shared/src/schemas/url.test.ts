/**
 * URL schema tests
 * Date: 121225
 * Test iteration: v1
 */
import { describe, it, expect } from 'vitest';
import { urlSchema } from './url';

describe('urlSchema', () => {
  it('validates https URLs', () => {
    expect(urlSchema.parse('https://example.com')).toBe('https://example.com');
  });

  it('validates http URLs', () => {
    expect(urlSchema.parse('http://example.com')).toBe('http://example.com');
  });

  it('rejects invalid URLs', () => {
    expect(() => urlSchema.parse('not-a-url')).toThrow();
  });

  it('rejects non-http protocols', () => {
    expect(() => urlSchema.parse('ftp://example.com')).toThrow();
  });
});

