# Disallow combining translatable strings with other text (i18n-no-concatenation)

A sentence built from several pieces, such as a translated string joined with a variable, punctuation, or another translated string, cannot be translated correctly: translators see each piece on its own, without context, and cannot change the order of the pieces or the punctuation between them. Use a single translatable string with placeholders instead, and insert values with `sprintf()`, or elements with `createInterpolateElement()`.

This rule reports translated strings that are:

- joined with other values using `+`;
- combined with text or other values in a template literal;
- rendered in JSX next to text, another translated string, or an inline element such as `<a>` or `<strong>` that contains text.

Markup without text, such as `'<strong>' + __( 'Hello' ) + '</strong>'`, and whitespace are not reported. In JSX, elements that are not inline, such as `<br />` or `<p>`, separate pieces of text, and a translated string that ends a sentence with `.`, `!`, `?`, or `…` can be followed by other text.

This rule uses heuristics, so it is not included in the recommended configuration.

## Rule details

Examples of **incorrect** code for this rule:

```js
__( 'Hello' ) + ' ' + name;
`${ label } (${ __( 'Required' ) })`;
<p>
	{ __( 'Read the' ) } <a href={ url }>{ __( 'documentation' ) }</a>
</p>;
<p>{ __( 'Get started here' ) }.</p>;
```

Examples of **correct** code for this rule:

```js
// translators: %s: Name of the user.
sprintf( __( 'Hello %s' ), name );
// translators: %s: Field label.
sprintf( __( '%s (Required)' ), label );
<p>
	{ createInterpolateElement( __( 'Read the <a>documentation</a>' ), {
		a: <a href={ url } />,
	} ) }
</p>;
<p>
	{ __( 'New to blocks?' ) }{ ' ' }
	<ExternalLink href={ url }>{ __( 'Learn more' ) }</ExternalLink>
</p>;
```
