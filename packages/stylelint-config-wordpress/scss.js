module.exports = {
  "extends": [
    "./",
  ].map(require.resolve),

  plugins: [
    "stylelint-scss",
  ],

  rules: {

    // stylelint-config-wordpress css overrides
    "at-rule-no-unknown": [ true, {
      ignoreAtRules: [ "extend", "at-root", "warn", "error", "if", "else", "for", "each", "while", "mixin", "include", "content", "return", "function" ],
    } ],
    "scss/selector-no-redundant-nesting-selector": true,
  },
}
