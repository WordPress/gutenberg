# `ToggleMultipleGroupControl`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ToggleMultipleGroupControl` is a variant of [`ToggleGroupControl`](/packages/components/src/toggle-group-control/toggle-group-control/README.md) that allows multiple options to be selected. To render options for this control, use the [`ToggleMultipleGroupControlOptionIcon`](/packages/components/src/toggle-multiple-group-control/toggle-multiple-group-control-option-icon/README.md) component.

Only use this control for icon buttons.

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

### `help`: `ReactNode`

If this property is added, a help text will be generated using help property as the content.

-   Required: No

### `hideLabelFromVision`: `boolean`

If true, the label will only be visible to screen readers.

-   Required: No
-   Default: `false`

### `label`: `string`

Label for the control.

-   Required: Yes