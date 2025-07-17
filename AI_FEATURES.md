# AI Features Documentation

## Overview

Job Hopper v1.1.0 introduces **AI-powered job filtering** and **intelligent recommendations** to enhance the job search experience. These features use OpenAI's GPT models to provide intelligent job matching based on user preferences and job requirements.

## 🤖 AI-Powered Job Filtering

### Features

- **Intelligent Job Matching**: AI analyzes job descriptions and user preferences for optimal matching
- **Smart Recommendations**: AI-generated job suggestions with relevance scoring
- **Flexible Filter Criteria**: Support for skills, experience levels, and location preferences
- **Configurable AI Models**: Environment-based AI service configuration
- **Cost Tracking**: Real-time cost estimation for AI API calls
- **Confidence Scoring**: AI confidence levels for each recommendation

### API Endpoints

#### `POST /jobs/ai/filter`

Intelligent job filtering based on AI analysis of job requirements and user preferences.

**Request Body:**
```typescript
{
  "aiFilters": {
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "preferredSkills": ["TypeScript", "AWS"],
    "experienceLevel": "senior",
    "location": "remote",
    "maxResults": 10
  }
}
```

**Response:**
```typescript
{
  "jobs": [
    {
      "title": "Senior Full Stack Developer",
      "company": "TechCorp",
      "location": "Remote",
      "applyLink": "https://example.com/job/123",
      "postedDate": "2023-07-01T00:00:00.000Z",
      "salary": "$80k - $120k",
      "tags": ["React", "Node.js", "TypeScript"],
      "relevanceScore": 0.95,
      "aiAnalysis": {
        "confidence": 0.9,
        "processingTime": 150,
        "costEstimate": 0.0000741
      }
    }
  ]
}
```

#### `POST /jobs/ai/recommendations`

AI-generated job recommendations with relevance scoring and detailed analysis.

**Request Body:**
```typescript
{
  "aiFilters": {
    "requiredSkills": ["Python", "Machine Learning"],
    "preferredSkills": ["TensorFlow", "PyTorch"],
    "experienceLevel": "mid",
    "location": "hybrid",
    "maxResults": 5
  }
}
```

### Filter Options

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `requiredSkills` | `string[]` | Skills that must be present in the job | `["JavaScript", "React"]` |
| `preferredSkills` | `string[]` | Skills that are nice to have | `["TypeScript", "AWS"]` |
| `experienceLevel` | `string` | Experience level preference | `"junior"`, `"mid"`, `"senior"` |
| `location` | `string` | Location preference | `"remote"`, `"onsite"`, `"hybrid"` |
| `maxResults` | `number` | Maximum number of results to return | `10` |

### Rate Limiting

- **AI Endpoints**: 3 requests per minute
- **Global Rate Limiting**: 2 requests per 10 seconds
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🔧 Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# AI Service Configuration
AI_SERVICE_ENABLED=true
AI_MAX_CONCURRENT_REQUESTS=5
AI_REQUEST_TIMEOUT=30000
```

### AI Service Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `OPENAI_MODEL` | `gpt-4-turbo-preview` | OpenAI model to use for analysis |
| `OPENAI_MAX_TOKENS` | `1000` | Maximum tokens per request |
| `OPENAI_TEMPERATURE` | `0.7` | Creativity level (0-1) |
| `AI_SERVICE_ENABLED` | `true` | Enable/disable AI features |
| `AI_MAX_CONCURRENT_REQUESTS` | `5` | Maximum concurrent AI requests |
| `AI_REQUEST_TIMEOUT` | `30000` | Request timeout in milliseconds |

## 💰 Cost Management

### Cost Estimation

The AI service provides real-time cost estimation for each request:

```typescript
{
  "aiAnalysis": {
    "costEstimate": 0.0000741,  // Cost in USD
    "processingTime": 150,      // Time in milliseconds
    "confidence": 0.9           // AI confidence (0-1)
  }
}
```

### Cost Optimization Tips

1. **Use Specific Filters**: More specific filters reduce token usage
2. **Limit Results**: Use `maxResults` to control response size
3. **Cache Results**: Implement caching for repeated queries
4. **Monitor Usage**: Track costs in the `aiAnalysis` response

## 🧪 Testing AI Features

### Unit Tests

Run AI service tests:

```bash
npm test -- --testPathPattern=ai
```

### Integration Testing

Test AI endpoints with curl:

```bash
# Test AI filtering
curl -X POST http://localhost:3000/jobs/ai/filter \
  -H "Content-Type: application/json" \
  -d '{
    "aiFilters": {
      "requiredSkills": ["JavaScript"],
      "maxResults": 3
    }
  }'

# Test rate limiting
for i in {1..5}; do
  curl -X POST http://localhost:3000/jobs/ai/filter \
    -H "Content-Type: application/json" \
    -d '{"aiFilters": {"requiredSkills": ["JavaScript"]}}' \
    -w "\nHTTP Status: %{http_code}\n\n"
done
```

## 🛡️ Security & Privacy

### Data Handling

- **No Data Storage**: AI analysis results are not permanently stored
- **API Key Security**: OpenAI API keys are stored in environment variables
- **Request Logging**: Minimal logging for debugging purposes
- **Rate Limiting**: Built-in protection against API abuse

### Best Practices

1. **Secure API Keys**: Never commit API keys to version control
2. **Monitor Usage**: Track API usage and costs
3. **Error Handling**: Implement proper error handling for API failures
4. **Fallback Options**: Provide non-AI alternatives when AI is unavailable

## 🔄 Error Handling

### Common Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `401 Unauthorized` | Invalid OpenAI API key | Check API key configuration |
| `429 Too Many Requests` | Rate limit exceeded | Wait for rate limit reset |
| `500 Internal Server Error` | AI service unavailable | Check OpenAI service status |
| `AI_SERVICE_DISABLED` | AI features disabled | Enable AI service in config |

### Fallback Behavior

When AI features are unavailable, the system falls back to basic filtering:

```typescript
// Fallback to basic filtering
const fallbackJobs = await this.jobService.findJobs({
  skills: aiFilters.requiredSkills,
  limit: aiFilters.maxResults
});
```

## 🚀 Future Enhancements

### Planned Features

- **AI Model Fine-tuning**: Custom models for better job matching
- **Learning from Feedback**: Improve recommendations based on user actions
- **Multi-language Support**: AI analysis in multiple languages
- **Advanced Analytics**: Job market trends and insights
- **Real-time Updates**: WebSocket support for live recommendations

### Performance Optimizations

- **Caching Layer**: Redis-based caching for AI responses
- **Batch Processing**: Process multiple jobs in single AI request
- **Async Processing**: Background job analysis
- **Model Optimization**: Lighter models for faster responses

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Rate Limiting Guide](SECURITY_AUDIT_RESOLUTION.md)
- [API Documentation](http://localhost:3000/api)
- [Test Coverage](TEST_SUITES.md)

---

**For technical implementation details, see the source code in `backend/src/services/ai.service.ts` and `backend/src/services/ai-job-filter.service.ts`.** 