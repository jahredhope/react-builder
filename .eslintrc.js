module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings'
  ],
  parserOptions: { ecmaVersion: 6, sourceType: 'module' },
  globals: { atom: true },
  env: { es6: true, node: true },
  rules: {
    'no-console': 0
  },
  settings: {
    'import/ignore': 'atom'
  }
};
