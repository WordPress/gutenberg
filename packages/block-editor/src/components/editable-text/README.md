# `EditableText`

Renders an editable text input in which text formatting is not allowed.

## Properties

### `value: String`

_Required._ String to make editable.

### `onChange( value: String ): Function`

_Required._ Called when the value changes.

### `tagName: String`

_Default: `div`._ The [tag name](https://www.w3.org/TR/html51/syntax.html#tag-name) of the editable element.

### `disableLineBreaks: Boolean`

_Optional._ `Text` won't insert line breaks on `Enter` if set to `true`.

### `placeholder: String`

_Optional._ Placeholder text to show when the field is empty, similar to the
[`input` and `textarea` attribute of the same name](https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/HTML5_updates#The_placeholder_attribute).

### `onReplace( blocks: Array ): Function`

_Optional._ Called when the `Text` instance can be replaced with the given blocks.

### `onMerge( forward: Boolean ): Function`

_Optional._ Called when blocks can be merged. `forward` is true when merging with the next block, false when merging with the previous block.

### `onRemove( forward: Boolean ): Function`

_Optional._ Called when the block can be removed. `forward` is true when the selection is expected to move to the next block, false to the previous block.

## EditableText.Content

`EditableText.Content` should be used in the `save` function of your block to correctly save text content.

## Example

```js
const { registerBlockType } = wp.blocks;
const { EditableText } = wp.editor;

registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			source: 'html',
			selector: '.text',
		},
	},

	edit( { className, attributes, setAttributes } ) {
		return (
			<EditableText
				className={ className }
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <EditableText.Content value={ attributes.content } />;
	}
} );
```
