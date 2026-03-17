# Prevent using only placeholders in translatable strings (i18n-no-placeholders-only)

Translatable strings that consist of nothing but a placeholder cannot be translated.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( '%s' );
```

Examples of **correct** code for this rule:

```js
__( 'Hello %s' );
```
