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

  const summary = findings.length > 0
    ? `Found ${findings.length} concrete security issues: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low`
    : 'No concrete security vulnerabilities detected in this scan.';

  return {
    score,
    summary,
    recommendations: findings.length > 0
      ? findings.slice(0, 5).map((f) => ({
          priority: f.severity === 'critical' || f.severity === 'high' ? 'high' : f.severity === 'medium' ? 'medium' : 'low',
          action: f.recommendation,
          effort: 'medium',
        }))
      : [
          { priority: 'medium', action: 'Implement HSTS header for HTTPS enforcement', effort: 'low' },
          { priority: 'medium', action: 'Add Content-Security-Policy header to prevent XSS', effort: 'medium' },
          { priority: 'low', action: 'Review and implement additional OWASP security headers', effort: 'low' },
        ],
    confidence: findings.length > 0 ? 0.9 : 0.7,
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

  const prompt = `You are an expert security auditor analyzing a web application. Base your analysis ONLY on concrete findings - no inference or speculation.

Context:
- URL scanned: External black-box analysis only (no codebase access)
- Tech Stack: ${data.techStack.framework || 'Unknown'} ${data.techStack.hosting ? `on ${data.techStack.hosting}` : ''}${data.techStack.platform ? ` (built with ${data.techStack.platform})` : ''}
- Technologies: ${data.technologies.length > 0 ? data.technologies.join(', ') : 'None detected'}
- Auth Flow: ${data.authFlow.hasLoginForm ? 'Login form detected' : data.authFlow.oauthProviders.length > 0 ? `OAuth detected: ${data.authFlow.oauthProviders.join(', ')}` : 'No auth mechanisms detected'}${data.authFlow.authEndpoints.length > 0 ? ` (endpoints: ${data.authFlow.authEndpoints.slice(0, 3).join(', ')})` : ''}

Security Findings (CONCRETE ONLY - ${findings.length} found):
${findings.length > 0 ? findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.type}: ${f.evidence}\n   Recommendation: ${f.recommendation}`).join('\n\n') : 'No concrete security vulnerabilities detected.'}

Your task:
1. **Security Score (1-10)**: Calculate based ONLY on findings count and severity:
   - Start at 10
   - Critical: -3 each
   - High: -1.5 each
   - Medium: -0.5 each
   - Low: -0.1 each
   - Round to nearest integer, min 1, max 10
2. **Executive Summary**: 2-3 sentences describing the concrete findings. If no findings, state "No concrete security vulnerabilities detected in this scan."
3. **For EACH finding, provide detailed explanation**:
   - **What it means**: Plain English explanation of what this vulnerability is
   - **Why it's a problem**: Real-world impact (what attackers can do, what data can be exposed, business consequences)
   - **Who it affects**: Users, business, compliance, etc.
   - **When it matters**: Under what conditions this becomes critical
4. **Detailed Recommendations**: Generate recommendations ONLY from the findings list above. If no findings, provide 3 general best practices.
5. **Confidence**: 0.9 if findings present, 0.7 if no findings (limited scan scope)

CRITICAL: Only reference concrete findings. Do not infer or speculate about risks not found. For each finding, explain WHY it matters in business terms that non-technical founders can understand.

Format as JSON: 
{
  "score": number,
  "summary": "string (describe concrete findings only)",
  "findingsExplained": [
    {
      "type": "string (matching finding type)",
      "whatItMeans": "plain English explanation",
      "whyItsAProblem": "real-world impact and consequences",
      "whoItAffects": "users/business/compliance",
      "whenItMatters": "conditions when this becomes critical"
    }
  ],
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
        findingsExplained: parsed.findingsExplained || [],
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

