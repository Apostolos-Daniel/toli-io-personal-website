// jest.config.mjs
export default {
  testEnvironment: "miniflare",
  transform: {
    "^.+\\.jsx?$": "babel-jest", // For ES6+ and JSX
  }
};
