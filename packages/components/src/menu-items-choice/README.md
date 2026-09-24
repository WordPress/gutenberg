# MenuItemsChoice

`MenuItemsChoice` functions similarly to a set of `MenuItem`s, but allows the user to select one option from a set of multiple choices.

![MenuItemsChoice Example](https://wordpress.org/gutenberg/files/2019/03/MenuItemsChoice.png)

## Design guidelines

A `MenuItemsChoice` should be housed within in its own distinct `MenuGroup`, so that the set of options are distinct from nearby `MenuItems`.

### Usage

`MenuItemsChoice` is used in a `DropdownMenu` to present users with a set of options. When one option in a `MenuItemsChoice` is selected, the others are automatically deselected.

![MenuItemsChoice Diagram](https://wordpress.org/gutenberg/files/2019/03/MenuItemsChoice-Checkbox-Keyboard-Shortcut.png)

1. A checkmark icon appears next to the choice when it’s enabled, and disappears when disabled.
2. If an item in `MenuItemsChoice` has an associated keyboard shortcut, that should be displayed to the right of the menu title, aligned to the right side of the menu item. Selected choices should not have visible shortcuts, since they are already active.

#### When to use `MenuItemsChoice`

Use `MenuItemsChoice` when you want users to:

-   Select a single option from a set of choices in a menu.
-   Expose all available options.

`MenuItemsChoice` should not be used to toggle individual features on and off. For that, consider using a `FeatureToggle`.

#### Defaults

When using `MenuItemsChoice` , **one option should be selected by default** (i.e., when the page loads, in the case of a web application).

**User control**

Selecting an option by default communicates that the user is required to choose one in the set.

**Expediting tasks**

When one choice in a set of `MenuItemsChoice` is the most desirable or frequently selected, it’s helpful to select it by default. Doing this reduces the interaction cost and can save the user time and clicks.

**The power of suggestion**

Designs with a `MenuItemsChoice` option selected by default make a strong suggestion to the user. It can help them make the best decision and increase their confidence. (Use this guidance with caution, and only for good.)

## Development guidelines

### Usage

```jsx
import { useState } from 'react';
import { MenuGroup, MenuItemsChoice } from '@wordpress/components';

const MyMenuItemsChoice = () => {
	const [ mode, setMode ] = useState( 'visual' );
	const choices = [
		{
			value: 'visual',
			label: 'Visual editor',
		},
		{
			value: 'text',
			label: 'Code editor',
		},
	];

	return (
		<MenuGroup label="Editor">
			<MenuItemsChoice
				choices={ choices }
				value={ mode }
				onSelect={ ( newMode ) => setMode( newMode ) }
			/>
		</MenuGroup>
	);
};
```
