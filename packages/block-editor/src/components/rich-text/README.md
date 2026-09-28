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
[`input` and `textarea` attribute of the same name](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/placeholder).

### `disableLineBreaks: Boolean`

_Optional._ Disables inserting line breaks on `Enter` when it is set to `true`

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
	allowedFormats={ [ 'core/bold', 'core/italic' ] } // Allow the content to be made bold or italic, but do not allow other formatting options
	onChange={ ( content ) => setAttributes( { content } ) }
	placeholder={ __( 'Heading...' ) }
/>
```

### `withoutInteractiveFormatting: Boolean`

_Optional._ By default, all formatting controls are present. This setting can be used to remove formatting controls that would make content [interactive](https://html.spec.whatwg.org/multipage/dom.html#interactive-content). This is useful if you want to make content that is already interactive editable.

### `isSelected: Boolean`

_Optional._ Whether to show the input is selected or not in order to show the formatting controls. By default it renders the controls when the block is selected.

### `autocompleters: Array<Completer>`

_Optional._ A list of autocompleters to use instead of the default. See [Autocompleters](#autocompleters) for the completer interface.

### `preserveWhiteSpace: Boolean`

_Optional._ Whether or not to preserve white space characters in the `value`. Normally tab, newline and space characters are collapsed to a single space or
trimmed.

## Autocompleters

Autocompleters enable us to offer users options for completing text input. For example, Gutenberg includes a user autocompleter that provides a list of user names and completes a selection with a user mention like `@mary`.

Each completer declares:

- Its name.
- The text prefix that should trigger the display of completion options.
- Raw option data.
- How to render an option's label.
- An option's keywords, words that will be used to match an option with user input.
- What the completion of an option looks like, including whether it should be inserted in the text or used to replace the current block.

In addition, a completer may optionally declare:

- A class name to be applied to the completion menu.
- Whether it should apply to a specified text node.
- Whether the completer applies in a given context, defined via a Range before and a Range after the autocompletion trigger and query.

### The Completer Interface

#### name

The name of the completer. Useful for identifying a specific completer to be overridden via extensibility hooks. Each completer should have a unique name.

- Type: `String`
- Required: Yes

#### options

The raw options for completion. May be an array, a function that returns an array, or a function that returns a promise for an array.

Options may be of any type or shape. The completer declares how those options are rendered and what their completions should be when selected.

- Type: `Array|Function`
- Required: Yes

#### triggerPrefix

The string prefix that should trigger the completer. For example, Gutenberg's block completer is triggered when the '/' character is entered.

- Type: `String`
- Required: Yes

#### getOptionLabel

A function that returns the label for a given option. A label may be a string or a mixed array of strings, elements, and components.

- Type: `Function`
- Required: Yes

#### getOptionKeywords

A function that returns the keywords for the specified option.

- Type: `Function`
- Required: No

#### isOptionDisabled

A function that returns whether or not the specified option should be disabled. Disabled options cannot be selected.

- Type: `Function`
- Required: No

#### getOptionCompletion

A function that takes an option and responds with how the option should be completed. By default, the result is a value to be inserted in the text. However, a completer may explicitly declare how a completion should be treated by returning an object with `action` and `value` properties. The `action` declares what should be done with the `value`.

There are currently two supported actions:

- "insert-at-caret" - Insert the `value` into the text (the default completion action).
- "replace" - Replace the current block with the block specified in the `value` property.

#### allowContext

A function that takes a Range before and a Range after the autocomplete trigger and query text and returns a boolean indicating whether the completer should be considered for that context.

- Type: `Function`
- Required: No

#### className

A class name to apply to the autocompletion popup menu.

- Type: `String`
- Required: No

#### isDebounced

Whether to debounce the autocompleter. This setting only affects the `options` argument; it is ignored by the `useItems`.

- Type: `Boolean`
- Required: No

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
