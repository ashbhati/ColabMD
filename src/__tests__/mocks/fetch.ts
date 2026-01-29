/**
 * Fetch Mock Utilities
 *
 * Provides comprehensive mocking for fetch API calls
 * used in API route testing.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
  headers: Headers;
}

export interface MockFetchCall {
  url: string;
  options?: RequestInit;
}

export type ResponseGenerator = (url: string, options?: RequestInit) => MockResponse;

// ============================================================================
// Mock Response Factory
// ============================================================================

export function createMockResponse(
  data: unknown,
  status: number = 200,
  ok: boolean = true
): MockResponse {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  };
}

export function createErrorResponse(
  message: string,
  status: number = 500
): MockResponse {
  return createMockResponse({ error: message }, status, false);
}

export function createUnauthorizedResponse(): MockResponse {
  return createErrorResponse('Unauthorized', 401);
}

export function createForbiddenResponse(): MockResponse {
  return createErrorResponse('Access denied', 403);
}

export function createNotFoundResponse(): MockResponse {
  return createErrorResponse('Not found', 404);
}

// ============================================================================
// Fetch Mock Setup
// ============================================================================

export class FetchMock {
  private calls: MockFetchCall[] = [];
  private responseMap: Map<string, ResponseGenerator> = new Map();
  private defaultResponse: MockResponse;

  constructor(defaultResponse?: MockResponse) {
    this.defaultResponse = defaultResponse || createMockResponse({});
  }

  /**
   * Set a response for a specific URL pattern
   */
  mockRoute(
    urlPattern: string | RegExp,
    response: MockResponse | ResponseGenerator
  ): this {
    const key = urlPattern instanceof RegExp ? urlPattern.source : urlPattern;
    const generator: ResponseGenerator =
      typeof response === 'function'
        ? response
        : () => response;
    this.responseMap.set(key, generator);
    return this;
  }

  /**
   * Mock GET request for a specific URL
   */
  mockGet(url: string, data: unknown, status: number = 200): this {
    return this.mockRoute(url, (reqUrl, options) => {
      if (!options?.method || options.method === 'GET') {
        return createMockResponse(data, status);
      }
      return this.defaultResponse;
    });
  }

  /**
   * Mock POST request for a specific URL
   */
  mockPost(url: string, data: unknown, status: number = 201): this {
    return this.mockRoute(url, (reqUrl, options) => {
      if (options?.method === 'POST') {
        return createMockResponse(data, status);
      }
      return this.defaultResponse;
    });
  }

  /**
   * Mock PATCH request for a specific URL
   */
  mockPatch(url: string, data: unknown, status: number = 200): this {
    return this.mockRoute(url, (reqUrl, options) => {
      if (options?.method === 'PATCH') {
        return createMockResponse(data, status);
      }
      return this.defaultResponse;
    });
  }

  /**
   * Mock DELETE request for a specific URL
   */
  mockDelete(url: string, status: number = 200): this {
    return this.mockRoute(url, (reqUrl, options) => {
      if (options?.method === 'DELETE') {
        return createMockResponse({ success: true }, status);
      }
      return this.defaultResponse;
    });
  }

  /**
   * Get the mock function to use with jest.spyOn
   */
  getMockFn(): jest.Mock {
    return jest.fn(async (url: string, options?: RequestInit) => {
      this.calls.push({ url, options });

      // Check for matching routes
      for (const [pattern, generator] of this.responseMap.entries()) {
        const regex = new RegExp(pattern);
        if (regex.test(url)) {
          return generator(url, options);
        }
      }

      return this.defaultResponse;
    });
  }

  /**
   * Get all recorded calls
   */
  getCalls(): MockFetchCall[] {
    return this.calls;
  }

  /**
   * Get calls to a specific URL pattern
   */
  getCallsTo(urlPattern: string | RegExp): MockFetchCall[] {
    const regex = urlPattern instanceof RegExp ? urlPattern : new RegExp(urlPattern);
    return this.calls.filter((call) => regex.test(call.url));
  }

  /**
   * Check if a URL was called
   */
  wasCalled(urlPattern: string | RegExp): boolean {
    return this.getCallsTo(urlPattern).length > 0;
  }

  /**
   * Get the body of a POST/PATCH call
   */
  getRequestBody(urlPattern: string | RegExp): unknown | null {
    const calls = this.getCallsTo(urlPattern);
    if (calls.length === 0) return null;
    const lastCall = calls[calls.length - 1];
    if (lastCall.options?.body) {
      return JSON.parse(lastCall.options.body as string);
    }
    return null;
  }

  /**
   * Clear all recorded calls
   */
  clearCalls(): void {
    this.calls = [];
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    this.calls = [];
    this.responseMap.clear();
  }
}

// ============================================================================
// Global Fetch Mock Helpers
// ============================================================================

let globalFetchMock: FetchMock | null = null;

export function setupGlobalFetchMock(): FetchMock {
  globalFetchMock = new FetchMock();
  global.fetch = globalFetchMock.getMockFn() as typeof fetch;
  return globalFetchMock;
}

export function getGlobalFetchMock(): FetchMock | null {
  return globalFetchMock;
}

export function resetGlobalFetchMock(): void {
  if (globalFetchMock) {
    globalFetchMock.reset();
  }
}

// ============================================================================
// API Route Specific Mocks
// ============================================================================

export function mockDocumentsApi(fetchMock: FetchMock): void {
  // List documents
  fetchMock.mockGet('/api/documents', {
    owned: [],
    shared: [],
  });

  // Get single document
  fetchMock.mockRoute(/\/api\/documents\/[\w-]+$/, (url, options) => {
    if (!options?.method || options.method === 'GET') {
      const docId = url.split('/').pop();
      return createMockResponse({
        id: docId,
        title: 'Test Document',
        content: '<p>Test content</p>',
        owner_id: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    if (options?.method === 'PATCH') {
      const body = JSON.parse(options.body as string);
      return createMockResponse({
        id: url.split('/').pop(),
        ...body,
        updated_at: new Date().toISOString(),
      });
    }
    if (options?.method === 'DELETE') {
      return createMockResponse({ success: true });
    }
    return createMockResponse({});
  });

  // Create document
  fetchMock.mockPost('/api/documents', {
    id: 'new-doc-123',
    title: 'Untitled Document',
    content: '',
    owner_id: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export function mockShareApi(fetchMock: FetchMock): void {
  // Get shares
  fetchMock.mockRoute(/\/api\/documents\/[\w-]+\/share$/, (url, options) => {
    if (!options?.method || options.method === 'GET') {
      return createMockResponse([]);
    }
    if (options?.method === 'POST') {
      const body = JSON.parse(options.body as string);
      if (body.type === 'link') {
        return createMockResponse({
          id: 'share-123',
          document_id: 'doc-123',
          share_token: 'token-abc123',
          permission: body.permission,
          share_url: `http://localhost:3000/share/token-abc123`,
        }, 201);
      }
      return createMockResponse({
        id: 'share-123',
        document_id: 'doc-123',
        user_id: 'user-456',
        permission: body.permission,
      }, 201);
    }
    if (options?.method === 'DELETE') {
      return createMockResponse({ success: true });
    }
    return createMockResponse({});
  });
}

export function mockLiveblocksAuthApi(fetchMock: FetchMock): void {
  fetchMock.mockPost('/api/liveblocks-auth', {
    token: 'mock-liveblocks-token',
  });
}
