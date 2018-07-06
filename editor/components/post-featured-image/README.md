PostFeaturedImage
===========

PostFeaturedImage is a React component used to render the Post Featured Image selection tool.
It includes a filter `editor.PostFeaturedImage` that enables developers to replace or extend it.

## Examples
Replace the contents of the panel:

```js
wp.hooks.addFilter( 
	'editor.PostFeaturedImage', 
	'myplugin/myhook', 
	function() { 
		return function() { 
			return wp.element.createElement( 
				'div', 
				{}, 
				'The replacement contents or components.' 
			); 
		} 
	} 
);
```

Prepend/Append to the panel contents:
```js
wp.hooks.addFilter( 
	'editor.PostFeaturedImage', 
	'myplugin/myhook', 
	function( original ) { 
		return function() { 
			return (
				wp.element.createElement( 
					'div', 
					{ key: 'outer' + Math.random() }, 
					[
						'Prepend above',
						_.extend( original( {} ), { key: 'my-key' } ),
						'Append below' 
					]
				)
			);
		} 
	} 
);
```
