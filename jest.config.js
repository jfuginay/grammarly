module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed from jest-environment-jsdom for consistency with instructions
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Changed to use jest.setup.js
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    // Keep the existing general alias as well for broader coverage
    '^@/(.*)$': '<rootDir>/src/$1',
     // Handle CSS imports (if you have CSS modules)
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', // Changed to use ts-jest for .ts and .tsx files
    '^.+\\.(js|jsx)$': 'babel-jest', // Keep babel-jest for .js and .jsx files if any
  },
  globals: {},
};
