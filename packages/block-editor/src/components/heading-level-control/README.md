## Heading Level Control

The `HeadingLevelControl` component renders a dropdown menu that displays heading level options for the selected block.

This component renders a dropdown menu that displays heading level options for the selected block. This component is used to set the level of the heading in a block and also allows to use a `paragraph` element by setting the level to zero (`0`). The block's `edit` function would also need to handle the zero value. An example of this would be `const TagName = level === 0 ? 'p' : `h${ level }`;`

See the Heading block for an example usage.

## Development guidelines

### Usage

Renders a heading level control with options.

```jsx
import { BlockControls, HeadingLevelControl } from '@wordpress/block-editor';

const MyHeadingLevelControl = ( { attributes, setAttributes } ) => (
	<BlockControls group="block">
		<HeadingLevelControl
			value={ attributes.level }
			onChange={ ( next ) => {
				setAttributes( { level: next } );
			} }
		/>
	</BlockControls>
);
```

### Props

#### `value`

-   **Type:** `Number`
-   **Options:**: `1`, `2`, `3`, `4`, `5`, `6` and `0` if `isParagraphAllowed` is set to `true`

The current selected level of the block. Only the `Options` listed above are supported.

#### `onChange`

-   **Type:** `Function`
-   **Required:** Yes

A callback function invoked when the toolbar's heading value is changed via an interaction with any of the toolbar's buttons. Called with the new level value as the only argument.

#### `isParagraphAllowed`

-   **Type:** `Boolean`
-   **Default:** `false`
-   **Required:** No

Append `paragraph` option with `zero(0)` level to the available levels.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
