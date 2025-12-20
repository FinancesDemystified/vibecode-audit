/**
 * News fetcher for vibe-coding breaches
 * Dependencies: redis
 * Purpose: Fetch & cache security news, rotate in AI analysis
 */
import { redis } from './redis';

const NEWS_KEY = 'vibe:breach-news';
const TTL = 86400; // 24hrs

const KEYWORDS = ['cursor', 'bolt', 'vercel', 'supabase', 'firebase', 'nextjs', 'react', 'ai-generated', 'no-code'];

async function fetchNews(): Promise<string[]> {
  // Option 1: RSS feed (CVE, security news)
  try {
    const res = await fetch('https://www.cisa.gov/news-events/cybersecurity-advisories/rss.xml', { 
      signal: AbortSignal.timeout(5000) 
    });
    const text = await res.text();
    const items = text.match(/<title>(.*?)<\/title>/g)?.slice(1, 10) || [];
    return items
      .map(t => t.replace(/<[^>]+>/g, '').trim())
      .filter(t => KEYWORDS.some(k => t.toLowerCase().includes(k)))
      .slice(0, 5);
  } catch {
    // Fallback: curated recent incidents
    return [
      'Cursor-generated apps exposing API keys',
      'Vercel env vars leaked in client bundles',
      'Supabase RLS bypass in AI-built apps',
      'Firebase rules misconfigured by no-code tools',
    ];
  }
}

export async function getBreachNews(): Promise<string[]> {
  // Check cache
  const cached = await redis.get(NEWS_KEY);
  if (cached) {
    return typeof cached === 'string' ? JSON.parse(cached) : cached;
  }
  
  // Fetch fresh
  const news = await fetchNews();
  if (news.length) {
    await redis.setex(NEWS_KEY, TTL, JSON.stringify(news));
  }
  return news;
}

