# `PlainText`

Render an auto-growing textarea allow users to fill any textual content.

## Properties

### `value: string`

_Required._ String value of the textarea.

### `onChange( value: string ): Function`

_Required._ Function called when the text value changes.

You can also pass any extra prop to the textarea rendered by this component.

Automatic sizing uses CSS `field-sizing: content`. In browsers that support it, `rows` and `cols` do not set the field's size. Use CSS `min-height` and `max-height` to constrain its height. In browsers without support, the field keeps its native size and scrolls when its content overflows.

### `ref: Object`

_Optional._ The component forwards the `ref` property to the `textarea` element.

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
