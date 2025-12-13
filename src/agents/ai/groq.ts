/**
 * Groq LLM analysis agent
 * Dependencies: groq-sdk, @vibecode-audit/shared
 * Purpose: Analyze findings and generate security score with recommendations
 */
import Groq from 'groq-sdk';
import type { Finding, Analysis } from '../../types';
import type { EventBus } from '../communication';
import type { SecurityData } from '../scanner/extractor';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODELS = ['llama-3.1-8b-instant', 'openai/gpt-oss-20b'];

async function callGroqWithRetry(
  prompt: string,
  model: string,
  retries = 3
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a senior security consultant specializing in web application audits for startups and solo founders. Your reports are thorough yet accessible, balancing technical accuracy with practical business guidance. You write in a narrative style that educates while providing actionable recommendations.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });
      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('All retries failed');
}

function ruleBasedScoring(findings: Finding[]): Analysis {
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount = findings.filter((f) => f.severity === 'low').length;

  let score = 10;
  score -= criticalCount * 3;
  score -= highCount * 1.5;
  score -= mediumCount * 0.5;
  score -= lowCount * 0.1;
  score = Math.max(1, Math.min(10, Math.round(score)));

  return {
    score,
    summary: `Found ${findings.length} security issues: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low`,
    recommendations: findings.slice(0, 5).map((f) => ({
      priority: f.severity === 'critical' || f.severity === 'high' ? 'high' : 'medium',
      action: f.recommendation,
      effort: 'medium',
    })),
    confidence: 0.7,
  };
}

export async function analyzeWithAI(
  findings: Finding[],
  data: SecurityData,
  eventBus: EventBus,
  jobId: string
): Promise<Analysis> {
  await eventBus.publish(jobId, {
    type: 'agent.started',
    agent: 'ai.groq',
    jobId,
    timestamp: Date.now(),
  });

  const prompt = `You are an expert security auditor analyzing a web application for a solo founder. Write in a professional yet accessible narrative style, similar to a consulting report.

Context:
- URL scanned: External black-box analysis only (no codebase access)
- Tech Stack: ${data.techStack.framework || 'Likely static site or SSG (framework not identified)'} ${data.techStack.hosting ? `on ${data.techStack.hosting}` : data.techStack.server ? ` (server: ${data.techStack.server})` : ''}${data.techStack.platform ? ` (built with ${data.techStack.platform})` : ''}
- Technologies: ${data.technologies.length > 0 ? data.technologies.join(', ') : 'Minimal JavaScript detected (likely static site)'}
- Auth Flow: ${data.authFlow.hasLoginForm ? 'Login form detected' : data.authFlow.oauthProviders.length > 0 ? 'OAuth authentication detected (no traditional login form)' : 'No authentication mechanisms detected (public site or auth not accessible)'}${data.authFlow.oauthProviders.length > 0 ? ` with ${data.authFlow.oauthProviders.join(', ')} OAuth` : ''}${data.authFlow.authEndpoints.length > 0 ? ` (auth endpoints: ${data.authFlow.authEndpoints.slice(0, 3).join(', ')})` : ''}

Security Findings:
${findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.type}: ${f.evidence}\n   Recommendation: ${f.recommendation}`).join('\n\n')}

Your task:
1. **Security Score (1-10)**: Rate overall security posture
2. **Executive Summary**: 2-3 sentences explaining the key issues and context (mention the tech stack, what's good, what needs work). NEVER say "Not detected" - instead provide inferences like "likely static site", "appears to be a [framework]", or "authentication not accessible from public pages"
3. **Detailed Recommendations**: Provide 5 specific, actionable recommendations with:
   - Priority (High/Medium/Low)
   - Action (specific step to take)
   - Effort (Low/Medium/High)
4. **Confidence**: Your confidence in this assessment (0-1)

Write in a tone that's authoritative but encouraging—these are solo founders who need guidance, not criticism.
IMPORTANT: Never use phrases like "Not detected" or "Unknown". Instead, provide intelligent inferences based on available evidence (e.g., "likely static site", "appears to use SSG", "authentication not accessible from public pages").

Format as JSON: 
{
  "score": number,
  "summary": "string (narrative style, mention tech stack with inferences, never say 'Not detected')",
  "recommendations": [
    {"priority": "High|Medium|Low", "action": "specific actionable step", "effort": "Low|Medium|High"}
  ],
  "confidence": number
}`;

  try {
    await eventBus.publish(jobId, {
      type: 'agent.progress',
      agent: 'ai.groq',
      jobId,
      timestamp: Date.now(),
      progress: 30,
      message: 'Calling Groq API',
    });

    let response = '';
    let model = PRIMARY_MODEL;

    try {
      response = await callGroqWithRetry(prompt, model);
    } catch (error) {
      await eventBus.publish(jobId, {
        type: 'agent.progress',
        agent: 'ai.groq',
        jobId,
        timestamp: Date.now(),
        progress: 50,
        message: 'Primary model failed, trying fallback',
      });

      for (const fallback of FALLBACK_MODELS) {
        try {
          response = await callGroqWithRetry(prompt, fallback);
          model = fallback;
          break;
        } catch {
          continue;
        }
      }

      if (!response) {
        throw new Error('All models failed');
      }
    }

    await eventBus.publish(jobId, {
      type: 'agent.progress',
      agent: 'ai.groq',
      jobId,
      timestamp: Date.now(),
      progress: 80,
      message: 'Parsing response',
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const analysis: Analysis = {
        score: Math.max(1, Math.min(10, parsed.score || 5)),
        summary: parsed.summary || 'Security analysis completed',
        recommendations: parsed.recommendations || [],
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.8)),
      };

      await eventBus.publish(jobId, {
        type: 'agent.completed',
        agent: 'ai.groq',
        jobId,
        timestamp: Date.now(),
        data: { score: analysis.score, model },
      });

      return analysis;
    }

    throw new Error('Invalid JSON response');
  } catch (error) {
    await eventBus.publish(jobId, {
      type: 'agent.failed',
      agent: 'ai.groq',
      jobId,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return ruleBasedScoring(findings);
  }
}

