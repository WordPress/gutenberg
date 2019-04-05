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

### Props

The component accepts the following props:

#### icon

The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug to be shown in the collapsed menu button.

- Type: `String`
- Required: No
- Default: `"menu"`

See also: [https://developer.wordpress.org/resource/dashicons/](https://developer.wordpress.org/resource/dashicons/)

#### label

A human-readable label to present as accessibility text on the focused collapsed menu button.

- Type: `String`
- Required: Yes

#### menuLabel

A human-readable label to present as accessibility text on the expanded menu container.

- Type: `String`
- Required: No

#### position

The direction in which the menu should open. Specify y- and x-axis as a space-separated string. Supports `"top"`, `"middle"`, `"bottom"` y axis, and `"left"`, `"center"`, `"right"` x axis.

- Type: `String`
- Required: No
- Default: `"top center"`

#### controls

An array of objects describing the options to be shown in the expanded menu.

Each object should include an `icon` [Dashicon](https://developer.wordpress.org/resource/dashicons/) slug string, a human-readable `title` string, `isDisabled` boolean flag and an `onClick` function callback to invoke when the option is selected.

- Type: `Array`
- Required: Yes

See also: [https://developer.wordpress.org/resource/dashicons/](https://developer.wordpress.org/resource/dashicons/)

#### className

A class name to apply to the dropdown wrapper element.

- Type: `String`
- Required: No
