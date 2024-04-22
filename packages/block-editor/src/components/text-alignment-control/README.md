# TextAlignmentControl

The `TextAlignmentControl` component is responsible for rendering a control element that allows users to select and apply text align options to blocks or elements in the Gutenberg editor. It provides an intuitive interface for changing the text alignment by applying different alignments such as `left`, `center`, `right`.

## Development guidelines

### Usage

Renders the Text Align Component with `left`, `center`, `right` options.

```jsx
import { TextAlignmentControl } from '@wordpress/block-editor';

const MyTextAlignmentControlComponent = () => (
	<TextAlignmentControl
		value={ textTransform }
		onChange={ ( value ) => {
			setAttributes( { textTransform: value } );
		} }
	/>
);
```

### Props

The component accepts the following props.

#### value

The current value of the Text Alignment setting. Available options are `left|center|right|justify`.

-   Type: `String`
-   Required: No

#### controls

An array of strings for what controls to show, by default it shows all. Available options are `left|center|right|justify`.

-   Type: `Array`
-   Required: No

#### onChange

Callback when the `value` changes.

-   Type: `Function`
-   Required: Yes

#### className

A string of classes to be added to the control component.

-   Type: `String`
-   Required: No
