MediaPlaceholder
===========

`MediaPlaceholder` is a React component used to render either the media associated with a block, or an editing interface to replace the media for a block.

## Usage

An example usage which sets the URL of the selected image to `theImage` attributes.

```
const { MediaPlaceholder } = wp.editor;

...

	edit: ( { attributes, setAttributes } ) {
		const mediaPlaceholder = <MediaPlaceholder
			onSelect = {
				( el ) => {
					setAttributes( { theImage: el.url } );
				}
			}
			allowedTypes = { [ 'image' ] }
			multiple = { false }
			labels = { { title: 'The Image' } }
		/>;
		...
	}
```

## Extend

It includes a `wp.hooks` filter `editor.MediaPlaceholder` that enables developers to replace or extend it.

_Example:_

Replace implementation of the placeholder:

```js
function replaceMediaPlaceholder() {
	return function() {
		return wp.element.createElement(
			'div',
			{},
			'The replacement contents or components.'
		);
	}
}

wp.hooks.addFilter(
	'editor.MediaPlaceholder',
	'my-plugin/replace-media-placeholder',
	replaceMediaPlaceholder
);
```
