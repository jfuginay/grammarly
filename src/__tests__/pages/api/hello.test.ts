import { createMocks } from 'node-mocks-http';
import handleHello from '../hello'; // Adjust the import path as necessary

describe('/api/hello', () => {
  it('returns a JSON object with name and version', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handleHello(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('name');
    expect(responseData).toHaveProperty('version');
    expect(responseData.name).toBe('Hello World');
    // You might want to fetch the version from package.json instead of hardcoding
    // For now, we'll assume a fixed version or check if it's a string
    expect(typeof responseData.version).toBe('string');
  });
});
