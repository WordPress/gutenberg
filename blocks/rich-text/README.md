# `RichText`

Render a rich
[`contenteditable` input](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content),
providing users the option to add emphasis to content or links to content. It
behaves similarly to a
[controlled component](https://facebook.github.io/react/docs/forms.html#controlled-components),
except that `onChange` is triggered less frequently than would be expected from
a traditional `input` field, usually when the user exits the field.

## Properties

### `value: Array`

*Required.* Array of React DOM to make editable. The rendered HTML should be valid, and valid with respect to the `tagName` and `inline` property.

### `onChange( value: Array ): Function`

*Required.* Called when the value changes.

### `tagName: String`

*Default: `div`.* The [tag name](https://www.w3.org/TR/html51/syntax.html#tag-name) of the editable element.

### `placeholder: String`

*Optional.* Placeholder text to show when the field is empty, similar to the
  [`input` and `textarea` attribute of the same name](https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/HTML5_updates#The_placeholder_attribute).

### `multiline: String`

*Optional.* By default, a line break will be inserted on <kbd>Enter</kbd>. If the editable field can contain multiple paragraphs, this property can be set to `p` to create new paragraphs on <kbd>Enter</kbd>.

### `onSplit( before: Array, after: Array, ...blocks: Object ): Function`

*Optional.* Called when the content can be split with `before` and `after`. There might be blocks present, which should be inserted in between.

### `onReplace( blocks: Array ): Function`

*Optional.* Called when the `RichText` instance is empty and it can be replaced with the given blocks.

### `onMerge( forward: Boolean ): Function`

*Optional.* Called when blocks can be merged. `forward` is true when merging with the next block, false when merging with the previous block.

### `onRemove( forward: Boolean ): Function`

*Optional.* Called when the block can be removed. `forward` is true when the selection is expected to move to the next block, false to the previous block.

### `formattingControls: Array`

*Optional.* By default, all formatting controls are present. This setting can be used to fine-tune formatting controls. Possible items: `[ 'bold', 'italic', 'strikethrough', 'link' ]`.

### `keepPlaceholderOnFocus: Boolean`

*Optional.* By default, the placeholder will hide as soon as the editable field receives focus. With this setting it can be be kept while the field is focussed and empty.

## Example

{% codetabs %}
{% ES5 %}
```js
wp.blocks.registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'h2',
		},
	},

	edit: function( props ) {
		return wp.element.createElement( wp.blocks.RichText, {
			tagName: 'h2',
			className: props.className,
			value: props.attributes.content,
			onChange: function( content ) {
				props.setAttributes( { content: content } );
			}
		} );
	},
} );
```
{% ESNext %}
```js
const { registerBlockType, RichText } = wp.blocks;

registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'h2',
		},
	},

	edit( { className, attributes, setAttributes } ) {
		return (
			<RichText
				tagName="h2"
				className={ className }
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
			/>
		);
	},
} );
```
{% end %}
