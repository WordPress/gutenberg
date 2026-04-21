# Enforce string literals as translation function arguments (i18n-no-variables)

[Translation functions](https://github.com/WordPress/gutenberg/blob/HEAD/packages/i18n/README.md#api) must be called with valid string literals as arguments.

They cannot be variables or functions due to the way these strings are extracted through static analysis of the code. The exception to this rule is string concatenation within the argument itself.

This limitation applies to both singular and plural strings, as well as the `context` argument if present.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( `Hello ${ foo }` );
__( foo );
_x( 'Hello World', bar );
```

Examples of **correct** code for this rule:

```js
__( 'Hello World' );
_x( 'Hello' + ' World', 'context', 'foo' );
```
