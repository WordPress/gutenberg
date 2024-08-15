# Block Alignment Toolbar

The `BlockAlignmentToolbar` component is used to render block alignment options in the editor. The different alignment options it provides are `left`, `center`, `right`, `wide` and `full`.

![Image block alignment options](https://make.wordpress.org/core/files/2020/09/image-block-alignment-options.png)

## Development guidelines

### Usage

Renders a block alignment toolbar with alignments options.

```jsx
import { BlockAlignmentToolbar } from '@wordpress/block-editor';

const MyBlockAlignmentToolbar = () => (
	<BlockControls>
		<BlockAlignmentToolbar value={ align } onChange={ updateAlignment } />
	</BlockControls>
);
```

_Note:_ In this example that we render `BlockAlignmentToolbar` as a child of the `BlockControls` component.

### Props

### `value`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Options:**: `left`, `center`, `right`, `wide`, `full`

The current value of the alignment setting. You may only choose from the `Options` listed above.

### `onChange`

-   **Type:** `Function`

A callback function invoked when the toolbar's alignment value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie: `left`, `center`, `right`, `wide`, `full`) as the only argument.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
