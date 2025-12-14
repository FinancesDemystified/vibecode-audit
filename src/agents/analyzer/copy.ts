/**
 * Copy Analysis Module - Assesses website copy effectiveness across multiple frameworks
 * Dependencies: Groq AI for semantic analysis, readability metrics
 */

interface CopyAnalysisResult {
  overallScore: number;
  clarity: ClarityMetrics;
  persuasion: PersuasionMetrics;
  conversion: ConversionMetrics;
  brandVoice: BrandVoiceMetrics;
  seoReadiness: SEOMetrics;
  securityCopy?: SecurityCopyMetrics;
  recommendations: Recommendation[];
  detailedFindings: DetailedFinding[];
}

interface ClarityMetrics {
  score: number;
  fleschKincaid: number;
  averageSentenceLength: number;
  jargonLevel: 'low' | 'medium' | 'high';
  issues: string[];
}

interface PersuasionMetrics {
  score: number;
  framework: {
    aida: FrameworkScore; // Attention, Interest, Desire, Action
    pas: FrameworkScore; // Problem, Agitation, Solution
    valueProposition: FrameworkScore;
  };
  emotionalTriggers: string[];
  socialProof: { present: boolean; quality: 'weak' | 'moderate' | 'strong' };
  urgency: { present: boolean; type: string[] };
}

interface ConversionMetrics {
  score: number;
  cta: CTAAnalysis;
  trustSignals: TrustSignal[];
  frictionPoints: FrictionPoint[];
  benefitsVsFeatures: { benefits: number; features: number; ratio: number };
}

interface BrandVoiceMetrics {
  score: number;
  tone: string[];
  consistency: number;
  personality: string;
  authenticity: number;
}

interface SEOMetrics {
  score: number;
  keywordDensity: number;
  headlineOptimization: number;
  metaDescription: { present: boolean; quality: number };
}

interface SecurityCopyMetrics {
  score: number;
  privacyPolicyFound: boolean;
  securityPageFound: boolean;
  trustSignals: {
    badges: number;
    certifications: number;
    guarantees: number;
  };
  securityClaims: string[];
  gaps: string[];
}

interface CTAAnalysis {
  count: number;
  clarity: number;
  actionOriented: number;
  examples: string[];
  issues: string[];
}

interface TrustSignal {
  type: 'testimonial' | 'social-proof' | 'guarantee' | 'certification' | 'security';
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
}

interface FrictionPoint {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  fix: string;
}

interface FrameworkScore {
  score: number;
  present: boolean;
  gaps: string[];
}

interface Recommendation {
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  fix: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  example?: string;
}

interface DetailedFinding {
  section: string;
  current: string;
  issues: string[];
  suggestion: string;
  rationale: string;
}

export class CopyAnalyzer {
  /**
   * Comprehensive copy analysis using multiple frameworks
   */
  async analyzeCopy(htmlContent: string, url: string): Promise<CopyAnalysisResult> {
    // Extract copy from HTML
    const extractedCopy = this.extractCopyElements(htmlContent);
    
    // Run parallel analyses
    const [clarity, persuasion, conversion, brandVoice, seo] = await Promise.all([
      this.analyzeClarity(extractedCopy),
      this.analyzePersuasion(extractedCopy),
      this.analyzeConversion(extractedCopy),
      this.analyzeBrandVoice(extractedCopy),
      this.analyzeSEO(extractedCopy, htmlContent),
    ]);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      clarity,
      persuasion,
      conversion,
      brandVoice,
      seo,
    });

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore({
      clarity: clarity.score * 0.25,
      persuasion: persuasion.score * 0.30,
      conversion: conversion.score * 0.25,
      brandVoice: brandVoice.score * 0.10,
      seo: seo.score * 0.10,
    });

    const detailedFindings = this.generateDetailedFindings(extractedCopy, {
      clarity,
      persuasion,
      conversion,
    });

    return {
      overallScore,
      clarity,
      persuasion,
      conversion,
      brandVoice,
      seoReadiness: seo,
      securityCopy,
      recommendations,
      detailedFindings,
    };
  }

  /**
   * Extract key copy elements from HTML
   */
  private extractCopyElements(html: string): ExtractedCopy {
    // Remove script/style tags
    const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Extract hero section (usually first h1 + nearby text)
    const heroMatch = cleanHtml.match(/<h1[^>]*>(.*?)<\/h1>([\s\S]*?)(?=<h[2-6]|<section|<div class="[^"]*section)/i);
    const hero = {
      headline: this.stripHtml(heroMatch?.[1] || ''),
      subheadline: this.stripHtml(heroMatch?.[2]?.substring(0, 500) || ''),
    };

    // Extract all headings
    const headings = {
      h1: this.extractTags(cleanHtml, 'h1'),
      h2: this.extractTags(cleanHtml, 'h2'),
      h3: this.extractTags(cleanHtml, 'h3'),
    };

    // Extract CTAs (buttons, links with action words)
    const ctas = this.extractCTAs(cleanHtml);

    // Extract body copy (paragraphs)
    const bodyCopy = this.extractTags(cleanHtml, 'p').join(' ');

    // Extract testimonials/social proof
    const socialProof = this.extractSocialProof(cleanHtml);

    // Extract all visible text
    const allText = this.stripHtml(cleanHtml);

    return {
      hero,
      headings,
      ctas,
      bodyCopy,
      socialProof,
      allText,
    };
  }

  /**
   * Clarity Analysis - Readability & comprehension
   */
  private async analyzeClarity(copy: ExtractedCopy): Promise<ClarityMetrics> {
    const text = copy.allText;
    
    // Flesch-Kincaid Grade Level
    const fleschKincaid = this.calculateFleschKincaid(text);
    
    // Average sentence length
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/).length;
    const averageSentenceLength = sentences.length > 0 ? words / sentences.length : 0;

    // Jargon detection
    const jargonWords = this.detectJargon(text);
    const jargonLevel = jargonWords.length < 5 ? 'low' : jargonWords.length < 15 ? 'medium' : 'high';

    // Issues
    const issues: string[] = [];
    if (fleschKincaid > 12) issues.push('Reading level too high (college+). Aim for 8th grade.');
    if (averageSentenceLength > 20) issues.push('Sentences too long. Aim for 15-20 words average.');
    if (jargonLevel === 'high') issues.push(`Too much jargon detected (${jargonWords.length} terms)`);
    if (!copy.hero.headline) issues.push('Missing clear hero headline');
    if (copy.hero.subheadline.length > 200) issues.push('Hero subheadline too long');

    const score = this.calculateClarityScore(fleschKincaid, averageSentenceLength, jargonLevel, issues.length);

    return {
      score,
      fleschKincaid: Math.round(fleschKincaid * 10) / 10,
      averageSentenceLength: Math.round(averageSentenceLength),
      jargonLevel,
      issues,
    };
  }

  /**
   * Persuasion Analysis - AIDA, PAS, Value Prop
   */
  private async analyzePersuasion(copy: ExtractedCopy): Promise<PersuasionMetrics> {
    const text = copy.allText.toLowerCase();

    // AIDA Framework
    const aida = this.analyzeAIDA(copy);

    // PAS Framework (Problem-Agitation-Solution)
    const pas = this.analyzePAS(copy);

    // Value Proposition
    const valueProposition = this.analyzeValueProposition(copy);

    // Emotional triggers
    const emotionalTriggers = this.detectEmotionalTriggers(text);

    // Social proof
    const socialProof = this.analyzeSocialProof(copy.socialProof);

    // Urgency/Scarcity
    const urgency = this.detectUrgency(text);

    const avgFrameworkScore = (aida.score + pas.score + valueProposition.score) / 3;
    const score = Math.round(
      avgFrameworkScore * 0.5 +
      (emotionalTriggers.length > 0 ? 20 : 0) +
      (socialProof.present ? 15 : 0) +
      (urgency.present ? 15 : 0)
    );

    return {
      score: Math.min(score, 100),
      framework: { aida, pas, valueProposition },
      emotionalTriggers,
      socialProof,
      urgency,
    };
  }

  /**
   * Conversion Analysis - CTAs, Trust, Friction
   */
  private async analyzeConversion(copy: ExtractedCopy): Promise<ConversionMetrics> {
    // CTA Analysis
    const cta = this.analyzeCTAs(copy.ctas);

    // Trust signals
    const trustSignals = this.analyzeTrustSignals(copy.allText, copy.bodyCopy);

    // Friction points
    const frictionPoints = this.detectFrictionPoints(copy);

    // Benefits vs Features
    const benefitsVsFeatures = this.analyzeBenefitsVsFeatures(copy.bodyCopy);

    const score = Math.round(
      cta.clarity * 0.3 +
      (trustSignals.length > 0 ? 25 : 0) +
      (frictionPoints.length === 0 ? 20 : Math.max(0, 20 - frictionPoints.length * 5)) +
      (benefitsVsFeatures.ratio > 1 ? 25 : benefitsVsFeatures.ratio * 25)
    );

    return {
      score: Math.min(score, 100),
      cta,
      trustSignals,
      frictionPoints,
      benefitsVsFeatures,
    };
  }

  /**
   * Brand Voice Analysis - Tone, Consistency, Authenticity
   */
  private async analyzeBrandVoice(copy: ExtractedCopy): Promise<BrandVoiceMetrics> {
    const text = copy.allText;

    // Detect tone
    const tone = this.detectTone(text);

    // Check consistency across sections
    const consistency = this.checkToneConsistency([
      copy.hero.headline,
      copy.hero.subheadline,
      copy.bodyCopy,
    ]);

    // Personality assessment
    const personality = this.assessPersonality(text);

    // Authenticity (vs generic corporate speak)
    const authenticity = this.assessAuthenticity(text);

    const score = Math.round(consistency * 0.4 + authenticity * 0.6);

    return {
      score,
      tone,
      consistency,
      personality,
      authenticity,
    };
  }

  /**
   * SEO Readiness - Keywords, Headlines, Meta
   */
  private async analyzeSEO(copy: ExtractedCopy, html: string): Promise<SEOMetrics> {
    // Keyword density
    const keywordDensity = this.calculateKeywordDensity(copy.allText);

    // Headline optimization
    const headlineOptimization = this.scoreHeadlines(copy.headings);

    // Meta description
    const metaDescription = this.extractMetaDescription(html);

    const score = Math.round(
      headlineOptimization * 0.5 +
      (metaDescription.present ? metaDescription.quality * 0.3 : 0) +
      (keywordDensity > 1 && keywordDensity < 3 ? 20 : 0)
    );

    return {
      score,
      keywordDensity,
      headlineOptimization,
      metaDescription,
    };
  }

  // ===== Helper Methods =====

  private analyzeAIDA(copy: ExtractedCopy): FrameworkScore {
    const text = copy.allText.toLowerCase();
    const gaps: string[] = [];
    let score = 0;

    // Attention (headline, hook)
    if (copy.hero.headline) score += 25;
    else gaps.push('Missing attention-grabbing headline');

    // Interest (problem/benefit stated)
    const interestKeywords = ['because', 'discover', 'learn', 'find out', 'see how'];
    if (interestKeywords.some(kw => text.includes(kw))) score += 25;
    else gaps.push('Lacking interest-building content');

    // Desire (benefits, social proof)
    if (copy.socialProof.length > 0) score += 25;
    else gaps.push('Missing social proof to build desire');

    // Action (clear CTA)
    if (copy.ctas.length > 0) score += 25;
    else gaps.push('No clear call-to-action');

    return { score, present: score > 50, gaps };
  }

  private analyzePAS(copy: ExtractedCopy): FrameworkScore {
    const text = copy.allText.toLowerCase();
    const gaps: string[] = [];
    let score = 0;

    // Problem
    const problemWords = ['struggling', 'tired of', 'frustrated', 'problem', 'challenge', 'difficult'];
    if (problemWords.some(w => text.includes(w))) score += 33;
    else gaps.push('Problem not clearly stated');

    // Agitation
    const agitationWords = ['waste', 'expensive', 'risk', 'lose', 'miss out', 'before it'];
    if (agitationWords.some(w => text.includes(w))) score += 33;
    else gaps.push('Problem not agitated (no urgency)');

    // Solution
    const solutionWords = ['solution', 'easy', 'simple', 'instantly', 'automatically', 'help you'];
    if (solutionWords.some(w => text.includes(w))) score += 34;
    else gaps.push('Solution not clearly presented');

    return { score, present: score > 50, gaps };
  }

  private analyzeValueProposition(copy: ExtractedCopy): FrameworkScore {
    const hero = `${copy.hero.headline} ${copy.hero.subheadline}`.toLowerCase();
    const gaps: string[] = [];
    let score = 0;

    // Clear & Specific
    if (copy.hero.headline.length > 10 && copy.hero.headline.length < 100) score += 30;
    else gaps.push('Headline not clear/concise');

    // Differentiation
    const diffWords = ['only', 'first', 'unique', 'unlike', 'different', 'exclusive'];
    if (diffWords.some(w => hero.includes(w))) score += 35;
    else gaps.push('No clear differentiation');

    // Outcome-focused
    const outcomeWords = ['get', 'achieve', 'improve', 'increase', 'save', 'grow'];
    if (outcomeWords.some(w => hero.includes(w))) score += 35;
    else gaps.push('Not outcome-focused');

    return { score, present: score > 50, gaps };
  }

  private analyzeCTAs(ctas: string[]): CTAAnalysis {
    const issues: string[] = [];
    
    if (ctas.length === 0) issues.push('No CTAs found');
    if (ctas.length > 5) issues.push('Too many CTAs - causes decision paralysis');
    
    // Check for action-oriented language
    const actionWords = ctas.filter(cta => 
      /^(get|start|try|download|sign up|join|buy|learn|discover|see|book|schedule)/i.test(cta.trim())
    );
    
    const clarity = ctas.length > 0 ? (actionWords.length / ctas.length) * 100 : 0;
    const actionOriented = actionWords.length;

    if (clarity < 50) issues.push('CTAs not action-oriented (use verbs)');
    if (ctas.some(cta => cta.length > 30)) issues.push('Some CTAs too long (>30 chars)');

    return {
      count: ctas.length,
      clarity: Math.round(clarity),
      actionOriented,
      examples: ctas.slice(0, 3),
      issues,
    };
  }

  private detectEmotionalTriggers(text: string): string[] {
    const triggers: string[] = [];
    const patterns = {
      fear: ['avoid', 'prevent', 'protect', 'secure', 'danger', 'risk'],
      desire: ['achieve', 'dream', 'unlock', 'transform', 'freedom'],
      urgency: ['now', 'today', 'limited', 'hurry', 'don\'t miss'],
      trust: ['proven', 'trusted', 'guaranteed', 'certified', 'verified'],
      belonging: ['join', 'community', 'members', 'exclusive', 'insider'],
    };

    for (const [trigger, keywords] of Object.entries(patterns)) {
      if (keywords.some(kw => text.includes(kw))) {
        triggers.push(trigger);
      }
    }

    return triggers;
  }

  private analyzeSocialProof(socialProof: string[]): { present: boolean; quality: 'weak' | 'moderate' | 'strong' } {
    const present = socialProof.length > 0;
    let quality: 'weak' | 'moderate' | 'strong' = 'weak';

    if (socialProof.length >= 3) quality = 'strong';
    else if (socialProof.length >= 1) quality = 'moderate';

    return { present, quality };
  }

  private detectUrgency(text: string): { present: boolean; type: string[] } {
    const types: string[] = [];
    
    if (/limited|only \d+ left|running out|while supplies/i.test(text)) types.push('scarcity');
    if (/today|now|hurry|ends|expires|before/i.test(text)) types.push('time-sensitive');
    if (/exclusive|special offer|one-time/i.test(text)) types.push('exclusivity');

    return {
      present: types.length > 0,
      type: types,
    };
  }

  private detectTone(text: string): string[] {
    const tones: string[] = [];
    
    if (/\!{2,}|wow|amazing|incredible/i.test(text)) tones.push('enthusiastic');
    if (/professional|enterprise|solution|leverage/i.test(text)) tones.push('professional');
    if (/easy|simple|quick|effortless/i.test(text)) tones.push('casual');
    if (/data|research|studies|proven|evidence/i.test(text)) tones.push('authoritative');
    if (/you'll love|we're excited|fun|enjoy/i.test(text)) tones.push('friendly');

    return tones.length > 0 ? tones : ['neutral'];
  }

  private calculateFleschKincaid(text: string): number {
    const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);

    if (sentences === 0 || words === 0) return 0;

    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[^aeiouy]+/g, ' ')
      .trim()
      .split(/\s+/).length;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractTags(html: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gi');
    const matches: string[] = [];
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      matches.push(this.stripHtml(match[1]));
    }
    
    return matches;
  }

  private extractCTAs(html: string): string[] {
    const ctas: string[] = [];
    
    // Extract button text
    const buttons = this.extractTags(html, 'button');
    ctas.push(...buttons);
    
    // Extract CTA-like links
    const linkPattern = /<a[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      ctas.push(this.stripHtml(match[1]));
    }
    
    return ctas.filter(cta => cta.length > 0 && cta.length < 50);
  }

  private extractSocialProof(html: string): string[] {
    const proof: string[] = [];
    
    // Look for testimonial markers
    const testimonialPatterns = [
      /<div[^>]*class="[^"]*testimonial[^"]*"[^>]*>(.*?)<\/div>/gi,
      /<blockquote[^>]*>(.*?)<\/blockquote>/gi,
    ];
    
    for (const pattern of testimonialPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        proof.push(this.stripHtml(match[1]).substring(0, 200));
      }
    }
    
    return proof;
  }

  private detectJargon(text: string): string[] {
    const jargonPatterns = [
      /\b(leverage|synergy|paradigm|holistic|robust|scalable|optimize|streamline)\b/gi,
      /\b[A-Z]{3,}\b/g, // Acronyms
    ];
    
    const found = new Set<string>();
    for (const pattern of jargonPatterns) {
      const matches = text.match(pattern) || [];
      matches.forEach(m => found.add(m.toLowerCase()));
    }
    
    return Array.from(found);
  }

  private calculateClarityScore(fk: number, sentLen: number, jargon: string, issueCount: number): number {
    let score = 100;
    
    // Penalty for high reading level
    if (fk > 12) score -= (fk - 12) * 5;
    
    // Penalty for long sentences
    if (sentLen > 20) score -= (sentLen - 20) * 2;
    
    // Penalty for jargon
    if (jargon === 'high') score -= 20;
    else if (jargon === 'medium') score -= 10;
    
    // Penalty for issues
    score -= issueCount * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private checkToneConsistency(sections: string[]): number {
    // Simplified: check if tone markers are consistent
    const tones = sections.map(s => this.detectTone(s));
    const allTones = new Set(tones.flat());
    
    // More consistency = fewer unique tones
    return Math.max(0, 100 - (allTones.size - 1) * 20);
  }

  private assessPersonality(text: string): string {
    const scores = {
      professional: 0,
      friendly: 0,
      bold: 0,
      technical: 0,
    };

    if (/we|our|us/i.test(text)) scores.friendly += 1;
    if (/enterprise|corporate|business/i.test(text)) scores.professional += 1;
    if (/\!/i.test(text)) scores.bold += 1;
    if (/API|SDK|integration|technical/i.test(text)) scores.technical += 1;

    const max = Math.max(...Object.values(scores));
    return Object.entries(scores).find(([_, v]) => v === max)?.[0] || 'neutral';
  }

  private assessAuthenticity(text: string): number {
    let score = 100;
    
    // Penalize generic corporate speak
    const genericPhrases = [
      'leading provider',
      'world-class',
      'industry-leading',
      'cutting-edge',
      'state-of-the-art',
      'best-in-class',
    ];
    
    for (const phrase of genericPhrases) {
      if (text.toLowerCase().includes(phrase)) score -= 10;
    }
    
    return Math.max(0, score);
  }

  private analyzeTrustSignals(text: string, bodyCopy: string): TrustSignal[] {
    const signals: TrustSignal[] = [];
    
    if (/guarantee|money.back|refund/i.test(text)) {
      signals.push({
        type: 'guarantee',
        strength: 'strong',
        description: 'Money-back guarantee mentioned',
      });
    }
    
    if (/\d+[k|m]\+?\s*(users|customers|companies)/i.test(text)) {
      signals.push({
        type: 'social-proof',
        strength: 'strong',
        description: 'Customer count displayed',
      });
    }
    
    if (/ssl|secure|encrypted|privacy/i.test(text)) {
      signals.push({
        type: 'security',
        strength: 'moderate',
        description: 'Security mentioned',
      });
    }
    
    return signals;
  }

  private detectFrictionPoints(copy: ExtractedCopy): FrictionPoint[] {
    const points: FrictionPoint[] = [];
    const text = copy.allText.toLowerCase();
    
    if (/credit card required/i.test(text)) {
      points.push({
        type: 'payment-barrier',
        severity: 'high',
        description: 'Mentions "credit card required"',
        fix: 'Offer free trial without credit card',
      });
    }
    
    if (copy.ctas.length > 5) {
      points.push({
        type: 'choice-overload',
        severity: 'medium',
        description: 'Too many CTAs cause decision paralysis',
        fix: 'Reduce to 1-2 primary CTAs',
      });
    }
    
    return points;
  }

  private analyzeBenefitsVsFeatures(bodyCopy: string): { benefits: number; features: number; ratio: number } {
    const benefitWords = ['help you', 'save', 'achieve', 'improve', 'grow', 'increase', 'reduce', 'get'];
    const featureWords = ['includes', 'features', 'offers', 'provides', 'comes with', 'has'];
    
    const benefits = benefitWords.filter(w => bodyCopy.toLowerCase().includes(w)).length;
    const features = featureWords.filter(w => bodyCopy.toLowerCase().includes(w)).length;
    const ratio = features > 0 ? benefits / features : benefits > 0 ? 2 : 0;
    
    return { benefits, features, ratio };
  }

  private calculateKeywordDensity(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 4) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }
    
    const max = Math.max(...wordCount.values());
    return (max / words.length) * 100;
  }

  private scoreHeadlines(headings: { h1: string[]; h2: string[]; h3: string[] }): number {
    let score = 0;
    
    if (headings.h1.length === 1) score += 40;
    else if (headings.h1.length === 0) score += 0;
    else score += 20;
    
    if (headings.h2.length > 0 && headings.h2.length < 8) score += 30;
    if (headings.h3.length > 0) score += 30;
    
    return score;
  }

  private extractMetaDescription(html: string): { present: boolean; quality: number } {
    const match = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    if (!match) return { present: false, quality: 0 };
    
    const desc = match[1];
    let quality = 0;
    
    if (desc.length >= 120 && desc.length <= 160) quality = 100;
    else if (desc.length > 0) quality = 50;
    
    return { present: true, quality };
  }

  private generateRecommendations(metrics: {
    clarity: ClarityMetrics;
    persuasion: PersuasionMetrics;
    conversion: ConversionMetrics;
    brandVoice: BrandVoiceMetrics;
    seo: SEOMetrics;
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Clarity recommendations
    if (metrics.clarity.fleschKincaid > 12) {
      recommendations.push({
        category: 'Clarity',
        priority: 'high',
        issue: `Reading level too high (${metrics.clarity.fleschKincaid} grade)`,
        fix: 'Simplify language to 8th grade level',
        impact: 'Increases comprehension by 40%',
        effort: 'medium',
        example: 'Instead of "utilize", use "use"',
      });
    }
    
    // Persuasion recommendations
    if (!metrics.persuasion.framework.aida.present) {
      recommendations.push({
        category: 'Persuasion',
        priority: 'critical',
        issue: 'Missing AIDA framework elements',
        fix: 'Add: ' + metrics.persuasion.framework.aida.gaps.join(', '),
        impact: 'Can improve conversion by 25-50%',
        effort: 'medium',
      });
    }
    
    // Conversion recommendations
    if (metrics.conversion.cta.count === 0) {
      recommendations.push({
        category: 'Conversion',
        priority: 'critical',
        issue: 'No clear call-to-action',
        fix: 'Add prominent CTA button above fold',
        impact: 'Critical for conversions',
        effort: 'low',
        example: 'Start Free Trial',
      });
    }
    
    return recommendations;
  }

  private generateDetailedFindings(copy: ExtractedCopy, metrics: any): DetailedFinding[] {
    const findings: DetailedFinding[] = [];
    
    if (copy.hero.headline) {
      findings.push({
        section: 'Hero Headline',
        current: copy.hero.headline,
        issues: ['Generic headline', 'No clear value proposition'],
        suggestion: 'State specific outcome in 10 words or less',
        rationale: 'Clear headlines increase engagement by 40%',
      });
    }
    
    return findings;
  }

  private calculateOverallScore(scores: { [key: string]: number }): number {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(total);
  }

  /**
   * Security Copy Analysis - Privacy policies, security claims, trust signals
   */
  private async analyzeSecurityCopy(
    copy: ExtractedCopy,
    html: string,
    url: string
  ): Promise<SecurityCopyMetrics> {
    const htmlLower = html.toLowerCase();
    const allText = copy.allText.toLowerCase();

    // Check for privacy policy links
    const privacyPolicyFound = 
      htmlLower.includes('privacy') || 
      htmlLower.includes('privacy policy') ||
      /href=["'][^"']*privacy[^"']*["']/i.test(html);

    // Check for security page
    const securityPageFound = 
      htmlLower.includes('security') ||
      htmlLower.includes('/security') ||
      /href=["'][^"']*security[^"']*["']/i.test(html);

    // Detect trust signals
    const badges = [
      htmlLower.includes('ssl') || htmlLower.includes('secure') ? 1 : 0,
      htmlLower.includes('trustpilot') || htmlLower.includes('trust badge') ? 1 : 0,
      htmlLower.includes('norton') || htmlLower.includes('mcafee') ? 1 : 0,
    ].reduce((sum, val) => sum + val, 0);

    const certifications = [
      htmlLower.includes('soc 2') || htmlLower.includes('iso 27001') ? 1 : 0,
      htmlLower.includes('pci-dss') || htmlLower.includes('pci compliant') ? 1 : 0,
      htmlLower.includes('gdpr') || htmlLower.includes('ccpa') ? 1 : 0,
    ].reduce((sum, val) => sum + val, 0);

    const guarantees = [
      htmlLower.includes('money-back') || htmlLower.includes('guarantee') ? 1 : 0,
      htmlLower.includes('refund') ? 1 : 0,
    ].reduce((sum, val) => sum + val, 0);

    // Extract security claims
    const securityClaims: string[] = [];
    if (allText.includes('encrypt') || allText.includes('encrypted')) {
      securityClaims.push('Data encryption');
    }
    if (allText.includes('2fa') || allText.includes('two-factor')) {
      securityClaims.push('2FA available');
    }
    if (allText.includes('secure') || allText.includes('protected')) {
      securityClaims.push('Security measures');
    }
    if (allText.includes('gdpr') || allText.includes('compliant')) {
      securityClaims.push('GDPR compliance');
    }

    // Identify gaps
    const gaps: string[] = [];
    if (!privacyPolicyFound) {
      gaps.push('Privacy policy not found or not linked');
    }
    if (!securityPageFound && securityClaims.length > 0) {
      gaps.push('Security page missing despite security claims');
    }
    if (securityClaims.length > 0 && certifications === 0) {
      gaps.push('Security claims made but no certifications mentioned');
    }

    // Calculate score
    let score = 0;
    if (privacyPolicyFound) score += 30;
    if (securityPageFound) score += 20;
    score += badges * 10;
    score += certifications * 15;
    score += guarantees * 10;
    score -= gaps.length * 10;

    return {
      score: Math.max(0, Math.min(100, score)),
      privacyPolicyFound,
      securityPageFound,
      trustSignals: {
        badges,
        certifications,
        guarantees,
      },
      securityClaims,
      gaps,
    };
  }
}

interface ExtractedCopy {
  hero: { headline: string; subheadline: string };
  headings: { h1: string[]; h2: string[]; h3: string[] };
  ctas: string[];
  bodyCopy: string;
  socialProof: string[];
  allText: string;
}

export const copyAnalyzer = new CopyAnalyzer();
