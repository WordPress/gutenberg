# MenuItem

MenuItem is a component which renders a button intended to be used in combination with the [DropdownMenu component](/packages/components/src/dropdown-menu/README.md).

## Usage

```jsx
import { useState } from 'react';
import { MenuItem } from '@wordpress/components';

const MyMenuItem = () => {
	const [ isActive, setIsActive ] = useState( true );

	return (
		<MenuItem
			showSelectionIndicator
			isSelected={ isActive }
			role="menuitemcheckbox"
			onClick={ () => setIsActive( ( state ) => ! state ) }
		>
			Toggle
		</MenuItem>
	);
};
```

## Usage guidelines

Use `MenuItemsChoice` for a standard group of mutually exclusive choices. Use `MenuItem` with `role="menuitemcheckbox"` for independent options that can each be enabled or disabled. A custom single-choice composition can use `role="menuitemradio"` when it needs item-level behavior that `MenuItemsChoice` does not expose.

For selectable items, set `showSelectionIndicator` and pass the selection state through `isSelected`. The component renders a leading check mark and keeps its space when unchecked. Do not supply the same check through `icon`; use `icon` for an additional item icon. Descriptions and shortcuts align with the title line, and `suffix` keeps its existing behavior.

Existing compositions that supply their own selection icon continue to work. They do not move automatically to the new layout. To adopt the built-in indicator, remove the supplied check icon and set `showSelectionIndicator`. Consumers need a version of `@wordpress/components` that provides this prop.

## Props

MenuItem supports the following props. Any additional props are passed through to the underlying [Button](/packages/components/src/button/README.md).

### `children`

-   Type: `Element`
-   Required: No

Element to render as child of button.

### `disabled`

-   Type: `boolean`
-   Required: No

Refer to documentation for [Button's `disabled` prop](/packages/components/src/button/README.md#disabled-boolean).

### `info`

-   Type: `string`
-   Required: No

Text to use as description for button text.

### `icon`

-   Type: `string`
-   Required: No

Refer to documentation for [Button's `icon` prop](/packages/components/src/icon-button/README.md#icon).

### `iconPosition`

-   Type: `string`
-   Required: No
-   Default: `'right'`

Determines where to display the provided `icon`.

### `isSelected`

-   Type: `boolean`
-   Required: No

Whether or not the menu item is currently selected. `isSelected` is only taken into account when the `role` prop is either `"menuitemcheckbox"` or `"menuitemradio"`.

### `showSelectionIndicator`

-   Type: `boolean`
-   Required: No
-   Default: `false`

Renders a leading check mark when `role` is `"menuitemcheckbox"` or `"menuitemradio"`. The mark follows `isSelected` and reserves space when unchecked. A supplied `icon` renders alongside the mark at its configured position. This prop has no effect on ordinary action items.

### `shortcut`

-   Type: `string` or `object`
-   Required: No

If shortcut is a string, it is expecting the display text. If shortcut is an object, it will accept the properties of `display` (string) and `ariaLabel` (string).

### `role`

-   Type: `string`
-   Require: No
-   Default: `'menuitem'`

[Aria Spec](https://www.w3.org/TR/wai-aria-1.1/#aria-checked). If you need to have selectable menu items use menuitemradio for single select, and menuitemcheckbox for multiselect.

### `suffix`

-   Type: `Element`
-   Required: No

Allows for markup other than icons or shortcuts to be added to the menu item.
