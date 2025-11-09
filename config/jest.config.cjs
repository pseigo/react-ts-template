const { readFileSync } = require("node:fs");

const k_swcrcFilePath = `${__dirname}/.swcrc`;
const k_swcOpts = JSON.parse(readFileSync(k_swcrcFilePath, { encoding: "utf-8" }));

/** @type {import("jest").Config} */
const config = {
  testEnvironment: "jsdom",
  rootDir: "..",
  roots: ["<rootDir>/src/", "<rootDir>/test/"],
  moduleDirectories: ["node_modules", "test"],
  modulePaths: ["<rootDir>"],
  moduleFileExtensions: [
    "js",
    "jsx",
    "cjs",
    "mjs",
    "ts",
    "tsx",
    "json",
    "node",
  ],
  extensionsToTreatAsEsm: [".jsx", ".ts", ".tsx"],
  moduleNameMapper: {
    "^@/unnamed_project/(.*)$": "<rootDir>/src/unnamed_project/$1",
    "^@/test/(.*)$": "<rootDir>/test/$1",
  },
  transform: {
    "^.+\\.[jt]sx?$": ["@swc/jest", k_swcOpts],
  },
  coverageProvider: "babel",
  coverageDirectory: "build-dev/.coverage",
};

module.exports = config;
