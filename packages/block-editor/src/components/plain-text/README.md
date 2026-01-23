# `PlainText`

Render an auto-growing textarea allow users to fill any textual content.

## Properties

### `value: string`

_Required._ String value of the textarea.

### `onChange( value: string ): Function`

_Required._ Function called when the text value changes.

You can also pass any extra prop to the textarea rendered by this component.

### `ref: Object`

_Optional._ The component forwards the `ref` property to the `TextareaAutosize` component.

## Example

```js
import { registerBlockType } from '@wordpress/blocks';
import { PlainText } from '@wordpress/block-editor';

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

