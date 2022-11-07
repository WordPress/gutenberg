# `ToggleMultipleGroupControlOptionIcon`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ToggleMultipleGroupControlOptionIcon` is a form component which is meant to be used as a child of [`ToggleMultipleGroupControl`](/packages/components/src/toggle-multiple-group-control/README.md) and displays an icon.

## Usage

```js
import {
	__experimentalToggleMultipleGroupControl as ToggleMultipleGroupControl,
	__experimentalToggleMultipleGroupControlOptionIcon as ToggleMultipleGroupControlOptionIcon,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { formatBold, formatItalic } from '@wordpress/icons';

function Example() {
	const [ bold, setBold ] = useState( false );
	const [ italic, setItalic ] = useState( false );

	return (
		<ToggleMultipleGroupControl label="My label">
			<ToggleMultipleGroupControlOptionIcon
				value="bold"
				label="Bold"
				icon={ formatBold }
				isPressed={ bold }
				onClick={ () => setBold( ! bold ) }
			/>
			<ToggleMultipleGroupControlOptionIcon
				value="italic"
				label="Italic"
				icon={ formatItalic }
				isPressed={ italic }
				onClick={ () => setItalic( ! italic ) }
			/>
		</ToggleMultipleGroupControl>
	);
}
```

## Props

### `icon`: `WPComponent`

Icon displayed as the content of the option. Usually one of the icons from the `@wordpress/icons` package, or a custom React `<svg>` icon.

-   Required: Yes

### `isPressed`: `boolean`

Whether the button is pressed.

-   Required: Yes
-   Default: `false`

### `label`: `string`

The text to accessibly label the icon option. Will also be shown in a tooltip.

-   Required: Yes

### `onClick`: `React.MouseEventHandler< HTMLButtonElement >`

Listen to click events to manage the `isPressed` state.

-   Required: Yes 

### `value`: `string | number`

The unique key of the option.

-   Required: Yes


