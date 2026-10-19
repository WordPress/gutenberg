# Block List

The `BlockList` component is responsible for rendering a list of blocks within the WordPress block editor. It manages the layout, interactions, and UI behaviors for blocks within the editor interface, such as selection handling, focus management, and appender display.

## Development guidelines

`BlockList` is primarily used internally by the editor, but it is exported for consumers building their own block editor UI. It handles:

-   **Block rendering:** Displays a list of blocks based on the provided `rootClientId`.
-   **Selection and focus handling:** Manages block selection, focus state, and block visibility.
-   **Zoom-out mode:** Provides UI behavior for zooming out from nested block structures.
-   **Block editing mode integration:** Supports different block editing modes, including content-only editing and disabled states.
-   **Block appender support:** Displays an appender UI when appropriate, allowing users to insert new blocks.

To render the inner blocks of a specific block instead, prefer `useInnerBlocksProps` from the `InnerBlocks` component, which wires up the correct context for nested block lists.

### Usage

`BlockList` must be rendered within a `BlockEditorProvider`, and is usually placed inside a `BlockCanvas` so that the blocks render in the editor's writing flow.

```jsx
import { useState } from 'react';
import {
	BlockCanvas,
	BlockEditorProvider,
	BlockList,
} from '@wordpress/block-editor';

function MyEditor() {
	const [ blocks, setBlocks ] = useState( [] );

	return (
		<BlockEditorProvider
			value={ blocks }
			onInput={ setBlocks }
			onChange={ setBlocks }
		>
			<BlockCanvas height="400px">
				<BlockList className="my-editor-block-list" />
			</BlockCanvas>
		</BlockEditorProvider>
	);
}
```

### Props

#### `className`

-   **Type:** `String`
-   **Required:** No

Additional class name applied to the block list's root container.

#### `rootClientId`

-   **Type:** `String`
-   **Required:** No

The client ID of the root block whose inner blocks will be rendered. If omitted, the top-level blocks are rendered.

#### `placeholder`

-   **Type:** `ReactNode`
-   **Required:** No

Content displayed in place of the blocks when the list is empty.

#### `renderAppender`

-   **Type:** `Function|false`
-   **Required:** No

A function rendering a custom appender, the UI used to insert new blocks at the end of the list. Pass `false` to suppress the appender entirely. When omitted, the standard block appender is rendered where appropriate.

#### `layout`

-   **Type:** `Object`
-   **Required:** No
-   **Default:** `{ type: 'default' }`

The layout configuration applied to the blocks, affecting their positioning and arrangement.

#### `__experimentalAppenderTagName`

-   **Type:** `String`
-   **Required:** No
-   **Default:** `'div'`

The tag name used for the appender element.

_Note:_ This prop is experimental and may be removed or changed without notice.

## Related components

-   `BlockListBlock` - Renders individual blocks within the `BlockList`.
-   `BlockListAppender` - Provides UI for adding new blocks.
-   `useInnerBlocksProps` - Hook for managing inner blocks and their props.
