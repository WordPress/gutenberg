# Line Height Control

The `LineHeightControl` component adds a lineHeight attribute to the core Paragraph and Heading blocks. This allows to update a paragraph line height directly from the block editor interface.

![Line height control in a paragraph block](https://make.wordpress.org/core/files/2020/09/line-height-for-paragraph-block.png)

_Note:_ It is worth noting that the line height setting option is an opt-in feature. [Themes need to declare support for it](/docs/how-to-guides/themes/theme-support.md#supporting-custom-line-heights) before it'll be available.

## Development guidelines

### Usage

Renders the markup for the line height setting option in the block inspector.

```jsx
import { LineHeightControl } from '@wordpress/block-editor';
const MyLineHeightControl = () => (
	<LineHeightControl
		value={ lineHeight }
		onChange={ onChange }
	/>
);
```

### Props

#### `value`

-   **Type:** `String` or `Number` or `Undefined`

The value of the line height.

#### `onChange`

-   **Type:** `Function`

A callback function that handles the application of the line height value.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
