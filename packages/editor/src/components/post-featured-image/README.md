# PostFeaturedImage

`PostFeaturedImage` is a React component used to render the Post Featured Image selection tool.

## Setup

It includes a `wp.hooks` filter `editor.PostFeaturedImage` that enables developers to replace or extend it.

_Examples:_

Replace the contents of the panel:

```js
function replacePostFeaturedImage() {
	return function () {
		return React.createElement(
			'div',
			{},
			'The replacement contents or components.'
		);
	};
}

wp.hooks.addFilter(
	'editor.PostFeaturedImage',
	'my-plugin/replace-post-featured-image',
	replacePostFeaturedImage
);
```

Prepend and append to the panel contents:

```js
var el = React.createElement;

function wrapPostFeaturedImage( OriginalComponent ) {
	return function ( props ) {
		return el(
			React.Fragment,
			{},
			'Prepend above',
			el( OriginalComponent, props ),
			'Append below'
		);
	};
}

wp.hooks.addFilter(
	'editor.PostFeaturedImage',
	'my-plugin/wrap-post-featured-image',
	wrapPostFeaturedImage
);
```
