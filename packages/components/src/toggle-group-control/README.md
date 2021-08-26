# ToggleGroupControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ToggleGroupControl` is a form component that lets users choose options represented in horizontal segments. To render options for this control use `ToggleGroupControlOption` component.

## Usage

```js
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

function Example() {
	return (
		<ToggleGroupControl label="my label" value="vertical" isBlock>
			<ToggleGroupControlOption value="horizontal" label="Horizontal" />
			<ToggleGroupControlOption value="vertical" label="Vertical" />
		</ToggleGroupControl>
	);
}
```

## Props

### `label`

-   Type: `string`

Label for the form element.

### `hideLabelFromVision`

-   Type: `boolean`
-   Required: No
-   Default: `false`

If true, the label will only be visible to screen readers.

### `isAdaptiveWidth`

-   Type: `boolean`
-   Required: No
-   Default: `false`

Determines if segments should be rendered with equal widths.

### `isBlock`

-   Type: `boolean`
-   Required: No
-   Default: `false`

Renders `ToggleGroupControl` as a (CSS) block element.

### `onChange`

-   Type: `boolean`
-   Required: No
-   Default: `false`

Callback when a segment is selected.

### `value`

-   Type: `string | number`

The value of the `ToggleGroupControl`.

### `help`

-   Type: `ReactNode`
-   Required: No

If this property is added, a help text will be generated using help property as the content.
