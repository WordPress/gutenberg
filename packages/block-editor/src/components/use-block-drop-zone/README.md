useBlockDropZone
===========

`useBlockDropZone` is a React hook used to specify a drop zone for a block. This drop zone supports the drag and drop of media into the editor.

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
