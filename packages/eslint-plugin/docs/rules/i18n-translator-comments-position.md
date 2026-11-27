# Enforce that translator comments survive bundling (i18n-translator-comments-position)

A translator comment is only useful if it reaches the `.pot` file, and `wp i18n make-pot` reads the built JavaScript, not the sources. Bundlers print from an abstract syntax tree in which comments are untracked trivia, and keep only a comment that leads an expression. A comment that leads a statement, a JSX attribute or a JSX child is dropped, and the string then reaches translators without the context it needs.

This rule complements [`i18n-translator-comments`](./i18n-translator-comments.md), which checks that a translator comment is *present*. This one checks that it is attached in a position a bundler keeps.

The rule is fixable: `--fix` moves the comment into the call, before its first argument, and turns a `//` comment into a `/* */` one so that it can sit inside an expression.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
// Leads a statement.
/* translators: %s: Name. */
return sprintf( __( 'Saved by %s.' ), name );

// Leads a variable declaration.
/* translators: Word count type. Do not translate! */
const wordCountType = _x( 'words', 'Word count type' );

// Leads a JSX attribute.
<Button
	/* translators: Keep under 16 characters. */
	label={ __( 'More' ) }
/>;

// Sits in its own JSX expression container.
<span>
	{ /* translators: Time format. */ }
	{ dateI18n( __( 'g:i a' ), date ) }
</span>;
```

Examples of **correct** code for this rule:

```jsx
// Leads a call argument.
return sprintf(
	/* translators: %s: Name. */
	__( 'Saved by %s.' ),
	name
);

// Leads the initializer rather than the declaration.
const wordCountType =
	/* translators: Word count type. Do not translate! */
	_x( 'words', 'Word count type' );

// Leads the expression inside the attribute's braces.
<Button
	label={
		/* translators: Keep under 16 characters. */
		__( 'More' )
	}
/>;

// Leads the expression rather than sitting in a container of its own.
<span>
	{ dateI18n(
		/* translators: Time format. */
		__( 'g:i a' ),
		date
	) }
</span>;
```

A comment that `make-pot` would not attach to a gettext call in the first place, because it is more than one line away from it, is left to `i18n-translator-comments` to report.
