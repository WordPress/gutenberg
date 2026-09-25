# Block Edit Visually Button

`BlockEditVisuallyButton` renders the toolbar button that takes a block out of the HTML editor and back to the visual editor. It is the toolbar counterpart of the "Edit as HTML" / "Edit visually" item that [`BlockSettingsMenu`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-settings-menu/README.md) renders, and it exists so that a block being edited as HTML always offers a visible way back without opening the settings menu.

_Note:_ This component is internal to the block editor and is not exported from `@wordpress/block-editor`. It is rendered by [`BlockToolbar`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-toolbar/README.md); it is documented here for contributors working on the block toolbar rather than as public API.

## Development guidelines

The button renders only when a single block is selected and that block's mode is `html`, so it is safe to render unconditionally alongside the rest of the toolbar: with a multi-block selection, or with a block in visual mode, it returns `null`. Clicking it dispatches `toggleBlockMode` for the selected block, which flips the mode back to `visual`.

Note that the two entry points are not gated the same way. The settings menu item is only rendered for a valid block that supports `html` editing while the `codeEditingEnabled` setting is on, whereas this button checks the block's mode alone. Whatever put the block into HTML mode, the toolbar button is there to bring it back.

### Usage

```jsx
import { ToolbarGroup } from '@wordpress/components';

function MyBlockToolbar( { clientIds } ) {
	return (
		<div className="my-block-toolbar">
			<ToolbarGroup>{ /* Block controls. */ }</ToolbarGroup>
			<BlockEditVisuallyButton clientIds={ clientIds } />
		</div>
	);
}
```

### Props

#### `clientIds`

-   **Type:** `Array`
-   **Required:** Yes

The client IDs of the currently selected blocks. The button renders only when the array contains exactly one client ID, since editing visually applies to a single block.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
