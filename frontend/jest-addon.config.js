module.exports = {
  roots: ['../../../packages'],
  testMatch: ['<rootDir>/../../../../**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: [
    'src/addons/**/src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  // jsdom is required by @testing-library/react render() calls.
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!(volto-slate|@plone/volto)/)'],
  // Suppress console.error noise from expected React/DOM warnings in tests.
  globals: {
    __CLIENT__: true,
    __DEVELOPMENT__: false,
  },
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
};
