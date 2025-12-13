/**
 * URL crawler using Playwright
 * Dependencies: playwright, @vibecode-audit/shared
 * Purpose: Crawl URL and extract HTML, headers, status codes
 */
import { chromium, type Browser, type Page } from 'playwright';
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

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const jsErrors: string[] = [];
  const redirects: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      jsErrors.push(msg.text());
    }
  });

  try {
    const response = await Promise.race([
      page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 30s')), 30000)
      ),
    ]) as any;

    await eventBus.publish(jobId, {
      type: 'agent.progress',
      agent: 'scanner.crawler',
      jobId,
      timestamp: Date.now(),
      progress: 50,
      message: 'Page loaded, extracting content',
    });

    const html = await page.content();
    const headers = response.headers();
    const statusCode = response.status();
    const finalUrl = page.url();

    const redirectChain = response.request().redirectedFrom();
    if (redirectChain) {
      let current = redirectChain;
      while (current) {
        redirects.push(current.url());
        current = current.redirectedFrom();
      }
    }

    await eventBus.publish(jobId, {
      type: 'agent.completed',
      agent: 'scanner.crawler',
      jobId,
      timestamp: Date.now(),
      data: { statusCode, finalUrl },
    });

    return {
      html,
      headers,
      statusCode,
      redirects,
      jsErrors,
      finalUrl,
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
  } finally {
    await browser.close();
  }
}

