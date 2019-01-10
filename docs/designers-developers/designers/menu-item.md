# MenuItem

`MenuItem` is a component which renders a button intended to be used in combination with the `MenuGroup` component.

![An image of a MenuItem being highlighted inside of a DropdownMenu component](https://wordpress.org/gutenberg/files/2018/11/MenuItem.png)

1. MenuItem

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

### Usage

A `MenuGroup` containing `MenuItem`s can be used within a `Dropdown`. A `MenuGroup` can also have other `MenuGroup`s within it so menus can be nested.

## Development guidelines

### Usage

```jsx
import { MenuItem } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyMenuItem = withState( {
	isActive: true,
} )( ( { isActive, setState } ) => (
	<MenuItem
		icon={ isActive ? 'yes' : 'no' }
		isSelected={ isActive }
		onClick={ () => setState( state => ( { isActive: ! state.isActive } ) ) }
	>
		Toggle
	</MenuItem>
) );
```

### Props

`MenuItem` supports the following props. Any additional props are passed through to the underlying [Button](../button) or [IconButton](../icon-button) component.

#### `children`

- Type: `WPElement`
- Required: No

Element to render as child of button.

Element

#### `label`

- Type: `string`
- Required: No

String to use as primary button label text, applied as `aria-label`. Useful in cases where an `info` prop is passed, where `label` should be the minimal text of the button, described in further detail by `info`.

Defaults to the value of `children`, if `children` is passed as a string.

#### `info`

- Type: `string`
- Required: No

Text to use as description for button text.

Refer to documentation for [`label`](#label).

#### `icon`

- Type: `string`
- Required: No

Refer to documentation for [IconButton's `icon` prop](../icon-button/README.md#icon).

#### `shortcut`

- Type: `string`
- Required: No

Refer to documentation for [Shortcut's `shortcut` prop](../shortcut/README.md#shortcut).

#### `role`

- Type: `string`
- Require: No
- Default: `'menuitem'`

[Aria Spec](https://www.w3.org/TR/wai-aria-1.1/#aria-checked). If you need to have selectable menu items use `MenuItemRadio` for single select, and `MenuItemCheckbox` for multiselect.

## Related components

- The `DropdownMenu` displays a list of actions (each contained in a `MenuItem`, `MenuItemsChoice`, or `MenuGroup`) in a compact way. It appears in a `Popover` after the user has interacted with an element (a button or icon) or when they perform a specific action.
- `MenuItemsChoice`
