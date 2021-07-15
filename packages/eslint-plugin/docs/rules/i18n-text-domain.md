# Enforce passing valid text domains (i18n-text-domain)

[Translation functions](https://github.com/WordPress/gutenberg/blob/HEAD/packages/i18n/README.md#api) must be called with a valid string literal as the text domain.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( 'Hello World' ); // unless allowedTextDomain contains 'default'
__( 'Hello World', 'default' ); // with allowedTextDomain = [ 'default' ]
__( 'Hello World', foo );
```

Examples of **correct** code for this rule:

```js
__( 'Hello World' ); // with allowedTextDomain = [ 'default' ]
__( 'Hello World', 'foo-bar' ); // with allowedTextDomain = [ 'foo-bar' ]
```

## Options

This rule accepts a single options argument:

-   Set `allowedTextDomain` to specify the list of allowed text domains, e.g. `[ 'foo', 'bar' ]`. The default is `[ 'default' ]`.
