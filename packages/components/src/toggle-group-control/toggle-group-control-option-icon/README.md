# `ToggleGroupControlOptionIcon`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ToggleGroupControlOptionIcon` is a form component which is meant to be used as a child of [`ToggleGroupControl`](/packages/components/src/toggle-group-control/toggle-group-control/README.md) and displays an icon.

## Usage

```js
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { formatLowercase, formatUppercase } from '@wordpress/icons';

function Example() {
	return (
		<ToggleGroupControl __nextHasNoMarginBottom __next40pxDefaultSize>
			<ToggleGroupControlOptionIcon
				value="uppercase"
				icon={ formatUppercase }
				label="Uppercase"
			/>
			<ToggleGroupControlOptionIcon
				value="lowercase"
				icon={ formatLowercase }
				label="Lowercase"
			/>
		</ToggleGroupControl>
	);
}
```

## Props

### `value`: `string | number`

The value of the `ToggleGroupControlOption`.

-   Required: Yes

### `icon`: `Component`

Icon displayed as the content of the option. Usually one of the icons from the `@wordpress/icons` package, or a custom React `<svg>` icon.

-   Required: Yes

### `label`: `string`

The text to accessibly label the icon option. Will also be shown in a tooltip.

-   Required: Yes
