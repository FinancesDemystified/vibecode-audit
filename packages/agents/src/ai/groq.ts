/**
 * Groq LLM analysis agent
 * Dependencies: groq-sdk, @vibecode-audit/shared
 * Purpose: Analyze findings and generate security score with recommendations
 */
import Groq from 'groq-sdk';
import type { Finding, Analysis } from '@vibecode-audit/shared';
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
              'You are a security expert. Analyze security findings and provide scores (1-10), summaries, and actionable recommendations for solo founders.',
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

  const prompt = `Analyze these security findings for a web application:

Findings:
${findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.type}: ${f.evidence}`).join('\n')}

Technologies detected: ${data.technologies.join(', ') || 'Unknown'}

Provide:
1. Security score (1-10, where 10 is most secure)
2. Brief summary (2-3 sentences)
3. Top 5 prioritized recommendations with effort level (low/medium/high)
4. Confidence level (0-1)

Format as JSON: {score: number, summary: string, recommendations: [{priority: string, action: string, effort: string}], confidence: number}`;

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

