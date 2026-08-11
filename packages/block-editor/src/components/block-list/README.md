# Block List

The `BlockList` component is responsible for rendering a list of blocks within the WordPress block editor. It manages the layout, interactions, and UI behaviors for blocks within the editor interface, such as selection handling, focus management, and appender display.

## Usage

`BlockList` must be rendered within a `BlockEditorProvider`, and is usually placed inside a `BlockCanvas` so that the blocks render in the editor's writing flow.

```jsx
import {
	BlockCanvas,
	BlockEditorProvider,
	BlockList,
} from '@wordpress/block-editor';

function MyEditor() {
	const [ blocks, setBlocks ] = useState( [] );

	return (
		<BlockEditorProvider value={ blocks } onChange={ setBlocks }>
			<BlockCanvas height="400px">
				<BlockList className="my-editor-block-list" />
			</BlockCanvas>
		</BlockEditorProvider>
	);
}
```

## Props

| Prop                            | Type                 | Description                                                                                                                                                                            |
| ------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `className`                     | `string?`            | Additional class name applied to the block list's root container.                                                                                                                      |
| `rootClientId`                  | `string?`            | The client ID of the root block whose inner blocks will be rendered. If omitted, renders the top-level blocks.                                                                         |
| `placeholder`                   | `ReactNode?`         | Placeholder content displayed when no blocks are present.                                                                                                                              |
| `renderAppender`                | `Function \| false?` | Custom function to render an appender component (e.g., the "+" button for adding new blocks). Pass `false` to suppress the appender entirely. Defaults to the standard block appender. |
| `__experimentalAppenderTagName` | `string?`            | Tag name for the appender element.                                                                                                                                                     |
| `layout`                        | `Object?`            | The layout configuration for blocks, affecting their positioning and arrangement.                                                                                                      |

## Development guidelines

`BlockList` is primarily used internally by the editor, but it is exported for consumers building their own block editor UI. It handles:

-   **Block rendering:** Displays a list of blocks based on the provided `rootClientId`.
-   **Selection and focus handling:** Manages block selection, focus state, and block visibility.
-   **Zoom-out mode:** Provides UI behavior for zooming out from nested block structures.
-   **Block editing mode integration:** Supports different block editing modes, including content-only editing and disabled states.
-   **Block appender support:** Displays an appender UI when appropriate, allowing users to insert new blocks.

To render the inner blocks of a specific block instead, prefer `useInnerBlocksProps` from the [`InnerBlocks`](../inner-blocks) component, which wires up the correct context for nested block lists.

## Related components

-   `BlockListBlock` - Renders individual blocks within the `BlockList`.
-   `BlockListAppender` - Provides UI for adding new blocks.
-   [`useInnerBlocksProps`](../inner-blocks) - Hook for managing inner blocks and their props.
