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
  try {
    const res = await fetch('https://feeds.feedburner.com/TheHackersNews', { 
      signal: AbortSignal.timeout(5000) 
    });
    const text = await res.text();
    const titles = text.match(/<title>(.*?)<\/title>/g)?.slice(1, 20) || [];
    const filtered = titles
      .map(t => t.replace(/<[^>]+>/g, '').trim())
      .filter(t => KEYWORDS.some(k => t.toLowerCase().includes(k)) || 
                   t.toLowerCase().includes('api key') ||
                   t.toLowerCase().includes('exposed') ||
                   t.toLowerCase().includes('hard-coded'))
      .slice(0, 5);
    return filtered.length ? filtered : [
      'React2Shell vulnerability actively exploited',
      'Hard-coded secrets in AI-generated apps',
      'Vercel env vars exposed in client bundles',
    ];
  } catch {
    return [
      'React2Shell vulnerability actively exploited',
      'Hard-coded secrets in AI-generated apps',
      'Vercel env vars exposed in client bundles',
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

