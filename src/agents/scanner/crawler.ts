/**
 * URL crawler using native fetch
 * Dependencies: @vibecode-audit/shared
 * Purpose: Crawl URL and extract HTML, headers, status codes
 */
import type { AgentEvent } from '../../types';
import type { EventBus } from '../communication';

export interface CrawlResult {
  html: string;
  headers: Record<string, string>;
  statusCode: number;
  redirects: string[];
  jsErrors: string[];
  finalUrl: string;
  techStack: {
    server?: string;
    framework?: string;
    hosting?: string;
    platform?: string;
    scripts: string[];
    metaTags: Record<string, string>;
  };
}

async function fetchWithRedirects(url: string, maxRedirects = 10): Promise<{ response: Response; redirects: string[] }> {
  const redirects: string[] = [];
  let currentUrl = url;
  
  for (let i = 0; i < maxRedirects; i++) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'VibeCode-Audit/1.0',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        redirects.push(currentUrl);
        currentUrl = new URL(location, currentUrl).href;
        continue;
      }
    }

    if (response.status >= 200 && response.status < 300) {
      const finalResponse = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'VibeCode-Audit/1.0',
        },
      });
      return { response: finalResponse, redirects };
    }

    return { response, redirects };
  }

  throw new Error('Too many redirects');
}

function extractTechStack(html: string, headers: Record<string, string>, url: string): CrawlResult['techStack'] {
  const scripts: string[] = [];
  const metaTags: Record<string, string> = {};
  
  // Extract scripts
  const scriptRegex = /<script[^>]*src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  
  // Extract meta tags
  const metaRegex = /<meta\s+name=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
  while ((match = metaRegex.exec(html)) !== null) {
    metaTags[match[1]] = match[2];
  }
  
  // Detect server
  const server = headers['server'] || headers['x-powered-by'];
  
  // Detect framework
  let framework: string | undefined;
  const htmlLower = html.toLowerCase();
  
  // Next.js
  if (html.includes('__NEXT_DATA__') || scripts.some(s => s.includes('_next') || s.includes('/_next/'))) {
    framework = 'Next.js';
  }
  // Nuxt.js
  else if (html.includes('__NUXT__') || scripts.some(s => s.includes('_nuxt') || s.includes('/_nuxt/'))) {
    framework = 'Nuxt.js';
  }
  // Gatsby
  else if (html.includes('__GATSBY') || scripts.some(s => s.includes('gatsby') || s.includes('/gatsby/'))) {
    framework = 'Gatsby';
  }
  // Astro
  else if (html.includes('__ASTRO') || scripts.some(s => s.includes('/_astro/') || s.includes('astro'))) {
    framework = 'Astro';
  }
  // SvelteKit
  else if (html.includes('__svelte') || scripts.some(s => s.includes('/_app/') || s.includes('svelte'))) {
    framework = 'SvelteKit';
  }
  // Remix
  else if (scripts.some(s => s.includes('remix') || s.includes('/build/'))) {
    framework = 'Remix';
  }
  // Svelte
  else if (html.includes('svelte-') || scripts.some(s => s.includes('svelte'))) {
    framework = 'Svelte';
  }
  // 11ty/Eleventy
  else if (metaTags['generator']?.includes('eleventy') || metaTags['generator']?.includes('11ty')) {
    framework = '11ty';
  }
  // Hugo
  else if (metaTags['generator']?.includes('hugo') || html.includes('hugo')) {
    framework = 'Hugo';
  }
  // Jekyll
  else if (metaTags['generator']?.includes('jekyll') || html.includes('jekyll')) {
    framework = 'Jekyll';
  }
  // React (generic)
  else if (html.includes('data-react-helmet') || scripts.some(s => s.includes('react') || s.includes('react-dom'))) {
    framework = 'React';
  }
  // Vue.js
  else if (html.includes('data-vue') || html.includes('v-cloak') || scripts.some(s => s.includes('vue'))) {
    framework = 'Vue.js';
  }
  // Angular
  else if (html.includes('ng-version') || scripts.some(s => s.includes('angular'))) {
    framework = 'Angular';
  }
  // SolidJS
  else if (scripts.some(s => s.includes('solid')) || html.includes('solid-')) {
    framework = 'SolidJS';
  }
  // Infer static site if minimal JS and no framework detected
  else {
    const scriptCount = scripts.length;
    const hasMinimalJS = scriptCount <= 2 && !html.includes('__') && !html.includes('data-react');
    if (hasMinimalJS) {
      framework = 'Static Site (likely SSG)';
    }
  }
  
  // Detect hosting/platform
  let hosting: string | undefined;
  let platform: string | undefined;
  
  if (url.includes('.vercel.app') || headers['x-vercel-id']) {
    hosting = 'Vercel';
  } else if (url.includes('.netlify.app') || headers['x-nf-request-id']) {
    hosting = 'Netlify';
  } else if (headers['x-amz-cf-id']) {
    hosting = 'AWS CloudFront';
  } else if (headers['x-azure-ref']) {
    hosting = 'Azure';
  }
  
  // Detect no-code platforms
  if (scripts.some(s => s.includes('bubble.io')) || html.includes('bubble-element')) {
    platform = 'Bubble.io';
  } else if (scripts.some(s => s.includes('webflow.')) || html.includes('w-tab')) {
    platform = 'Webflow';
  } else if (scripts.some(s => s.includes('replit.')) || url.includes('.replit.')) {
    platform = 'Replit';
  } else if (url.includes('.bolt.') || metaTags['generator']?.includes('bolt')) {
    platform = 'Bolt.new';
  } else if (metaTags['generator']?.includes('lovable')) {
    platform = 'Lovable';
  } else if (scripts.some(s => s.includes('framer')) || html.includes('framer')) {
    platform = 'Framer';
  } else if (scripts.some(s => s.includes('wix.com')) || html.includes('wix-static')) {
    platform = 'Wix';
  } else if (scripts.some(s => s.includes('squarespace')) || html.includes('squarespace')) {
    platform = 'Squarespace';
  } else if (html.includes('wp-content') || scripts.some(s => s.includes('wp-includes'))) {
    platform = 'WordPress';
  } else if (scripts.some(s => s.includes('shopify')) || html.includes('shopify')) {
    platform = 'Shopify';
  }
  
  return { server, framework, hosting, platform, scripts, metaTags };
}

export async function crawlUrl(
  url: string,
  eventBus: EventBus,
  jobId: string
): Promise<CrawlResult> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'scanner.crawler',
    jobId,
    timestamp: Date.now(),
  });

  try {
    const { response, redirects } = await fetchWithRedirects(url);
    const html = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Extract tech stack indicators
    const techStack = extractTechStack(html, headers, response.url);

    await eventBus.publish(jobId, {
      type: 'agent.progress',
      agent: 'scanner.crawler',
      jobId,
      timestamp: Date.now(),
      progress: 50,
      message: 'Page loaded, extracting content',
    });

    await eventBus.publish(jobId, {
      type: 'agent.completed',
      agent: 'scanner.crawler',
      jobId,
      timestamp: Date.now(),
      data: { statusCode: response.status, finalUrl: response.url, techStack },
    });

    return {
      html,
      headers,
      statusCode: response.status,
      redirects,
      jsErrors: [],
      finalUrl: response.url,
      techStack,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await eventBus.publish(jobId, {
      type: 'agent.failed',
      agent: 'scanner.crawler',
      jobId,
      timestamp: Date.now(),
      error: errorMessage,
    });

    return {
      html: '',
      headers: {},
      statusCode: 0,
      redirects: [],
      jsErrors: [errorMessage],
      finalUrl: url,
      techStack: { scripts: [], metaTags: {} },
    };
  }
}
