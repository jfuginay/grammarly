/**
 * Client-side CORS testing utility
 * 
 * Use this in the browser console to test CORS functionality
 */

interface CorsTestOptions {
  baseUrl?: string;
  endpoints?: string[];
  methods?: string[];
  origins?: string[];
}

export class CorsClient {
  private baseUrl: string;

  constructor(baseUrl: string = window.location.origin) {
    this.baseUrl = baseUrl;
  }

  /**
   * Test a simple GET request to check basic CORS
   */
  async testBasicCors(endpoint: string = '/api/cors-test'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return {
        success: true,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Test CORS with different HTTP methods
   */
  async testMethods(endpoint: string = '/api/cors-test'): Promise<any> {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    const results: { [key: string]: any } = {};
    const promises: Promise<void>[] = [];

    for (const method of methods) {
      const promise = (async () => {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: method !== 'GET' && method !== 'OPTIONS' ? JSON.stringify({ test: true }) : undefined,
          });

          results[method] = {
            success: true,
            status: response.status,
            corsHeaders: {
              'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
              'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
              'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
            },
          };
        } catch (error: any) {
          results[method] = {
            success: false,
            error: error.message,
          };
        }
      })();
      promises.push(promise);
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * Get the full CORS test report
   */
  async getTestReport(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/cors-test?report=true`, {
        method: 'GET',
        credentials: 'include',
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Test CORS from a different origin (requires iframe or popup)
   */
  async testCrossOrigin(targetOrigin: string, endpoint: string = '/api/cors-test'): Promise<any> {
    return new Promise((resolve) => {
      // Create an iframe to test from different origin
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `${targetOrigin}/test-cors.html`;
      
      // Listen for message from iframe
      window.addEventListener('message', function handler(event) {
        if (event.origin === targetOrigin) {
          window.removeEventListener('message', handler);
          document.body.removeChild(iframe);
          resolve(event.data);
        }
      });

      iframe.onload = () => {
        iframe.contentWindow?.postMessage({
          action: 'testCors',
          targetUrl: `${this.baseUrl}${endpoint}`,
        }, targetOrigin);
      };

      document.body.appendChild(iframe);

      // Timeout after 10 seconds
      setTimeout(() => {
        window.removeEventListener('message', () => {});
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve({
          success: false,
          error: 'Timeout waiting for cross-origin test',
        });
      }, 10000);
    });
  }
}

// Global utility functions for browser console
declare global {
  interface Window {
    testCors: CorsClient;
    corsQuickTest: () => Promise<void>;
  }
}

// Initialize global CORS tester
if (typeof window !== 'undefined') {
  window.testCors = new CorsClient();
  
  window.corsQuickTest = async function() {
    console.log('🔍 Running CORS Quick Test...\n');
    
    // Test basic CORS
    console.log('1. Testing basic CORS...');
    const basicTest = await window.testCors.testBasicCors();
    console.log('Basic CORS test:', basicTest);
    
    // Test different methods
    console.log('\n2. Testing different HTTP methods...');
    const methodTest = await window.testCors.testMethods();
    console.log('HTTP methods test:', methodTest);
    
    // Get full report
    console.log('\n3. Getting full test report...');
    const report = await window.testCors.getTestReport();
    console.log('Full report:', report);
    
    console.log('\n✅ CORS testing complete!');
    console.log('Use window.testCors for more advanced testing.');
  };
  
  console.log('🌐 CORS testing utilities loaded!');
  console.log('Run corsQuickTest() to test CORS configuration');
  console.log('Use window.testCors for advanced testing');
}

export default CorsClient;
