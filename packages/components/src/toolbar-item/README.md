# ToolbarItem

A ToolbarItem is a generic headless component that can be used to make any custom component a [Toolbar](/packages/components/src/toolbar/README.md) item. It should be inside a [Toolbar](/packages/components/src/toolbar/README.md) or [ToolbarGroup](/packages/components/src/toolbar-group/README.md) when used to create general interfaces. If you're using it to add controls to your custom block, you should consider using [BlockControls](/docs/how-to-guides/block-tutorial/block-controls-toolbar-and-sidebar.md).

## Usage

### `as` prop

You can use the `as` prop with a custom component or any HTML element.

```jsx
import { Toolbar, ToolbarItem, Button } from '@wordpress/components';

function MyToolbar() {
	return (
		<Toolbar label="Options">
			<ToolbarItem as={ Button }>I am a toolbar button</ToolbarItem>
			<ToolbarItem as="button">I am another toolbar button</ToolbarItem>
		</Toolbar>
	);
}
```

### render prop

You can pass children as function to get the ToolbarItem props and pass them to another component.

```jsx
import { Toolbar, ToolbarItem, DropdownMenu } from '@wordpress/components';
import { table } from '@wordpress/icons';

function MyToolbar() {
	return (
		<Toolbar label="Options">
			<ToolbarItem>
				{ ( toolbarItemHTMLProps ) => (
					<DropdownMenu
						icon={ table }
						toggleProps={ toolbarItemHTMLProps }
						label={ 'Edit table' }
						controls={ [] }
					/>
				) }
			</ToolbarItem>
		</Toolbar>
	);
}
```

### Inside BlockControls

If you're working on a custom block and you want to add controls to the block toolbar, you should use [BlockControls](/docs/how-to-guides/block-tutorial/block-controls-toolbar-and-sidebar.md) instead. Optionally wrapping it with [ToolbarGroup](/packages/components/src/toolbar-group/README.md).

```jsx
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarItem, Button } from '@wordpress/components';

function Edit() {
	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarItem as={ Button }>I am a toolbar button</ToolbarItem>
			</ToolbarGroup>
		</BlockControls>
	);
}
```

## Related components

-   ToolbarItem should be used inside [Toolbar](/packages/components/src/toolbar/README.md) or [ToolbarGroup](/packages/components/src/toolbar-group/README.md).
-   If you want a simple toolbar button, consider using [ToolbarButton](/packages/components/src/toolbar-button/README.md) instead.
