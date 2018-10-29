MediaPlaceholder
===========

`MediaPlaceholder` is a React component used to render either the media associated with a block, or an editing interface to replace the media for a block.

## Setup

It includes a `wp.hooks` filter `editor.MediaPlaceholder` that enables developers to replace or extend it.

_Example:_

Replace the contents of the panel:

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
	'my-plugin/replace-media-placeholder-component', 
	replaceMediaPlaceholder
);
```
