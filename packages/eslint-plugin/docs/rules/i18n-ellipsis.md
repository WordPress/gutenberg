# Disallow using three dots in translatable strings (i18n-ellipsis)

Three dots for indicating an ellipsis should be replaced with the UTF-8 character … (Horizontal Ellipsis, U+2026) as it has a more semantic meaning.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( 'Continue...' );
```

Examples of **correct** code for this rule:

```js
__( 'Continue…' );
```
