# Enforce valid sprintf usage (valid-sprintf)

[`sprintf`](https://github.com/WordPress/gutenberg/blob/master/packages/i18n/README.md#api) must be called with a valid format string with at least one placeholder, and with a valid set of placeholder substitute values.

## Rule details

Examples of **incorrect** code for this rule:

```js
sprintf();
sprintf( '%s' );
sprintf( 1, 'substitute' );
sprintf( [], 'substitute' );
sprintf( '%%', 'substitute' );
sprintf( __( '%%' ), 'substitute' );
sprintf( _n( '%s', '' ), 'substitute' );
sprintf( _n( '%s', '%s %s' ), 'substitute' );
```

Examples of **correct** code for this rule:

```js
sprintf( '%s', 'substitute' );
sprintf( __( '%s' ), 'substitute' );
sprintf( _x( '%s' ), 'substitute' );
sprintf( _n( '%s', '%s' ), 'substitute' );
sprintf( _nx( '%s', '%s' ), 'substitute' );
```
