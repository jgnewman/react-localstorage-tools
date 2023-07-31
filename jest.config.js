module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/test/jest-setup.ts',
    '<rootDir>/test/storageProxy.ts',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleDirectories: [
    'src',
    'test',
    'node_modules',
  ],
  moduleNameMapper: {
    '/^(.*)$/': [
      '<rootDir>/node_modules/$1',
      '<rootDir>/src/$1',
      '<rootDir>/test/$1',
    ],
  },
};