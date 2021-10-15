# `ToggleGroupControl`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ToggleGroupControl` is a form component that lets users choose options represented in horizontal segments. To render options for this control use [`ToggleGroupControlOption`](/packages/components/src/toggle-group-control/toggle-group-control-option/README.md) component.

Only use this control when you know for sure the labels of items inside won't wrap. For items with longer labels, you can consider a [`SelectControl`](/packages/components/src/select-control/README.md) or a [`CustomSelectControl`](/packages/components/src/custom-select-control/README.md) component instead.

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

### `help`: `ReactNode`

If this property is added, a help text will be generated using help property as the content.

-   Required: No

### `hideLabelFromVision`: `boolean`

If true, the label will only be visible to screen readers.

-   Required: No
-   Default: `false`

### `isAdaptiveWidth`: `boolean`

Determines if segments should be rendered with equal widths.

-   Required: No
-   Default: `false`

### `isBlock`: `boolean`

Renders `ToggleGroupControl` as a (CSS) block element.

-   Required: No
-   Default: `false`

### `label`: `string`

Label for the form element.

-   Required: Yes

### `onChange`: `( value?: string | number ) => void`

Callback when a segment is selected.

-   Required: No
-   Default: `() => {}`


### `value`: `string | number`

The value of the `ToggleGroupControl`.

-   Required: No
