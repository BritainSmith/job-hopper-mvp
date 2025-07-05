# Job Hopper - RemoteOK Scraper

A TypeScript-based web scraper using Puppeteer to extract software developer job listings from RemoteOK, with a NestJS backend for scalable API development.

## Features

- 🚀 Scrapes software developer job listings from RemoteOK
- 📊 Extracts job title, company, location, apply link, and additional metadata
- 🔄 Supports pagination to scrape multiple pages
- 💾 Saves results to JSON file and database
- ⚡ Configurable scraping options (pages, delays, headless mode)
- 🛡️ Built-in error handling and rate limiting
- 📝 TypeScript support with proper type definitions
- 🏗️ NestJS backend for scalable API development
- 🗄️ Prisma ORM for database management
- 🔧 Dynamic scraper configuration for multiple job sites

## Installation

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

## Environment Setup

1. **Initial Setup:**
   ```bash
   npm run setup
   ```
   This will create a `.env` file from `.env.example` if it doesn't exist.

2. **Configure Environment Variables:**
   Edit the `.env` file with your actual values:
   ```bash
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Scraping settings
   SCRAPER_DELAY=2000
   SCRAPER_MAX_PAGES=5
   SCRAPER_HEADLESS=true
   
   # Security (change these!)
   JWT_SECRET="your_secure_jwt_secret_here"
   SESSION_SECRET="your_secure_session_secret_here"
   ```

3. **Check Configuration:**
   ```bash
   npm run config
   ```

**⚠️ Security Note:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

## Usage

### Backend Development

Start the NestJS development server:

```bash
cd backend
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Scraping Jobs

Run the scraper with default settings (3 pages, 3-second delays, non-headless mode):

```bash
npm run scrape
```

### Headless Mode (Recommended for Production)

Run the scraper in headless mode for faster execution:

```bash
npm run scrape:headless
```

### Programmatic Usage

```typescript
import { scrapeRemoteOKJobs, RemoteOKScraper } from './src/scrapers/remoteok';

// Using the main function
const jobs = await scrapeRemoteOKJobs({
  maxPages: 5,
  delay: 2000,
  headless: true
});

// Or using the class directly
const scraper = new RemoteOKScraper({
  maxPages: 3,
  delay: 3000,
  headless: false
});

await scraper.initialize();
const jobs = await scraper.scrapeJobs();
await scraper.close();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxPages` | number | 5 | Maximum number of pages to scrape |
| `delay` | number | 2000 | Delay between page requests (ms) |
| `headless` | boolean | true | Run browser in headless mode |
| `userAgent` | string | Chrome UA | Custom user agent string |

## Output Format

The scraper extracts the following data for each job:

```typescript
interface JobListing {
  title: string;        // Job title
  company: string;      // Company name
  location: string;     // Job location (usually "Remote")
  applyLink: string;    // Direct link to apply
  postedDate?: string;  // When the job was posted
  salary?: string;      // Salary information (if available)
  tags?: string[];      // Job tags/skills
}
```

## Output Files

- `remoteok-jobs.json` - Contains all scraped job listings in JSON format
- Console output shows progress and summary statistics

## Example Output

```json
[
  {
    "title": "Senior Full Stack Developer",
    "company": "TechCorp",
    "location": "Remote",
    "applyLink": "https://remoteok.com/remote-jobs/123456",
    "postedDate": "2d ago",
    "salary": "$80k - $120k",
    "tags": ["React", "Node.js", "TypeScript"]
  }
]
```

## Ethical Considerations

- The scraper includes built-in delays to be respectful to RemoteOK's servers
- It blocks unnecessary resources (images, stylesheets) to reduce bandwidth
- Consider the website's robots.txt and terms of service
- Use responsibly and don't overload their servers

## Troubleshooting

### Common Issues

1. **Browser fails to launch**: Make sure you have Chrome/Chromium installed
2. **No jobs found**: The website structure may have changed - check the selectors
3. **Rate limiting**: Increase the delay between requests
4. **Timeout errors**: Increase the timeout values in the code

### Debug Mode

To see the browser in action, set `headless: false` in the options:

```typescript
const jobs = await scrapeRemoteOKJobs({
  headless: false,
  maxPages: 1
});
```

## Dependencies

### Root Dependencies
- `puppeteer` - Browser automation
- `typescript` - Type safety
- `ts-node` - TypeScript execution
- `@types/node` - Node.js type definitions
- `dotenv` - Environment variable management
- `@prisma/client` - Database ORM
- `prisma` - Database schema management

### Backend Dependencies
- `@nestjs/common` - NestJS core framework
- `@nestjs/core` - NestJS core functionality
- `@nestjs/platform-express` - Express adapter for NestJS
- `reflect-metadata` - Metadata reflection for decorators

## Project Structure

```
job-hopper/
├── prisma/                    # Database schema & migrations
├── src/                       # Original scrapers & services
│   ├── scrapers/             # Job scraping modules
│   ├── config/               # Configuration files
│   ├── services/             # Business logic services
│   └── db/                   # Database utilities
├── backend/                   # NestJS application
│   ├── src/
│   │   ├── prisma/           # NestJS Prisma integration
│   │   ├── app.module.ts     # Main application module
│   │   └── main.ts           # Application entry point
│   ├── prisma -> ../prisma   # Symlink to shared schema
│   └── .env -> ../.env       # Symlink to shared env
├── scripts/                   # Utility scripts
└── assets/                    # Static assets
```

## Security

This project follows security best practices:

- Environment variables are properly managed with `.env` files
- Sensitive files are excluded via `.gitignore`
- Security checklist available in `SECURITY.md`
- No hardcoded secrets in source code

See `SECURITY.md` for detailed security guidelines.

## License

ISC 