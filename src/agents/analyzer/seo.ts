/**
 * SEO and AI SEO analyzer
 * Dependencies: none
 * Purpose: Audit SEO metadata, structured data, and AI optimization
 */
import type { EventBus } from '../communication';
import type { CrawlResult } from '../scanner/crawler';

export interface SEOData {
  metaTags: {
    title?: string;
    description?: string;
    keywords?: string;
    robots?: string;
    canonical?: string;
    author?: string;
    viewport?: string;
  };
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
  };
  twitterCard: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    creator?: string;
  };
  structuredData: {
    jsonLd: Array<Record<string, any>>;
    microdata: boolean;
    schemaTypes: string[];
  };
  aiOptimization: {
    hasStructuredData: boolean;
    hasFAQ: boolean;
    hasHowTo: boolean;
    hasOrganization: boolean;
    hasArticle: boolean;
    hasProduct: boolean;
    entityRelationships: number;
    contentStructure: {
      hasHeadings: boolean;
      hasLists: boolean;
      hasFAQs: boolean;
      averageParagraphLength: number;
    };
  };
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    recommendation: string;
  }>;
}

export async function analyzeSEO(
  crawl: CrawlResult,
  eventBus: EventBus,
  jobId: string
): Promise<SEOData> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'analyzer.seo',
    jobId,
    timestamp: Date.now(),
  });

  const issues: SEOData['issues'] = [];
  const html = crawl.html;
  const htmlLower = html.toLowerCase();

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.seo',
    jobId,
    timestamp: Date.now(),
    progress: 20,
    message: 'Extracting meta tags',
  });

  // Extract standard meta tags
  const metaTags: SEOData['metaTags'] = {};
  const metaNameRegex = /<meta\s+name=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
  let match;
  while ((match = metaNameRegex.exec(html)) !== null) {
    const name = match[1].toLowerCase();
    const content = match[2];
    if (name === 'title' || name === 'description' || name === 'keywords' || 
        name === 'robots' || name === 'author' || name === 'viewport') {
      metaTags[name as keyof typeof metaTags] = content;
    }
  }

  // Extract title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metaTags.title = titleMatch[1].trim();
  }

  // Extract canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) {
    metaTags.canonical = canonicalMatch[1];
  }

  // Validate meta tags
  if (!metaTags.title) {
    issues.push({
      type: 'missing-title',
      severity: 'high',
      message: 'Missing <title> tag',
      recommendation: 'Add a unique, descriptive title tag (50-60 characters)',
    });
  } else if (metaTags.title.length > 60) {
    issues.push({
      type: 'title-too-long',
      severity: 'medium',
      message: `Title tag is ${metaTags.title.length} characters (recommended: 50-60)`,
      recommendation: 'Shorten title tag for better display in search results',
    });
  }

  if (!metaTags.description) {
    issues.push({
      type: 'missing-description',
      severity: 'high',
      message: 'Missing meta description',
      recommendation: 'Add a compelling meta description (150-160 characters)',
    });
  } else if (metaTags.description.length > 160) {
    issues.push({
      type: 'description-too-long',
      severity: 'medium',
      message: `Meta description is ${metaTags.description.length} characters (recommended: 150-160)`,
      recommendation: 'Shorten meta description for better display',
    });
  }

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.seo',
    jobId,
    timestamp: Date.now(),
    progress: 40,
    message: 'Extracting Open Graph and Twitter Cards',
  });

  // Extract Open Graph tags
  const openGraph: SEOData['openGraph'] = {};
  const ogRegex = /<meta\s+property=["']og:([^"']+)["']\s+content=["']([^"']+)["']/gi;
  while ((match = ogRegex.exec(html)) !== null) {
    const property = match[1].toLowerCase();
    const content = match[2];
    if (property === 'title') openGraph.title = content;
    else if (property === 'description') openGraph.description = content;
    else if (property === 'image') openGraph.image = content;
    else if (property === 'url') openGraph.url = content;
    else if (property === 'type') openGraph.type = content;
    else if (property === 'site_name') openGraph.siteName = content;
  }

  if (!openGraph.title && !openGraph.description) {
    issues.push({
      type: 'missing-open-graph',
      severity: 'medium',
      message: 'Missing Open Graph tags',
      recommendation: 'Add Open Graph tags (og:title, og:description, og:image) for better social sharing',
    });
  }

  // Extract Twitter Card tags
  const twitterCard: SEOData['twitterCard'] = {};
  const twitterRegex = /<meta\s+name=["']twitter:([^"']+)["']\s+content=["']([^"']+)["']/gi;
  while ((match = twitterRegex.exec(html)) !== null) {
    const property = match[1].toLowerCase();
    const content = match[2];
    if (property === 'card') twitterCard.card = content;
    else if (property === 'title') twitterCard.title = content;
    else if (property === 'description') twitterCard.description = content;
    else if (property === 'image') twitterCard.image = content;
    else if (property === 'creator') twitterCard.creator = content;
  }

  await eventBus.publish(jobId, {
    type: 'agent.progress',
    agent: 'analyzer.seo',
    jobId,
    timestamp: Date.now(),
    progress: 60,
    message: 'Extracting structured data',
  });

  // Extract JSON-LD structured data
  const jsonLd: Array<Record<string, any>> = [];
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        jsonLd.push(...parsed);
      } else {
        jsonLd.push(parsed);
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  // Extract schema types
  const schemaTypes: string[] = [];
  jsonLd.forEach(item => {
    if (item['@type']) {
      const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
      schemaTypes.push(...types);
    }
  });

  // Check for microdata
  const hasMicrodata = html.includes('itemscope') || html.includes('itemtype');

  // AI Optimization analysis
  const hasFAQ = schemaTypes.some(t => t.toLowerCase().includes('faq') || t.toLowerCase().includes('question'));
  const hasHowTo = schemaTypes.some(t => t.toLowerCase().includes('howto'));
  const hasOrganization = schemaTypes.some(t => t.toLowerCase().includes('organization'));
  const hasArticle = schemaTypes.some(t => t.toLowerCase().includes('article'));
  const hasProduct = schemaTypes.some(t => t.toLowerCase().includes('product'));

  // Count entity relationships (internal links with descriptive anchor text)
  const internalLinks = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi) || [];
  const entityRelationships = internalLinks.filter(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    const textMatch = link.match(/>([^<]+)</);
    if (!hrefMatch || !textMatch) return false;
    const href = hrefMatch[1];
    const text = textMatch[1].trim();
    // Count links that are internal and have descriptive text (not just "click here")
    return href.startsWith('/') && text.length > 5 && !text.toLowerCase().match(/^(click|here|more|read)$/i);
  }).length;

  // Analyze content structure
  const hasHeadings = /<h[1-6][^>]*>/i.test(html);
  const hasLists = /<[uo]l[^>]*>/i.test(html);
  const hasFAQs = hasFAQ || htmlLower.includes('frequently asked') || htmlLower.includes('faq');
  
  // Calculate average paragraph length
  const paragraphs = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  const totalLength = paragraphs.reduce((sum, p) => {
    const textMatch = p.match(/>([^<]+)</);
    return sum + (textMatch ? textMatch[1].length : 0);
  }, 0);
  const averageParagraphLength = paragraphs.length > 0 ? Math.round(totalLength / paragraphs.length) : 0;

  if (!jsonLd.length && !hasMicrodata) {
    issues.push({
      type: 'missing-structured-data',
      severity: 'high',
      message: 'No structured data (JSON-LD or microdata) found',
      recommendation: 'Add structured data (Schema.org) to help AI understand your content',
    });
  }

  if (!hasOrganization) {
    issues.push({
      type: 'missing-organization-schema',
      severity: 'medium',
      message: 'Missing Organization schema',
      recommendation: 'Add Organization schema for better entity recognition by AI',
    });
  }

  if (!hasHeadings) {
    issues.push({
      type: 'missing-headings',
      severity: 'medium',
      message: 'No heading tags (h1-h6) found',
      recommendation: 'Add proper heading structure for better content hierarchy',
    });
  }

  if (averageParagraphLength > 200) {
    issues.push({
      type: 'long-paragraphs',
      severity: 'low',
      message: `Average paragraph length is ${averageParagraphLength} characters`,
      recommendation: 'Break up long paragraphs for better AI readability (aim for 100-150 chars)',
    });
  }

  await eventBus.publish(jobId, {
    type: 'agent.completed',
    agent: 'analyzer.seo',
    jobId,
    timestamp: Date.now(),
    data: { issuesCount: issues.length, schemaTypesCount: schemaTypes.length },
  });

  return {
    metaTags,
    openGraph,
    twitterCard,
    structuredData: {
      jsonLd,
      microdata: hasMicrodata,
      schemaTypes: [...new Set(schemaTypes)],
    },
    aiOptimization: {
      hasStructuredData: jsonLd.length > 0 || hasMicrodata,
      hasFAQ,
      hasHowTo,
      hasOrganization,
      hasArticle,
      hasProduct,
      entityRelationships,
      contentStructure: {
        hasHeadings,
        hasLists,
        hasFAQs,
        averageParagraphLength,
      },
    },
    issues,
  };
}

