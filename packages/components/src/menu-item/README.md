# MenuItem

MenuItem is a component which renders a button intended to be used in combination with the [DropdownMenu component](/packages/components/src/dropdown-menu/README.md).

## Usage

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

## Props

MenuItem supports the following props. Any additional props are passed through to the underlying [Button](/packages/components/src/button/README.md).

### `children`

- Type: `WPElement`
- Required: No

Element to render as child of button.

### `info`

- Type: `string`
- Required: No

Text to use as description for button text.

Refer to documentation for [`label`](#label).

### `icon`

- Type: `string`
- Required: No

Refer to documentation for [Button's `icon` prop](/packages/components/src/icon-button/README.md#icon).

### `isSelected`

- Type: `boolean`
- Required: No

Whether or not the menu item is currently selected.

### `shortcut`

- Type: `string`
- Required: No

Refer to documentation for [Shortcut's `shortcut` prop](/packages/components/src/shortcut/README.md#shortcut).

### `role`

- Type: `string`
- Require: No
- Default: `'menuitem'`

[Aria Spec](https://www.w3.org/TR/wai-aria-1.1/#aria-checked). If you need to have selectable menu items use menuitemradio for single select, and menuitemcheckbox for multiselect.
