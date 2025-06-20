module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed to jsdom
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1' // Added path alias mapping
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Override tsconfig settings for Jest
        module: 'commonjs', // Force CommonJS output
        jsx: 'react-jsx',    // Ensure JSX is processed
        // esModuleInterop is often needed for commonjs modules with default imports
        esModuleInterop: true,
      },
      babelConfig: true
    }],
    '^.+\\.jsx?$': 'babel-jest', // If you have JS files that also need transformation by Babel
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
};
