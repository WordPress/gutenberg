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
				aria-label="Uppercase"
			/>
			<ToggleGroupControlOptionIcon
				value="lowercase"
				icon={ formatLowercase }
				showTooltip={ true }
				aria-label="Lowercase"
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

Icon displayed as the content of the option. Usually one of the icons from the `@wordpress/icons` package, or a custom React `<svg>` icon.

-   Required: Yes

### `showTooltip`: `boolean`

Whether to show a tooltip when hovering over the option. The tooltip will only show if a label for it is provided using the `aria-label` prop.

-   Required: No
