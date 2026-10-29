# Block Toolbar

The `BlockToolbar` component is used to render a toolbar that serves as a wrapper for number of options for each block.

![Paragraph block toolbar](https://make.wordpress.org/core/files/2020/09/paragraph-block-toolbar.png)

![Image block toolbar](https://make.wordpress.org/core/files/2020/09/image-block-toolbar.png)

## Development guidelines

### Usage

Displays a block toolbar for a selected block.

```jsx
import { BlockToolbar } from '@wordpress/block-editor';

const MyBlockToolbar = () => <BlockToolbar />;
```

## Toolbar groups

This section describes the block toolbar of the block toolbar redesign experiment, which you can enable under Gutenberg > Experiments > Block toolbar redesign. It reflects the direction in [#85204](https://github.com/WordPress/gutenberg/issues/85204) and will change as the experiment does.

### Design principles

-   **Style goes in the menu; structure stays top-level.** Style choices that usually come from Global Styles, such as text alignment and typography, belong in the options menu. Choices made for each block individually, such as a container's layout or inserting into it, can keep a place in the toolbar.
-   **Icons must be recognizable or labelled.** Icon-only buttons are only for icons people know from across the web (bold, link, arrows, plus, trash), and they still get a tooltip. Everything else gets a visible text label.
-   **The toolbar is always in the same place**, whatever the block hierarchy. The parent selector sits outside the block, to the left of the toolbar, and the toolbar only moves when the parent selector would otherwise be cut off at the edge of the canvas.
-   **Block tools and text tools are separate.** Block tools act on the block. Formatting appears in a toolbar of its own when text is selected.

### The groups, in order

1. **Block name.** The block's icon and name, which open one menu to transform the block (Heading, List, Quote, and the rest under More), switch between its variations (such as heading levels), and pick a style preset. A locked block shows a lock in place of its icon. Blocks should not add their own transform controls; register transforms, transform variations and block styles instead.
2. **Movers.** The drag handle and full-size move buttons.
3. **Primary actions.** The `block`, `default`, `parent` and `other` groups of `BlockControls`. Container blocks also get a Layout menu, with their width and layout settings, and a button that adds a block inside them. Most atomic blocks, such as Paragraph and Heading, add nothing here.
4. **Options and Delete.** The options menu, which is searchable, and a Delete button for every block.

The `inline` group of `BlockControls` is not shown: rich text formats appear in the selection toolbar, and inserting formats (Inline image, Footnote, Math) are in the Insert submenu of the options menu.

### The options menu

-   **Align:** Text and Block, each showing its current value. They come from the `typography.textAlign` and `align` block supports.
-   **Format:** the bold and italic formats, for formatting without a text selection, such as turning on bold and then typing.
-   **Styles:** Copy styles and Paste styles.
-   **Insert:** inline inserting formats, then Block before and Block after.
-   **Clipboard:** Copy, Cut and Duplicate.
-   **Actions:** Group or Ungroup, Create pattern, and actions added by other packages.
-   **More:** Lock, Rename, Hide, Edit as HTML, actions added by other packages, and items added with `BlockSettingsMenuControls`.

### Does an action earn a place in the primary actions slot?

Ask these questions in order:

1. Is it a style choice that usually comes from Global Styles? Then it belongs in the options menu, or the block inspector.
2. Is it a structural action that people take for this block in particular and often, such as replacing or cropping an image, editing a button's link, or a container's layout? Then it can go in the primary actions slot.
3. Is its icon one people know from across the web? If not, give the button a visible text label, like the Layout button, or put the action in the options menu where every item has a label.

### Adding items to the menus

Packages that are part of WordPress can add items to the options menu with the private `BlockOptionsMenuItemFill` and `BlockOptionsMenuItem` components. The menu reads the item's props rather than rendering it, so the item can also be found by searching. Render any UI the item opens, such as a modal, outside the fill, because the menu unmounts its items when it closes.

```jsx
const { BlockOptionsMenuItem, BlockOptionsMenuItemFill } = unlock(
	blockEditorPrivateApis
);

<BlockOptionsMenuItemFill>
	{ ( { clientIds } ) => (
		<BlockOptionsMenuItem
			group="more"
			name="my-package/do-something"
			label={ __( 'Do something' ) }
			onClick={ () => doSomething( clientIds ) }
		/>
	) }
</BlockOptionsMenuItemFill>;
```

Items added with `BlockSettingsMenuControls` keep working: they appear at the end of the More submenu.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
