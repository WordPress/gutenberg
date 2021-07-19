## Alignment Control

The `AlignmentControl` component renders a dropdown menu that displays alignment options for the selected block.

This component is mostly used for blocks that display text, such as Heading, Paragraph, Post Author, Post Comments, Verse, Quote, Post Title, etc... And the available alignment options are `left`, `center` or `right` alignment.

![Post Title block alignment options](https://make.wordpress.org/core/files/2020/09/post-title-block-alignment-options.png)

## Table of contents

1. [Development guidelines](#development-guidelines)
2. [Related components](#related-components)

## Development guidelines

### Usage

Renders an alignment toolbar with alignments options.

```jsx
import { AlignmentControl } from '@wordpress/block-editor';

const MyAlignmentToolbar = () => (
	<BlockControls group="block">
		<AlignmentControl
			value={ textAlign }
			onChange={ ( nextAlign ) => {
				setAttributes( { textAlign: nextAlign } );
			} }
		/>
	</BlockControls>
);
```

_Note:_ In this example that we render `AlignmentControl` as a child of the `BlockControls` component.

### Props

### `value`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Options:**: `left`, `center`, `right`

The current value of the alignment setting. You may only choose from the `Options` listed above.

### `placeholder`
-   **Type:** `String`
-   **Default:** `left` for left-to-right languages, `right` for right-to-left languages
-   **Options:**: `left`, `center`, `right`

The placeholder alignment value that will be reflected by the toolbar icon when the value is `undefined`. If the content inside your block is aligned to center when no specific `value` is defined, you should set `placeholder` to `center`.

### `onChange`

-   **Type:** `Function`

A callback function invoked when the toolbar's alignment value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie: `left`, `center`, `right`, `undefined`) as the only argument.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
