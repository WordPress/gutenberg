# `RichText`

Render a rich [`contenteditable` input](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content), providing users with the option to format the content.

## Properties

### `value: String`

*Required.* HTML string to make editable. The HTML should be valid, and valid inside the `tagName`, if provided.

### `onChange( value: String ): Function`

*Required.* Called when the value changes.

### `tagName: String`

*Default: `div`.* The [tag name](https://www.w3.org/TR/html51/syntax.html#tag-name) of the editable element. Elements that display inline are not supported.

### `placeholder: String`

*Optional.* Placeholder text to show when the field is empty, similar to the
  [`input` and `textarea` attribute of the same name](https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/HTML5_updates#The_placeholder_attribute).

### `multiline: Boolean | String`

*Optional.* By default, a line break will be inserted on <kbd>Enter</kbd>. If the editable field can contain multiple paragraphs, this property can be set to create new paragraphs on <kbd>Enter</kbd>.

### `onSplit( value: String ): Function`

*Optional.* Called when the content can be split, where `value` is a piece of content being split off. Here you should create a new block with that content and return it. Note that you also need to provide `onReplace` in order for this to take any effect.

### `onReplace( blocks: Array ): Function`

*Optional.* Called when the `RichText` instance can be replaced with the given blocks.

### `onMerge( forward: Boolean ): Function`

*Optional.* Called when blocks can be merged. `forward` is true when merging with the next block, false when merging with the previous block.

### `onRemove( forward: Boolean ): Function`

*Optional.* Called when the block can be removed. `forward` is true when the selection is expected to move to the next block, false to the previous block.

### `allowedFormats: Array`

*Optional.* By default, all registered formats are allowed. This setting can be used to fine-tune the allowed formats. Example: `[ 'core/bold', 'core/link' ]`.

### `withoutInteractiveFormatting: Boolean`

*Optional.* By default, all formatting controls are present. This setting can be used to remove formatting controls that would make content [interactive](https://html.spec.whatwg.org/multipage/dom.html#interactive-content). This is useful if you want to make content that is already interactive editable.

### `isSelected: Boolean`

*Optional.* Whether to show the input is selected or not in order to show the formatting controls. By default it renders the controls when the block is selected.

### `autocompleters: Array<Completer>`

*Optional.* A list of autocompleters to use instead of the default.

## RichText.Content

`RichText.Content` should be used in the `save` function of your block to correctly save rich text content.

## Example

{% codetabs %}
{% ES5 %}
```js
wp.blocks.registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			source: 'html',
			selector: 'h2',
		},
	},

	edit: function( props ) {
		return wp.element.createElement( wp.editor.RichText, {
			tagName: 'h2',
			className: props.className,
			value: props.attributes.content,
			onChange: function( content ) {
				props.setAttributes( { content: content } );
			}
		} );
	},

	save: function( props ) {
		return wp.element.createElement( wp.editor.RichText.Content, {
			tagName: 'h2', value: props.attributes.content
		} );
	}
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const { RichText } = wp.editor;

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
{% end %}

## RichTextToolbarButton

Slot to extend the format toolbar. Use it in the edit function of a `registerFormatType` call to surface the format to the UI.

### Example

{% codetabs %}
{% ES5 %}
```js
wp.richText.registerFormatType( /* ... */, {
	/* ... */
	edit: function( props ) {
		return wp.element.createElement(
			wp.editor.RichTextToolbarButton, {
				icon: 'editor-code',
				title: 'My formatting button',
				onClick: function() { /* ... */ }
				isActive: props.isActive,
			} );
	},
	/* ... */
} );
```
{% ESNext %}
```js
import { registerFormatType } from 'wp-rich-text';
import { richTextToolbarButton } from 'wp-editor';

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
{% end %}
