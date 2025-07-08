import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIService } from '../interfaces/ai.service.interface';

export interface AIAnalysisRequest {
  jobTitle: string;
  company: string;
  location: string;
  description?: string;
  salary?: string;
  tags?: string;
}

export interface JobClassification {
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';
  requiredSkills: string[];
  remoteType: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown';
  companySize?:
    | 'startup'
    | 'small'
    | 'medium'
    | 'large'
    | 'enterprise'
    | 'unknown';
  confidence: number;
  reasoning: string;
}

export interface AIAnalysisResponse {
  classification: JobClassification;
  marketInsights?: {
    salaryRange?: {
      min: number;
      max: number;
      currency: string;
    };
    marketPosition?: 'below' | 'average' | 'above';
    demandLevel?: 'low' | 'medium' | 'high';
  };
  processingTime: number;
  costEstimate: number;
}

@Injectable()
export class AIService implements IAIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;
  private readonly modelName: string = 'gpt-4o-mini'; // Cost-effective model

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl =
      this.configService.get<string>('OPENAI_BASE_URL') || '';

    if (!this.openaiApiKey) {
      this.logger.warn(
        'OpenAI API key not configured. AI features will be disabled.',
      );
    }
    if (!this.openaiBaseUrl) {
      throw new Error(
        'OpenAI base URL not configured. Please set OPENAI_BASE_URL in your environment.',
      );
    }
  }

  /**
   * Analyze a job posting using AI
   */
  async analyzeJob(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();

    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      this.logger.debug('Analyzing job with AI', {
        jobTitle: request.jobTitle,
        company: request.company,
      });

      const prompt = this.buildAnalysisPrompt(request);
      const response = await this.callOpenAI(prompt);
      const classification = this.parseClassificationResponse(response);

      const processingTime = Date.now() - startTime;
      const costEstimate = this.estimateCost(prompt, response);

      this.logger.log('Job analysis completed', {
        jobTitle: request.jobTitle,
        processingTime,
        costEstimate,
        confidence: classification.confidence,
      });

      return {
        classification,
        processingTime,
        costEstimate,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to analyze job with AI', {
        error: errorMessage,
        jobTitle: request.jobTitle,
      });
      throw new Error(`AI analysis failed: ${errorMessage}`);
    }
  }

  /**
   * Build the analysis prompt for OpenAI
   */
  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    return `Analyze this job posting and provide structured classification:

Job Title: ${request.jobTitle}
Company: ${request.company}
Location: ${request.location}
${request.description ? `Description: ${request.description}` : ''}
${request.salary ? `Salary: ${request.salary}` : ''}
${request.tags ? `Tags: ${request.tags}` : ''}

Please provide a JSON response with the following structure:
{
  "seniorityLevel": "entry|mid|senior|lead|unknown",
  "requiredSkills": ["skill1", "skill2", "skill3"],
  "remoteType": "remote|hybrid|onsite|unknown",
  "jobType": "full-time|part-time|contract|internship|unknown",
  "companySize": "startup|small|medium|large|enterprise|unknown",
  "confidence": 0.85,
  "reasoning": "Brief explanation of classification decisions"
}

Focus on:
- Seniority: Look for keywords like "junior", "senior", "lead", "principal"
- Skills: Extract technical skills from title, description, and tags
- Remote: Check for remote work indicators
- Job Type: Identify employment type
- Company Size: Infer from company name, description, or context

Be confident but accurate. Use "unknown" when uncertain.`;
  }

  /**
   * Call OpenAI API with proper error handling
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content:
                'You are a job analysis expert. Provide accurate, structured analysis of job postings.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1, // Low temperature for consistent results
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const errorObj = errorData?.error as
          | Record<string, unknown>
          | undefined;
        const errorMessage =
          errorObj?.message && typeof errorObj.message === 'string'
            ? errorObj.message
            : 'Unknown error';
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorMessage}`,
        );
      }

      const data = (await response.json()) as Record<string, unknown>;
      const choices = data?.choices as
        | Array<Record<string, unknown>>
        | undefined;
      const firstChoice = choices?.[0];
      const message = firstChoice?.message as
        | Record<string, unknown>
        | undefined;
      const content =
        message?.content && typeof message.content === 'string'
          ? message.content
          : '';
      return content;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('OpenAI API call failed', {
        error: errorMessage,
        prompt: prompt.substring(0, 100) + '...',
      });
      throw error;
    }
  }

  /**
   * Parse the classification response from OpenAI
   */
  private parseClassificationResponse(response: string): JobClassification {
    try {
      // Extract JSON from response (handle markdown formatting)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      return {
        seniorityLevel:
          (parsed.seniorityLevel as
            | 'entry'
            | 'mid'
            | 'senior'
            | 'lead'
            | 'unknown') || 'unknown',
        requiredSkills: Array.isArray(parsed.requiredSkills)
          ? (parsed.requiredSkills as string[])
          : [],
        remoteType:
          (parsed.remoteType as 'remote' | 'hybrid' | 'onsite' | 'unknown') ||
          'unknown',
        jobType:
          (parsed.jobType as
            | 'full-time'
            | 'part-time'
            | 'contract'
            | 'internship'
            | 'unknown') || 'unknown',
        companySize:
          (parsed.companySize as
            | 'startup'
            | 'small'
            | 'medium'
            | 'large'
            | 'enterprise'
            | 'unknown') || 'unknown',
        confidence: Math.min(
          Math.max((parsed.confidence as number) || 0.5, 0),
          1,
        ),
        reasoning: (parsed.reasoning as string) || 'No reasoning provided',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('Failed to parse AI response', {
        response: response.substring(0, 200) + '...',
        error: errorMessage,
      });

      // Return fallback classification
      return {
        seniorityLevel: 'unknown',
        requiredSkills: [],
        remoteType: 'unknown',
        jobType: 'unknown',
        confidence: 0,
        reasoning: 'Failed to parse AI response',
      };
    }
  }

  /**
   * Estimate the cost of the API call
   */
  private estimateCost(prompt: string, response: string): number {
    // Rough estimation: $0.15 per 1M input tokens, $0.60 per 1M output tokens
    const inputTokens = Math.ceil(prompt.length / 4); // Rough token estimation
    const outputTokens = Math.ceil(response.length / 4);

    const inputCost = (inputTokens / 1000000) * 0.15;
    const outputCost = (outputTokens / 1000000) * 0.6;

    return inputCost + outputCost;
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return !!this.openaiApiKey;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; model: string; configured: boolean } {
    return {
      available: this.isAvailable(),
      model: this.modelName,
      configured: !!this.openaiApiKey,
    };
  }
}
