module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/index.ts',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/test/**/*',
    '!**/bootstrap-app.ts'
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 10000,
  // Add proper cleanup for worker processes
  forceExit: true,
  detectOpenHandles: true,
  // Clear mocks between tests
  clearMocks: true,
  // Reset modules between tests
  resetModules: true,
  // Restore mocks after each test
  restoreMocks: true,
}; 