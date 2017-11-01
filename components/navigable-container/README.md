NavigableContainer
=============

`NavigableContainer` is a React component to render a container navigable using the keyboard. Only things that are focusable can be navigated to. It will currently always be a `div`.

`NavigableContainer` is exported as three convenience classes: `NavigableMenu`, `NavigableGrid` and `TabbableContainer`. `NavigableContainer` itself is not exported. `NavigableMenu`, `NavigableGrid`, and `TabbableContainer` have some shared props, and some individual props. Any other props will be passed through to the `div`.

----

## Shared Props

These are the props that `NavigableMenu`, `NavigableGrid` and `TabbableContainer` all share.

### cycle

A boolean which tells the component whether or not to cycle from the end back to the beginning and vice versa. If it is false, then as soon as navigation moves outside the component, the keydown event will not be handled.

- Type: `Boolean`
- Required: No
- default: true


### initialSelector

A selector which tells the component what to focus first inside it. If the selector is not matched, the first focusable item will be focused. This can be useful to focus the previously selected descendant when this component get focused.

- Type: `String`
- Required: No

### onNavigate

A callback invoked when the menu navigates to one of its children passing the index and child as an argument

- Type: `Function`
- Required: No

### deep

A boolean to look for navigable children in the direct children or any descendant. True means that any descendant can be considered navigable, and false means only direct children are considered.

- Type: `Boolean`
- Required: No
- default: false


### widget

A boolean which specifies whether or not the focusable elements in this component might contain the focus, rather than have the focus. This is often used for `TabbableContainer` layouts that might have arrow key navigation inside each tabstop.

- Type: `Boolean`
- Required: No
- default: true


### NavigableMenu Usage

A NavigableMenu allows movement up and down (or left and right) the component via the arrow keys. The `tab` key is not handled. The `orientation` prop is used to determine whether the arrow keys used are vertical or horizontal.


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

### Additional Props

#### orientation

The orientation of the menu. It could be "vertical" or "horizontal"

- Type: `String`
- Required: No
- Default: `"vertical"`

#### stopArrowKeys

A boolean which specifies whether to stop the arrow keys that are not being used for navigation from bubbling up the DOM tree. This can be useful if you have a horizontal menu, but you don't want up and down to move the page.

- Type: `Boolean`
- Required: No
- Default: true

----

## NavigableGrid Usage

A NavigableGrid allows movement up and down and left and right through a grid of components using the arrow keys. Note, it expects that the grid is laid out in Left to Right, Top to Bottom DOM ordering.

```jsx
import { NavigableGrid, Button } from '@wordpress/components';

function MyGrid() {
	return (
		<NavigableGrid>
			<Button>My Button 1</Button>
			<Button>My Button 2</Button>
			<Button>My Button 3</Button>
      <Button>My Button 4</Button>
		</NavigableGrid>
	);
}
```
## Additional Props

### width

An integer specifying the number of components that are displayed across the screen in one row. This relates to how the arrow keys will determine what to focus next.

- Type: `Integer`
- Required: No
- Default: 1

----

## TabbableContainer Usage

A `TabbableContainer` will only be navigated using the `TAB` key. Every intended tabstop must have a tabIndex `0`.

```jsx
import { TabbableContainer, Button } from '@wordpress/components';

function MyContainer() {
	return (
		<TabbableContainer>
			<div tabIndex="0">Section 1</div>
			<div tabIndex="0">Section 2</div>
			<div tabIndex="0">Section 3</div>
      <div tabIndex="0">Section 4</div>
		</TabbableContainer>
	);
}
```

`TabbableContainer` has no additional props. It does however, set change `widget`'s default value to `true`.

