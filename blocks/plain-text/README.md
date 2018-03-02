# `PlainText`

Render an auto-growing textarea allow users to fill any textual content.

## Properties

### `value: string`

*Required.* String value of the textarea

### `onChange( value: string ): Function`

*Required.* Called when the value changes.

You can also pass any extra prop to the textarea rendered by this component.

## Example

{% codetabs %}
{% ES5 %}
```js
wp.blocks.registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			type: 'string',
		},
	},

	edit: function( props ) {
		return wp.element.createElement( wp.blocks.PlainText, {
			className: props.className,
			value: props.attributes.content,
			onChange: function( content ) {
				props.setAttributes( { content: content } );
			},
		} );
	},
} );
```
{% ESNext %}
```js
const { registerBlockType, PlainText } = wp.blocks;

registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			type: 'string',
		},
	},

	edit( { className, attributes, setAttributes } ) {
		return (
			<PlainText
				className={ className }
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
			/>
		);
	},
} );
```
{% end %}
