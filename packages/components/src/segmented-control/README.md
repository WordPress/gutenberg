# SegementedControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`SegementedControl` is a form component that lets users choose options represented in horizontal segments.

## Usage

```js
import { __experimentalSegmentedControl as SegmentedControl } from '@wordpress/components';

function Example() {
	return (
		<SegmentedControl
			label="My Segmented Control"
			value="vertical"
			options={ [
				{
					label: 'Horizontal',
					value: 'horizontal',
				},
				{
					label: 'Vertical',
					value: 'vertical',
				},
			] }
		/>
	);
}
```

## Props

### `label`

-   Type: `string`

Label for the form element.

### `baseId`

-   Type: `string`
-   Required: No

ID that will serve as a base for all the items IDs.

### `isAdaptiveWidth`

-   Type: `boolean`
-   Required: No
-   Default: `false`

Determines if segments should be rendered with equal widths.

### `isBlock`

-   Type: `boolean`
-   Required: No
-   Default: `false`

Renders `SegmentedControl` as a (CSS) block element.

### `options`

-   Type: `Array`
-   Required: No

Options to render within `SegmentedControl`. An array of objects containing the following properties:

-   `label`: (string) The label to be shown to the user.
-   `value`: (string|number) The internal value used to choose the selected value. This is also the value passed to onChange when the option is selected.

### `onChange`

-   Type: `boolean`
-   Required: No
-   Default: `false`

Callback when a segment is selected.

### `value`

-   Type: `string | number`

The value of the `SegmentedControl`.
