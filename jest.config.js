
export const testTimeout = 120000;
export const testEnvironment = "node";
export const moduleNameMapper = {
  "^@/(.*)$": "<rootDir>/src/$1",
};
export const transform = {
  "^.+\\.(ts|tsx)$": "ts-jest", // Use ts-jest to handle TypeScript files
};
export const moduleFileExtensions = ["ts", "tsx", "js", "jsx"];
export const testPathIgnorePatterns = ["<rootDir>/.next/", "<rootDir>/node_modules/"];
export const testMatch = ["<rootDir>/**/*.test.(ts|tsx)"];