# `CodeEditor`

Render a code editing input powered by CodeMirror 6 with language support for HTML, CSS, and JavaScript.

## Properties

### `value: string`

_Required._ Current editor value.

### `onChange( value: string ): Function`

_Required._ Called when the editor content changes.

### `mode: 'html' | 'css' | 'javascript' | 'js'`

_Optional._ Syntax mode. Defaults to `html`.

### `placeholder: string`

_Optional._ Placeholder text used by the fallback plain-text input.

### `className: string`

_Optional._ Additional CSS class name.

### `editorId: string`

_Optional._ ID assigned to the editor container.

### `editorInstructionsText: string`

_Optional._ Additional text announced to assistive technologies.

### `aria-label: string`

_Optional._ Accessible label for the editor.

## Example

```js
import { CodeEditor } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

export default function Edit() {
	const [ value, setValue ] = useState( '<p>Hello world</p>' );

	return (
		<CodeEditor
			mode="html"
			value={ value }
			onChange={ setValue }
			aria-label="Template markup"
		/>
	);
}
```
