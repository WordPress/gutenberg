NavigableMenu
=============

NavigableMenu is a React component to render a menu navigable using arrow keys. The children of the menu must be tabbables

## Usage


```jsx
import { NavigableMenu, Button } from '@wordpress/components';

function MyMenu() {
	return (
		<NavigableMenu>
			<Button>My Button 1</Button>
			<Button>My Button 2</Button>
			<Button>My Button 3</Button>
		</NavigableMenu>
	);
}
```

## Props

The component accepts the following props. Props not included in this set will be applied to the element wrapping Navigable Menu.

### orientation

The orientation of the menu. It could be "vertical" or "horizontal"

- Type: `String`
- Required: No
- Default: `"vertical"`

## onNavigate

A callback invoked when the menu navigates to one of its children passing the index as an argument

- Type: `Function`
- Required: No

## deep

A boolean to look for navigable children in the direct children or any descendant.

- Type: `Boolean`
- Required: No
- default: false
