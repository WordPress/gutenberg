# Rich Text

This module contains helper functions to convert HTML or a DOM tree into a rich text value and back, and to modify the value with functions that are similar to `String` methods, plus some additional ones for formatting.

## Installation

Install the module

```bash
npm install @wordpress/rich-text
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

### create

```js
create( {
	?element: Element,
	?text: string,
	?html: string,
	?range: Range,
	?multilineTag: string,
	?multilineWrapperTags: Array,
	?removeNode: Function,
	?unwrapNode: Function,
	?filterString: Function,
	?removeAttribute: Function,
} ): Object
```

Create a RichText value from an `Element` tree (DOM), an HTML string or a plain text string, with optionally a `Range` object to set the selection. If called without any arguments, an empty value will be created. If `multilineTag` is provided, any content of direct children whose type matches `multilineTag` will be separated by a line separator. The remaining parameters can be used to filter out content.

### toHTMLString

```js
toHTMLString( {
	value: Object,
	?multilineTag: string,
	?multilineWrapperTags: Array,
} ): string
```

Create an HTML string from a Rich Text value. If a `multilineTag` is provided, text separated by a line separator will be wrapped in it.

### apply

```js
apply( {
	value: Object,
	current: Element,
	?multilineTag: string
	?multilineWrapperTags: Array,
	?createLinePadding: Function,
} ): void
```

Create an `Element` tree from a Rich Text value and applies the difference to the `Element` tree contained by `current`. If a `multilineTag` is provided, text separated by two new lines will be wrapped in an `Element` of that type.

### isCollapsed

```js
isCollapsed( value: Object ): ?boolean
```

Check if the selection of a Rich Text value is collapsed or not. Collapsed means that no characters are selected, but there is a caret present. If there is no selection, `undefined` will be returned. This is similar to `window.getSelection().isCollapsed()`.

### isEmpty

```js
isEmpty( value: Object ): boolean
```

Check if a Rich Text value is Empty, meaning it contains no text or any objects (such as images).

### applyFormat

```js
applyFormat( value: Object, format: Object, ?startIndex: number, ?endIndex: number ): Object
```

Apply a format object to a Rich Text value from the given `startIndex` to the given `endIndex`. Indices are retrieved from the selection if none are provided.

### removeFormat

```js
removeFormat( value: Object, formatType: string, ?startIndex: number, ?endIndex: number ): Object
```

Remove any format object from a Rich Text value by type from the given `startIndex` to the given `endIndex`. Indices are retrieved from the selection if none are provided.

### toggleFormat

```js
toggleFormat( value: Object, format: Object ): Object
```

Toggles a format object to a Rich Text value at the current selection, and returns a new value with the format applied or removed.

### getActiveFormat

```js
getActiveFormat( value: Object, formatType: string ): ?Object
```

Get any format object by type at the start of the selection. This can be used to get e.g. the URL of a link format at the current selection, but also to check if a format is active at the selection. Returns undefined if there is no format at the selection.

### getTextContent

```js
getTextContent( value: Object ): string
```

Get the textual content of a Rich Text value. This is similar to `Element.textContent`.

### slice

```js
slice( value: Object, ?startIndex: number, ?endIndex: number ): Object
```

Slice a Rich Text value from `startIndex` to `endIndex`. Indices are retrieved from the selection if none are provided. This is similar to `String.prototype.slice`.

### replace

```js
replace( value: Object, pattern: RegExp, replacement: Object | string ): Object
```

Search a Rich Text value and replace the match(es) with `replacement`. This is similar to `String.prototype.replace`.

### insert

```js
insert( value: Object, valueToInsert: Object | string, ?startIndex: number, ?endIndex: number ): Object
```

Insert a Rich Text value, an HTML string, or a plain text string, into a Rich Text value at the given `startIndex`. Any content between `startIndex` and `endIndex` will be removed. Indices are retrieved from the selection if none are provided.

### registerFormatType

```js
registerFormatType( name: String, settings: Object ): ?WPformat
```

Registers a new format provided a unique name and an object defining its behavior. Settings object:

- `tagName`: String. The HTML tag this format will wrap the selection with.
- `className`: String || null. A class to match the format.
- `title`: String. Name of the format.
- `edit`: function. Should return a component for the user to interact with the new registered format.

### remove

```js
remove( value: Object, ?startIndex: number, ?endIndex: number ): Object
```

Remove content from a Rich Text value between the given `startIndex` and `endIndex`. Indices are retrieved from the selection if none are provided.

### split

```js
split( value: Object, ?startIndex: number | string | RegExp, ?endIndex: number ): Array<Object>
```

Split a Rich Text value in two at the given `startIndex` and `endIndex`, or split at the given separator. This is similar to `String.prototype.split`. Indices are retrieved from the selection if none are provided.

### join

```js
join( values: Array<Object>, ?separator: Object | string ): Object
```

Combine an array of Rich Text values into one, optionally separated by `separator`, which can be a Rich Text value, HTML string, or plain text string. This is similar to `Array.prototype.join`.

### concat

```js
concat( ...values: Array<Object> ): Object
```

Combine all Rich Text values into one. This is similar to `String.prototype.concat`.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
