/**
 * News fetcher for vibe-coding breaches
 * Dependencies: redis
 * Purpose: Fetch & cache security news, rotate in AI analysis
 */
import { redis } from './redis';

const NEWS_KEY = 'vibe:breach-news';
const TTL = 86400; // 24hrs

const KEYWORDS = [
  // AI tools
  'cursor', 'bolt', 'github copilot', 'chatgpt', 'claude', 'ai-generated', 'ai code',
  // Frameworks
  'nextjs', 'next.js', 'react', 'vue', 'svelte', 'angular', 'nuxt', 'remix',
  // Platforms
  'vercel', 'netlify', 'supabase', 'firebase', 'railway', 'render', 'fly.io',
  // No-code/low-code
  'no-code', 'low-code', 'bubble', 'webflow', 'airtable', 'zapier',
  // Common issues
  'api key', 'exposed', 'hard-coded', 'hardcoded', 'secret', 'leak', 'misconfig',
  'env var', 'environment variable', 'client-side', 'authentication bypass',
  'rls', 'row level security', 'cors', 'xss', 'csrf', 'sql injection',
  // Serverless/edge
  'serverless', 'edge function', 'lambda', 'cloudflare workers',
  // Auth issues
  'oauth', 'jwt', 'session', 'cookie', 'authentication', 'authorization',
];

async function fetchNews(): Promise<string[]> {
  try {
    const res = await fetch('https://feeds.feedburner.com/TheHackersNews', { 
      signal: AbortSignal.timeout(5000) 
    });
    const text = await res.text();
    const titles = text.match(/<title>(.*?)<\/title>/g)?.slice(1, 30) || [];
    const descriptions = text.match(/<description>(.*?)<\/description>/g)?.slice(1, 30) || [];
    
    const combined = titles.map((t, i) => ({
      title: t.replace(/<[^>]+>/g, '').trim(),
      desc: descriptions[i]?.replace(/<[^>]+>/g, '').trim() || ''
    }));
    
    const filtered = combined
      .filter(({ title, desc }) => {
        const lower = (title + ' ' + desc).toLowerCase();
        return KEYWORDS.some(k => lower.includes(k.toLowerCase()));
      })
      .map(({ title }) => title)
      .slice(0, 10);
    
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

