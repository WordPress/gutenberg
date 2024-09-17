# `RichText`

Render a rich [`contenteditable` input](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content), providing users with the option to format the content.

## Properties

### `value: String`

_Required._ HTML string to make editable. The HTML should be valid, and valid inside the `tagName`, if provided.

### `onChange( value: String ): Function`

_Required._ Called when the value changes.

### `identifier: String`

_Optional._ If the editable field is bound to a block attribute (through the `value` and `onChange` props) then this prop should specify the attribute name. The field will use this value to set the block editor selection correctly, specifying in which attribute and at what offset does the selection start or end.

### `tagName: String`

_Default: `div`._ The [tag name](https://www.w3.org/TR/html51/syntax.html#tag-name) of the editable element.

### `placeholder: String`

_Optional._ Placeholder text to show when the field is empty, similar to the
[`input` and `textarea` attribute of the same name](https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/HTML5_updates#The_placeholder_attribute).

### `disableLineBreaks: Boolean`

_Optional._  Disables inserting line breaks on `Enter` when it is set to `true`

### `onReplace( blocks: Array ): Function`

_Optional._ Called when the `RichText` instance can be replaced with the given blocks.

### `onMerge( forward: Boolean ): Function`

_Optional._ Called when blocks can be merged. `forward` is true when merging with the next block, false when merging with the previous block.

### `onRemove( forward: Boolean ): Function`

_Optional._ Called when the block can be removed. `forward` is true when the selection is expected to move to the next block, false to the previous block.

### `allowedFormats: Array`

_Optional._ By default, all registered formats are allowed. This setting can be used to fine-tune the allowed formats. If you want to limit the formats allowed, you can specify using allowedFormats property in your code. If you want to allow only bold and italic settings, then you need to pass it in array. Example: `[ 'core/bold', 'core/link' ]`.

{% ESNext %}

```js
<RichText
	tagName="h2"
	identifier="content"
	value={ attributes.content }
	allowedFormats={ [ 'core/bold', 'core/italic' ] } // Allow the content to be made bold or italic, but do not allow othe formatting options
	onChange={ ( content ) => setAttributes( { content } ) }
	placeholder={ __( 'Heading...' ) }
/>
```

### `withoutInteractiveFormatting: Boolean`

_Optional._ By default, all formatting controls are present. This setting can be used to remove formatting controls that would make content [interactive](https://html.spec.whatwg.org/multipage/dom.html#interactive-content). This is useful if you want to make content that is already interactive editable.

### `isSelected: Boolean`

_Optional._ Whether to show the input is selected or not in order to show the formatting controls. By default it renders the controls when the block is selected.

### `autocompleters: Array<Completer>`

_Optional._ A list of autocompleters to use instead of the default.

### `preserveWhiteSpace: Boolean`

_Optional._ Whether or not to preserve white space characters in the `value`. Normally tab, newline and space characters are collapsed to a single space or
trimmed.

## RichText.Content

`RichText.Content` should be used in the `save` function of your block to correctly save rich text content.

## Example

```js
import { registerBlockType } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';

registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			source: 'html',
			selector: 'h2',
		},
	},

	edit( { className, attributes, setAttributes } ) {
		return (
			<RichText
				tagName="h2"
				className={ className }
				identifier="content"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <RichText.Content tagName="h2" value={ attributes.content } />;
	}
} );
```


## RichTextToolbarButton

Slot to extend the format toolbar. Use it in the edit function of a `registerFormatType` call to surface the format to the UI.

### Example


```js
import { registerFormatType } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';

registerFormatType( /* ... */, {
	/* ... */
	edit( { isActive } ) {
		return (
			<RichTextToolbarButton
				icon={ 'editor-code' }
				title={ 'My formatting button' }
				onClick={ /* ... */ }
				isActive={ isActive }
				/>
		);
	},
	/* ... */
} );
```
