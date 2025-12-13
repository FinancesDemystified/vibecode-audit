/**
 * URL crawler using native fetch
 * Dependencies: @vibecode-audit/shared
 * Purpose: Crawl URL and extract HTML, headers, status codes
 */
import type { AgentEvent } from '@vibecode-audit/shared';
import type { EventBus } from '../communication';

export interface CrawlResult {
  html: string;
  headers: Record<string, string>;
  statusCode: number;
  redirects: string[];
  jsErrors: string[];
  finalUrl: string;
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
      data: { statusCode: response.status, finalUrl: response.url },
    });

    return {
      html,
      headers,
      statusCode: response.status,
      redirects,
      jsErrors: [],
      finalUrl: response.url,
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
    };
  }
}
