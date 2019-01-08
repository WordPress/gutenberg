PostAuthor
===========

`PostAuthor` is a React component used to render the Post Author selection tool.

## Setup

It includes a `wp.hooks` filter `editor.PostAuthor` that enables developers to replace or extend it.

_Examples:_

Replace the contents of the panel:

```js
function replacePostAuthor() {
	return function() {
		return wp.element.createElement(
			'div',
			{},
			'My Post Author component.'
		);
	}
}

wp.hooks.addFilter(
	'editor.PostAuthor',
	'my-plugin/replace-post-author',
	replacePostAuthor
);
```

Prepend and append to the panel contents:

```js
var el = wp.element.createElement;

function wrapPostAuthor( OriginalComponent ) {
	return function( props ) {
		return (
			el(
				wp.element.Fragment,
				{},
				'Prepend above',
				el(
					OriginalComponent,
					props
				),
				'Append below'
			)
		);
	}
}

wp.hooks.addFilter(
	'editor.PostAuthor',
	'my-plugin/wrap-post-author',
	wrapPostAuthor
);
```
