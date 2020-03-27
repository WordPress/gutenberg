# Enforce string literals as translation function arguments (i18n-no-variables)

[Translation functions](https://github.com/WordPress/gutenberg/blob/master/packages/i18n/README.md#api) must be called with valid string literals as arguments.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( 'Hello World' );
_x( 'Hello World', 'context', 'foo' );

```

Examples of **correct** code for this rule:

```js
__( `Hello ${foo}` );
_x( 'Hello World', bar );
```
