# ToolbarItem

A ToolbarItem is a generic headless component that can be used to make any custom component a [Toolbar](/packages/components/src/toolbar/README.md) item.

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

## Related components

* ToolbarItem should be used inside [Toolbar](/packages/components/src/toolbar/README.md) or [ToolbarGroup](/packages/components/src/toolbar-group/README.md).
* If you want a simple toolbar button, consider using [ToolbarButton](/packages/components/src/toolbar-button/README.md) instead.
