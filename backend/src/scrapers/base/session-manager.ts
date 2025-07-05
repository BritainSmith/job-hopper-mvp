import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SessionManager {
  private readonly logger = new Logger(SessionManager.name);
  private cookies: Map<string, string> = new Map();
  private sessionStart: Date = new Date();
  private requestCount = 0;
  private currentUserAgent: string;

  private readonly userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];

  constructor() {
    this.currentUserAgent = this.getRandomUserAgent();
  }

  getHeaders(): Record<string, string> {
    return {
      'User-Agent': this.currentUserAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'Cookie': this.getCookieString(),
    };
  }

  async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Check if we need to rotate session
    if (this.shouldRotateSession()) {
      await this.rotateSession();
    }

    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    this.requestCount++;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Update cookies from response
    this.updateCookies(response);

    return response;
  }

  private shouldRotateSession(): boolean {
    const sessionAge = Date.now() - this.sessionStart.getTime();
    const maxSessionAge = 30 * 60 * 1000; // 30 minutes
    const maxRequests = 100;

    return sessionAge > maxSessionAge || this.requestCount > maxRequests;
  }

  private async rotateSession(): Promise<void> {
    this.logger.debug('Rotating session');
    
    this.cookies.clear();
    this.sessionStart = new Date();
    this.requestCount = 0;
    this.currentUserAgent = this.getRandomUserAgent();

    // Add a longer delay for session rotation
    await this.sleep(5000 + Math.random() * 5000);
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private getCookieString(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  private updateCookies(response: Response): void {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(',');
      cookies.forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          this.cookies.set(name.trim(), value.trim());
        }
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSessionInfo() {
    return {
      sessionAge: Date.now() - this.sessionStart.getTime(),
      requestCount: this.requestCount,
      cookieCount: this.cookies.size,
      userAgent: this.currentUserAgent,
    };
  }
} 