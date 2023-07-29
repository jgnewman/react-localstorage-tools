/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
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