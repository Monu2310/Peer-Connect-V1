module.exports = {
  "env": {
    "node": true,
    "es2021": true,
    "commonjs": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 12
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "prefer-const": "warn",
    "no-undef": "warn"
  }
}