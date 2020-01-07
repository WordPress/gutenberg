# DropdownMenu

The DropdownMenu displays a list of actions (each contained in a MenuItem, MenuItemsChoice, or MenuGroup) in a compact way. It appears in a Popover after the user has interacted with an element (a button or icon) or when they perform a specific action. 

![An expanded DropdownMenu, containing a list of MenuItems.](https://wordpress.org/gutenberg/files/2019/01/DropdownMenuExample.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)

## Anatomy

![Anatomy of a DropdownMenu.](https://wordpress.org/gutenberg/files/2019/01/DropdownMenuAnatomy.png)

1. Popover: a container component in which the DropdownMenu is wrapped.
2. Parent button: the icon or button that is used to toggle the display of the Popover containing the DropdownMenu.
3. MenuItem: the list items within the DropdownMenu.

## Design guidelines

### Usage

#### When to use a DropdownMenu

Use a DropdownMenu when you want users to:

- Choose an action or change a setting from a list, AND
- Only see the available choices contextually.

If you need to display all the available options at all times, consider using a Toolbar instead.

![Use a DropdownMenu to display a list of actions after the user interacts with an icon.](https://wordpress.org/gutenberg/files/2019/01/DropdownMenuDo.png)

**Do**
Use a DropdownMenu to display a list of actions after the user interacts with an icon.

![Don’t use a DropdownMenu for important actions that should always be visible. Use a Toolbar instead.](https://wordpress.org/gutenberg/files/2019/01/DropdownMenuDont.png)

**Don’t**
Don’t use a DropdownMenu for frequently used actions. Use a Toolbar instead.

#### Behavior

Generally, the parent button should have a triangular icon to the right of the icon or text to indicate that interacting with it will show a DropdownMenu. In rare cases where the parent button directly indicates that there'll be more content (through the use of an ellipsis or "More" label), this can be omitted.

The parent button should retain the same visual styling regardless of whether the DropdownMenu is displayed or not.

#### Placement

The DropdownMenu should typically appear directly below, or below and to the left of, the parent button. If there isn’t enough space below to display the full DropdownMenu, it can be displayed instead above the parent button.

## Development guidelines

DropdownMenu is a React component to render an expandable menu of buttons. It is similar in purpose to a `<select>` element, with the distinction that it does not maintain a value. Instead, each option behaves as an action button.

### Usage

Render a Dropdown Menu with a set of controls:

```jsx
import { DropdownMenu } from '@wordpress/components';

const MyDropdownMenu = () => (
	<DropdownMenu
		icon="move"
		label="Select a direction"
		controls={ [
			{
				title: 'Up',
				icon: 'arrow-up-alt',
				onClick: () => console.log( 'up' )
			},
			{
				title: 'Right',
				icon: 'arrow-right-alt',
				onClick: () => console.log( 'right' )
			},
			{
				title: 'Down',
				icon: 'arrow-down-alt',
				onClick: () => console.log( 'down' )
			},
			{
				title: 'Left',
				icon: 'arrow-left-alt',
				onClick: () => console.log( 'left' )
			},
		] }
	/>
);
```

Alternatively, specify a `children` function which returns elements valid for use in a DropdownMenu: `MenuItem`, `MenuItemsChoice`, or `MenuGroup`.

```jsx
import { Fragment } from '@wordpress/element';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';

const MyDropdownMenu = () => (
	<DropdownMenu
		icon="move"
		label="Select a direction"
	>
		{ ( { onClose } ) => (
			<Fragment>
				<MenuGroup>
					<MenuItem
						icon="arrow-up-alt"
						onClick={ onClose }
					>
						Move Up
					</MenuItem>
					<MenuItem
						icon="arrow-down-alt"
						onClick={ onClose }
					>
						Move Down
					</MenuItem>
				</MenuGroup>
				<MenuGroup>
					<MenuItem
						icon="trash"
						onClick={ onClose }
					>
						Remove
					</MenuItem>
				</MenuGroup>
			</Fragment>
		) }
	</DropdownMenu>
);
```

### Props

The component accepts the following props:

#### icon

The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug to be shown in the collapsed menu button.

- Type: `String|null`
- Required: No
- Default: `"menu"`

See also: [https://developer.wordpress.org/resource/dashicons/](https://developer.wordpress.org/resource/dashicons/)

#### hasArrowIndicator

Whether to display an arrow indicator next to the icon.

- Type: `Boolean`
- Required: No
- Default: `false`

For backward compatibility, when `icon` is explicitly set to `null` then the arrow indicator will be displayed even when this flag is set to `false`.

#### label

A human-readable label to present as accessibility text on the focused collapsed menu button.

- Type: `String`
- Required: Yes

#### controls

An array of objects describing the options to be shown in the expanded menu.

Each object should include an `icon` [Dashicon](https://developer.wordpress.org/resource/dashicons/) slug string, a human-readable `title` string, `isDisabled` boolean flag and an `onClick` function callback to invoke when the option is selected.

A valid DropdownMenu must specify one or the other of a `controls` or `children` prop.

- Type: `Array`
- Required: No

#### children

A [function render prop](https://reactjs.org/docs/render-props.html#using-props-other-than-render) which should return an element or elements valid for use in a DropdownMenu: `MenuItem`, `MenuItemsChoice`, or `MenuGroup`. Its first argument is a props object including the same values as given to a [`Dropdown`'s `renderContent`](/packages/components/src/dropdown#rendercontent) (`isOpen`, `onToggle`, `onClose`).

A valid DropdownMenu must specify one or the other of a `controls` or `children` prop.

- Type: `Function`
- Required: No

See also: [https://developer.wordpress.org/resource/dashicons/](https://developer.wordpress.org/resource/dashicons/)

#### className

A class name to apply to the dropdown menu's toggle element wrapper.

- Type: `String`
- Required: No

#### popoverProps
 
Properties of `popoverProps` object will be passed as props to the nested `Popover` component.
Use this object to modify props available for the `Popover` component that are not already exposed in the `DropdownMenu` component, e.g.: the direction in which the popover should open relative to its parent node set with `position` prop. 
 
 - Type: `Object`
 - Required: No
 
#### toggleProps
  
Properties of `toggleProps` object will be passed as props to the nested `Button` component in the `renderToggle` implementation of the `Dropdown` component used internally.
Use this object to modify props available for the `Button` component that are not already exposed in the `DropdownMenu` component, e.g.: the tooltip text displayed on hover set with `tooltip` prop. 
  
 - Type: `Object`
 - Required: No
 
#### menuProps
   
Properties of `menuProps` object will be passed as props to the nested `NavigableMenu` component in the `renderContent` implementation of the `Dropdown` component used internally.
Use this object to modify props available for the `NavigableMenu` component that are not already exposed in the `DropdownMenu` component, e.g.: the orientation of the menu set with `orientation` prop. 
   
 - Type: `Object`
 - Required: No
