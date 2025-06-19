import { createMocks } from 'node-mocks-http';
// import { createClient } from '../api'; // Adjusted: Will require inside tests

// Mock Supabase's createServerClient
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    // Mock whatever Supabase client methods you use, e.g., auth, from, etc.
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
    })),
    // Add other mocked methods and properties as needed by your application code
  })),
  serializeCookieHeader: jest.fn((name, value) => `${name}=${value}`),
}));

describe('Supabase API Client Utility', () => {
  // Set up environment variables for Supabase
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'testanonkey';
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should create a Supabase client instance', () => {
    const { req, res } = createMocks({
      method: 'GET',
      cookies: { testcookie: 'testvalue' },
    });

    const { createClient } = require('../api');
    const client = createClient(req, res);

    // Check if createServerClient was called with the right parameters
    const { createServerClient } = require('@supabase/ssr');
    expect(createServerClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
        cookieOptions: expect.any(Object),
      })
    );

    // Check if the client object has expected properties (e.g., auth, from)
    expect(client).toHaveProperty('auth');
    expect(client).toHaveProperty('from');
  });

  it('should handle cookie operations correctly', () => {
    const { req, res } = createMocks({
      method: 'GET',
      cookies: { mycookie: 'myvalue' },
    });

    // Call createClient to get the cookie handlers
    const { createClient } = require('../api');
    createClient(req, res);
    const { createServerClient } = require('@supabase/ssr');
    const cookieHandlers = createServerClient.mock.calls[0][2].cookies;

    // Test getAll
    const cookies = cookieHandlers.getAll();
    expect(cookies).toEqual([{ name: 'mycookie', value: 'myvalue' }]);

    // Test setAll
    const cookiesToSet = [{ name: 'newcookie', value: 'newvalue', options: {} }];
    cookieHandlers.setAll(cookiesToSet);
    expect(res.getHeader('Set-Cookie')).toEqual(['newcookie=newvalue']);
    const { serializeCookieHeader } = require('@supabase/ssr');
    expect(serializeCookieHeader).toHaveBeenCalledWith('newcookie', 'newvalue', {});
  });

  it('should use preview domain for cookieOptions in preview environment', () => {
    process.env.NEXT_PUBLIC_CO_DEV_ENV = "preview";
    const { req, res } = createMocks({ method: 'GET' });
    const { createClient } = require('../api');
    createClient(req, res);
    const { createServerClient } = require('@supabase/ssr');
    const cookieOptions = createServerClient.mock.calls[0][2].cookieOptions;
    expect(cookieOptions.domain).toBe(".preview.co.dev");
  });

  it('should use undefined domain for cookieOptions when not in preview environment', () => {
    process.env.NEXT_PUBLIC_CO_DEV_ENV = "development"; // or any other value
    const { req, res } = createMocks({ method: 'GET' });
    const { createClient } = require('../api');
    createClient(req, res);
    const { createServerClient } = require('@supabase/ssr');
    const cookieOptions = createServerClient.mock.calls[0][2].cookieOptions;
    expect(cookieOptions.domain).toBeUndefined();
  });

});
