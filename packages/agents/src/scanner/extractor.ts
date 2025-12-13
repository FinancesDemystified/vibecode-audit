/**
 * Security data extractor
 * Dependencies: @vibecode-audit/shared
 * Purpose: Extract security headers, tech stack, forms from crawl results
 */
import type { EventBus } from '../communication';
import type { CrawlResult } from './crawler';

export interface SecurityData {
  headers: {
    hsts?: string;
    csp?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
    strictTransportSecurity?: string;
  };
  technologies: string[];
  forms: Array<{
    action: string;
    method: string;
    inputs: string[];
  }>;
  cookies: Array<{
    name: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
  }>;
}


export async function extractSecurityData(
  crawl: CrawlResult,
  eventBus: EventBus,
  jobId: string
): Promise<SecurityData> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
  });

  const securityHeaders = {
    hsts: crawl.headers['strict-transport-security'],
    csp: crawl.headers['content-security-policy'],
    xFrameOptions: crawl.headers['x-frame-options'],
    xContentTypeOptions: crawl.headers['x-content-type-options'],
    strictTransportSecurity: crawl.headers['strict-transport-security'],
  };

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
    progress: 30,
    message: 'Parsing headers',
  });

  const technologies: string[] = [];
  if (crawl.html.includes('react') || crawl.html.includes('React')) {
    technologies.push('React');
  }
  if (crawl.html.includes('next.js') || crawl.html.includes('__NEXT_DATA__')) {
    technologies.push('Next.js');
  }
  if (crawl.html.includes('vue') || crawl.html.includes('Vue')) {
    technologies.push('Vue');
  }
  if (crawl.headers['server']) {
    technologies.push(crawl.headers['server']);
  }

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
    progress: 60,
    message: 'Detecting technologies',
  });

  const formRegex = /<form[^>]*action=["']([^"']+)["'][^>]*method=["']([^"']+)["'][^>]*>(.*?)<\/form>/gis;
  const forms: SecurityData['forms'] = [];
  let match;
  while ((match = formRegex.exec(crawl.html)) !== null) {
    const inputRegex = /<input[^>]*name=["']([^"']+)["'][^>]*>/gi;
    const inputs: string[] = [];
    let inputMatch;
    while ((inputMatch = inputRegex.exec(match[3])) !== null) {
      inputs.push(inputMatch[1]);
    }
    forms.push({
      action: match[1],
      method: match[2].toUpperCase(),
      inputs,
    });
  }

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
    progress: 90,
    message: 'Extracting forms',
  });

  const cookieHeader = crawl.headers['set-cookie'];
  const cookies: SecurityData['cookies'] = [];
  if (cookieHeader) {
    const cookieStrings = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
    cookieStrings.forEach((cookieStr) => {
      const parts = cookieStr.split(';');
      const nameValue = parts[0].split('=');
      const cookie: SecurityData['cookies'][0] = {
        name: nameValue[0].trim(),
      };
      parts.slice(1).forEach((part: string) => {
        const trimmed = part.trim().toLowerCase();
        if (trimmed === 'httponly') cookie.httpOnly = true;
        if (trimmed === 'secure') cookie.secure = true;
        if (trimmed.startsWith('samesite=')) {
          cookie.sameSite = trimmed.split('=')[1];
        }
      });
      cookies.push(cookie);
    });
  }

  await eventBus.publish(jobId, {
    type: 'agent.completed',
    agent: 'scanner.extractor',
    jobId,
    timestamp: Date.now(),
    data: { technologies, formsCount: forms.length },
  });

  return {
    headers: securityHeaders,
    technologies,
    forms,
    cookies,
  };
}

