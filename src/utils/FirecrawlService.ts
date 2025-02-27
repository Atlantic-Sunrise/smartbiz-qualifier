
interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  
  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('Firecrawl API key saved successfully');
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      if (!url) {
        return { success: false, error: 'No URL provided' };
      }

      const response = await fetch(url);
      const html = await response.text();
      
      // Extract text content from HTML
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Remove script and style elements
      const scripts = doc.getElementsByTagName('script');
      const styles = doc.getElementsByTagName('style');
      Array.from(scripts).forEach(script => script.remove());
      Array.from(styles).forEach(style => style.remove());
      
      // Get text content
      const text = doc.body.textContent || '';
      
      // Clean and normalize text
      const cleanText = text
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000); // Limit text length
      
      return {
        success: true,
        data: {
          url,
          content: cleanText,
        }
      };
    } catch (error) {
      console.error('Error crawling website:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl website'
      };
    }
  }
}

