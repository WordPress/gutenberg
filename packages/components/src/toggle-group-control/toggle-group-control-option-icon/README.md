# `ToggleGroupControlOptionIcon`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ToggleGroupControlOptionIcon` is a form component which is meant to be used as a child of [`ToggleGroupControl`] and displays an icon(<(/packages/components/src/toggle-group-control/toggle-group-control/README.md)>).

## Usage

```js
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { formatLowercase, formatUppercase } from '@wordpress/icons';

function Example() {
	return (
		<ToggleGroupControl label="my label" value="lowercase" isBlock>
			<ToggleGroupControlOptionIcon
				value="uppercase"
				icon={ formatUppercase }
				showTooltip={ true }
			/>
			<ToggleGroupControlOptionIcon
				value="lowercase"
				icon={ formatLowercase }
				showTooltip={ true }
			/>
		</ToggleGroupControl>
	);
}
```

## Props

### `value`: `string | number`

The value of the `ToggleGroupControlOption`.

-   Required: Yes

### `icon`: `WPComponent`

Icon for the option.

-   Required: Yes

### `showTooltip`: `boolean`

Whether to show a tooltip when hovering over the option. The tooltip will use the `aria-label` prop text.

-   Required: No
