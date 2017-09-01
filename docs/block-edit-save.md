# Edit and Save

When registering a block, the `edit` and `save` functions provide the interface for how a block is going to be rendered within the editor, how it will operate and be manipulated, and how it will be saved.

## Edit

The `edit` function describes the structure of your block in the context of the editor. This represents what the editor will render when the block is used.

```js
// Defining the edit interface
edit() {
	return <hr />;
}
```

This function can return properties through an object argument.

### attributes

This property returns all the available attributes and their values, as described by the `attributes` property when the block type was registered. In this case, assuming we had defined an attribute of `content` during block registration, we would receive and use that value in our edit function:

```js
// Defining the edit interface
edit( { attributes } ) {
	return <div>{ attributes.content }</div>;
}
```

The value of `attributes.content` will be displayed inside the `div` when loading the editor.

### className

This property returns the class name for the wrapper element. This is automatically added in the `save` method, but not on `edit`, as the root element may not correspond to what is _visually_ the main element of the block. You can request it to add it to the correct element in your function.

```js
// Defining the edit interface
edit( { attributes, className } ) {
	return <div className={ className }>{ attributes.content }</div>;
}
```

### focus

The focus property is an object that communicates whether the block is currently focused, and which children of the block may be in focus.

```js
// Defining the edit interface
edit( { attributes, className, focus } ) {
	return (
		<div className={ className }>
			{ attributes.content }
			{ focus &&
				<span>Shows only when the block is focused.</span>
			}
		</div>
	);
}
```

Expand on how to focus specific elements within the block...

### setAttribute

This function allows you to update individual attributes for the block based on user interactions.

```js
// Defining the edit interface
edit( { attributes, className, focus } ) {
	// Simplify accessing attributes
	{ content, mySetting } = attributes;

	// Toggle a setting when the user clicks the button
	const toggleSetting = () => setAttributes( { mySetting: ! mySetting } );
	return (
		<div className={ className }>
			{ content }
			{ focus &&
				<button onClick={ toggleSetting }>Toggle setting</button>
			}
		</div>
	);
}
```

## Save

The `save` function defines the way in which the different attributes should be combined into the final markup, which is then serialized by Gutenberg into `post_content`.

```js
// Defining the save interface
save() {
	return <hr />;
}
```

This function also receives properties.

### attributes

It operates the same way as it does on `edit` and allows to save certain attributes directly to the markup, so they don't have to be computed on the server. This is how most static blocks are expected to work.

```js
// Defining the edit interface
save( { attributes } ) {
	return <div>{ attributes.content }</div>;
}
```
