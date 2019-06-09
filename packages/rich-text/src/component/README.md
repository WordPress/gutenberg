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

### `isSelected: Boolean`

*Optional.* Whether to show the input is selected or not in order to show the formatting controls. By default it renders the controls when the block is selected.

### `keepPlaceholderOnFocus: Boolean`

*Optional.* By default, the placeholder will hide as soon as the editable field receives focus. With this setting it can be be kept while the field is focussed and empty.

## Example

{% codetabs %}
{% ES5 %}
```js
wp.element.createElement( wp.editor.RichText, {
	tagName: 'h2',
	value: value,
	onChange: function( content ) {}
} );
```
{% ESNext %}
```js
const { RichText } = wp.editor;

<RichText
	tagName="h2"
	value={ value }
	onChange={ ( content ) => {} }
/>
```
{% end %}
