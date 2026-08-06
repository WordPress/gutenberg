# Enforce adding translator comments (i18n-translator-comments)

If using [translation functions](https://github.com/WordPress/gutenberg/blob/HEAD/packages/i18n/README.md#api) with placeholders in them,
they need accompanying translator comments.

## Rule details

Examples of **incorrect** code for this rule:

```js
var color = '';
sprintf( __( 'Color: %s' ), color );

var address = '';
sprintf( __( 'Address: %s' ), address );

// translators: %s: Name
var name = '';
sprintf( __( 'Name: %s' ), name );
```

Examples of **correct** code for this rule:

```js
var color = '';
// translators: %s: Color
sprintf( __( 'Color: %s' ), color );

var address = '';
sprintf(
	// translators: %s: Address.
	__( 'Address: %s' ),
	address
);
```
