module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
    "node": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "globals": {
    "localStorage": "readonly",
    "sessionStorage": "readonly",
    "setTimeout": "readonly",
    "clearTimeout": "readonly",
    "requestAnimationFrame": "readonly",
    "cancelAnimationFrame": "readonly",
    "document": "readonly",
    "window": "readonly",
    "FileReader": "readonly",
    "URL": "readonly",
    "process": "readonly",
    "MutationObserver": "readonly",
    "performance": "readonly",
    "Intl": "readonly",
    "devicePixelRatio": "readonly"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "no-undef": "warn"
  }
}