const config = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};

module.exports = {
  collectCoverage: true,
  projects: [
    {
      displayName: 'src',
      roots: ['<rootDir>/src'],
      ...config,
    },
    {
      displayName: 'e2e',
      roots: ['<rootDir>/e2e'],
      ...config,
    },
  ],
};
