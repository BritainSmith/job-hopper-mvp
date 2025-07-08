import { AIService, AIAnalysisRequest } from './ai.service';

describe('AIService', () => {
  let service: AIService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up default mocks for the service
    mockConfigService.get
      .mockReturnValueOnce('test-api-key')
      .mockReturnValueOnce('https://api.openai.com/v1');

    // Create the service instance
    service = new AIService(mockConfigService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with OpenAI API key', () => {
      // Service is already created in beforeEach with valid config
      expect(service.isAvailable()).toBe(true);
    });

    it('should handle missing API key gracefully', () => {
      mockConfigService.get
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('https://api.openai.com/v1');
      const newService = new AIService(mockConfigService as any);
      expect(newService.isAvailable()).toBe(false);
    });

    it('should throw error when base URL is not provided', () => {
      mockConfigService.get
        .mockReturnValueOnce('test-api-key')
        .mockReturnValueOnce(undefined);
      expect(() => new AIService(mockConfigService as any)).toThrow(
        'OpenAI base URL not configured. Please set OPENAI_BASE_URL in your environment.',
      );
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is configured', () => {
      // Service is already created in beforeEach with valid config
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      mockConfigService.get
        .mockReturnValueOnce('')
        .mockReturnValueOnce('https://api.openai.com/v1');
      const newService = new AIService(mockConfigService as any);
      expect(newService.isAvailable()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return correct status when configured', () => {
      // Service is already created in beforeEach with valid config
      const status = service.getStatus();

      expect(status).toEqual({
        available: true,
        model: 'gpt-4o-mini',
        configured: true,
      });
    });

    it('should return correct status when not configured', () => {
      mockConfigService.get
        .mockReturnValueOnce('')
        .mockReturnValueOnce('https://api.openai.com/v1');
      const newService = new AIService(mockConfigService as any);
      const status = newService.getStatus();

      expect(status).toEqual({
        available: false,
        model: 'gpt-4o-mini',
        configured: false,
      });
    });
  });

  describe('analyzeJob', () => {
    const mockRequest: AIAnalysisRequest = {
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      description: 'We are looking for a senior engineer...',
      salary: '$120k - $180k',
      tags: 'JavaScript, React, Node.js',
    };

    // Service is already created in beforeEach with valid config

    it('should throw error when API key is not configured', async () => {
      mockConfigService.get
        .mockReturnValueOnce('')
        .mockReturnValueOnce('https://api.openai.com/v1');
      const newService = new AIService(mockConfigService as any);

      await expect(newService.analyzeJob(mockRequest)).rejects.toThrow(
        'OpenAI API key not configured',
      );
    });

    it('should throw error when OpenAI API call fails', async () => {
      // Mock the service to have an API key but fail on fetch
      const serviceWithKey = new AIService({
        get: jest
          .fn()
          .mockReturnValueOnce('test-api-key')
          .mockReturnValueOnce('https://api.openai.com/v1'),
      } as any);

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(serviceWithKey.analyzeJob(mockRequest)).rejects.toThrow(
        'AI analysis failed: Network error',
      );
    });

    it('should throw error when OpenAI API returns error response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid API key' },
        }),
      });

      await expect(service.analyzeJob(mockRequest)).rejects.toThrow(
        'AI analysis failed: OpenAI API error: 401 - Invalid API key',
      );
    });

    it('should successfully analyze job with valid response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                seniorityLevel: 'senior',
                requiredSkills: ['JavaScript', 'React', 'Node.js'],
                remoteType: 'hybrid',
                jobType: 'full-time',
                companySize: 'large',
                confidence: 0.9,
                reasoning:
                  'Title contains "Senior" and skills are clearly listed',
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.analyzeJob(mockRequest);

      expect(result).toMatchObject({
        classification: {
          seniorityLevel: 'senior',
          requiredSkills: ['JavaScript', 'React', 'Node.js'],
          remoteType: 'hybrid',
          jobType: 'full-time',
          companySize: 'large',
          confidence: 0.9,
          reasoning: 'Title contains "Senior" and skills are clearly listed',
        },
        processingTime: expect.any(Number),
        costEstimate: expect.any(Number),
      });

      // Allow for very fast processing in tests
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.costEstimate).toBeGreaterThan(0);
    });

    it('should handle malformed JSON response gracefully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.analyzeJob(mockRequest);

      expect(result.classification).toEqual({
        seniorityLevel: 'unknown',
        requiredSkills: [],
        remoteType: 'unknown',
        jobType: 'unknown',
        confidence: 0,
        reasoning: 'Failed to parse AI response',
      });
    });

    it('should handle partial JSON response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                seniorityLevel: 'mid',
                // Missing other fields
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.analyzeJob(mockRequest);

      expect(result.classification).toEqual({
        seniorityLevel: 'mid',
        requiredSkills: [],
        remoteType: 'unknown',
        jobType: 'unknown',
        companySize: 'unknown',
        confidence: 0.5,
        reasoning: 'No reasoning provided',
      });
    });

    it('should handle confidence values outside valid range', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                seniorityLevel: 'entry',
                requiredSkills: ['Python'],
                remoteType: 'remote',
                jobType: 'full-time',
                confidence: 1.5, // Invalid confidence > 1
                reasoning: 'Entry level position',
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.analyzeJob(mockRequest);

      expect(result.classification.confidence).toBe(1); // Should be clamped to 1
    });

    it('should build correct prompt with all fields', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                seniorityLevel: 'senior',
                requiredSkills: ['TypeScript'],
                remoteType: 'remote',
                jobType: 'full-time',
                confidence: 0.8,
                reasoning: 'Test reasoning',
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.analyzeJob(mockRequest);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('Senior Software Engineer');
      expect(userMessage).toContain('Tech Corp');
      expect(userMessage).toContain('San Francisco, CA');
      expect(userMessage).toContain('We are looking for a senior engineer');
      expect(userMessage).toContain('$120k - $180k');
      expect(userMessage).toContain('JavaScript, React, Node.js');
    });

    it('should build correct prompt with minimal fields', async () => {
      const minimalRequest: AIAnalysisRequest = {
        jobTitle: 'Developer',
        company: 'Startup',
        location: 'Remote',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                seniorityLevel: 'unknown',
                requiredSkills: [],
                remoteType: 'remote',
                jobType: 'unknown',
                confidence: 0.5,
                reasoning: 'Minimal information provided',
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.analyzeJob(minimalRequest);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('Developer');
      expect(userMessage).toContain('Startup');
      expect(userMessage).toContain('Remote');
      expect(userMessage).not.toContain('Description:');
      expect(userMessage).not.toContain('Salary:');
      expect(userMessage).not.toContain('Tags:');
    });
  });

  describe('cost estimation', () => {
    it('should estimate costs correctly', () => {
      // This is a private method, so we'll test it indirectly through analyzeJob
      mockConfigService.get
        .mockReturnValueOnce('test-api-key')
        .mockReturnValueOnce('https://api.openai.com/v1');

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response with some content',
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      return service
        .analyzeJob({
          jobTitle: 'Test',
          company: 'Test',
          location: 'Test',
        })
        .then((result) => {
          expect(result.costEstimate).toBeGreaterThan(0);
          expect(typeof result.costEstimate).toBe('number');
        });
    });
  });
});
