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

// Todo: for more advanced uses, `edit` can return a component with lifecycle.

The function receives the following properties through an object argument.

### attributes

This property surfaces all the available attributes and their corresponding values, as described by the `attributes` property when the block type was registered. In this case, assuming we had defined an attribute of `content` during block registration, we would receive and use that value in our edit function:

```js
// Defining the edit interface
edit( { attributes } ) {
	return <div>{ attributes.content }</div>;
}
```

The value of `attributes.content` will be displayed inside the `div` when inserting the block in the editor.

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

### setAttributes

This function allows the block to update individual attributes based on user interactions.

```js
// Defining the edit interface
edit( { attributes, className, focus } ) {
	// Simplify access to attributes
	const { content, mySetting } = attributes;

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

### setFocus

// Todo ...

## Save

The `save` function defines the way in which the different attributes should be combined into the final markup, which is then serialized by Gutenberg into `post_content`.

```js
// Defining the save interface
save() {
	return <hr />;
}
```

This function can return a `null` value, in which case the block is considered to be _dynamic_—that means that only an HTML comment with attributes is serialized and the server has to provide the render function. (This is the equivalent to purely dynamic shortcodes, with the advantage that the grammar parsing it is assertive and they can remain invisible in contexts that are unable to compute them on the server, instead of showing gibberish as text.)

`save` can also receive properties.

### attributes

It operates the same way as it does on `edit` and allows to save certain attributes directly to the markup, so they don't have to be computed on the server. This is how most _static_ blocks are expected to work.

```js
// Defining the edit interface
save( { attributes } ) {
	return <div>{ attributes.content }</div>;
}
```
