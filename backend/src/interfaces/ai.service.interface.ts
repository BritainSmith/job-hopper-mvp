import { AIAnalysisRequest, AIAnalysisResponse } from '../services/ai.service';

export interface IAIService {
  analyzeJob(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  isAvailable(): boolean;
  getStatus(): { available: boolean; model: string; configured: boolean };
}
