// Test file to verify user creation API works
// This can be run manually to test the /api/users endpoint

export const testUserCreation = async () => {
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com'
  };

  try {
    // Test creating a new user
    const response1 = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const result1 = await response1.json();
    console.log('First call (create):', result1);

    // Test calling again with same user (should upsert)
    const response2 = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testUser,
        email: 'updated@example.com' // Test email update
      }),
    });

    const result2 = await response2.json();
    console.log('Second call (upsert):', result2);

    return { success: true, results: [result1, result2] };
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error };
  }
};

// Export for potential use in browser console
if (typeof window !== 'undefined') {
  (window as any).testUserCreation = testUserCreation;
}
