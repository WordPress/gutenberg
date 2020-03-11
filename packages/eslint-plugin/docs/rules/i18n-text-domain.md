# Enforce passing valid text domains (i18n-text-domain)

[Translation functions](https://github.com/WordPress/gutenberg/blob/master/packages/i18n/README.md#api) must be called with a valid string literal as the text domain.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( 'Hello World' ); // unless allowDefault is set.
__( 'Hello World', 'default' ); // with allowDefault set.
__( 'Hello World', foo );
```

Examples of **correct** code for this rule:

```js
__( 'Hello World' ); // with allowDefault set.
__( 'Hello World', 'foo-bar' ); // with allowedTextDomains set
```

## Options

This rule accepts two options:

- Set the `allowDefault` boolean to allow omitting the text domain and using its default value (`'default'`).
- Set `allowedTextDomains` to specify the list of allowed text domains, e.g. `'foo-bar'`.
