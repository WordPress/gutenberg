CodeEditor
=======

CodeEditor is a React component that provides the user with a code editor
that has syntax highlighting and linting.

The components acts as a drop-in replacement for a <textarea>, and uses the
CodeMirror library that is provided as part of WordPress Core.

## Usage

```jsx
import { CodeEditor } from '@wordpress/components';

function editCode() {
	return (
		<CodeEditor
			value={ '<p>This is some <b>HTML</b> code that will have syntax highlighting!</p>' }
			onChange={ value => console.log( value ) }
		/>
	);
}
```

## Props

The component accepts the following props:

### value

The source code to load into the code editor.

- Type: `string`
- Required: Yes

### focus

Whether or not the code editor should be focused.

- Type: `boolean`
- Required: No

### onFocus

The function called when the editor is focused.

- Type: `Function`
- Required: No

### onChange

The function called when the user has modified the source code via the
editor. It is passed the new value as an argument.

- Type: `Function`
- Required: No

### settings

Used to setup the Code Editor and includes options for linting and CodeMirror. By default this will use window._wpGutenbergCodeEditorSettings.

- Type: `Object`
- Required: No

### editorRef

A reference to the initialized editor so that it can be dynamically updated from a parent component:

`editorRef={ ( ref ) => this.editorInstance = ref }`

This allows an external component to make changes to the code editor by modifying or updating `this.editorInstance`.

- Type `Function`
- Required: No
