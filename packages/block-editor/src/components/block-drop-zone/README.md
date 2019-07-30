BlockDropZone
===========

`BlockDropZone` is a React component that renders a container which allows a user to drag media into the editor and immediately place it.

## Setup

It includes a `wp.hooks` filter `editor.BlockDropZone` that enables developers to replace or extend it.

_Example:_

Replace implementation of the drop zone:

```js
function replaceBlockDropZone() { 
	return function() { 
		return wp.element.createElement( 
			'div', 
			{}, 
			'The replacement contents or components.' 
		); 
	} 
} 

wp.hooks.addFilter( 
	'editor.BlockDropZone', 
	'my-plugin/replace-block-drop-zone', 
	replaceBlockDropZone
);
```
