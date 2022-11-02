#  BorderControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>
<br />
This component provides control over a border's color, style, and width.

## Development guidelines

The `BorderControl` brings together internal sub-components which allow users to
set the various properties of a border. The first sub-component, a
`BorderDropdown` contains options representing border color and style. The
border width is controlled via a `UnitControl` and an optional `RangeControl`.

Border radius is not covered by this control as it may be desired separate to
color, style, and width. For example, the border radius may be absorbed under
a "shape" abstraction.

## Usage

```jsx
import { __experimentalBorderControl as BorderControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const colors = [
	{ name: 'Blue 20', color: '#72aee6' },
	// ...
];

const MyBorderControl = () => {
	const [ border, setBorder ] = useState();
	const onChange = ( newBorder ) => setBorder( newBorder );

	return (
		<BorderControl
			colors={ colors }
			label={ __( 'Border' ) }
			onChange={ onChange }
			value={ border }
		/>
	);
};
```

If you're using this component outside the editor, you can
[ensure `Tooltip` positioning](/packages/components/README.md#popovers-and-tooltips)
for the `BorderControl`'s color and style options, by rendering your
`BorderControl` with a `Popover.Slot` further up the element tree and within a
`SlotFillProvider` overall.

## Props

### `colors`: `( PaletteObject | ColorObject )[]`

An array of color definitions. This may also be a multi-dimensional array where
colors are organized by multiple origins.

Each color may be an object containing a `name` and `color` value.

- Required: No
- Default: `[]`

### `disableCustomColors`: `boolean`

This toggles the ability to choose custom colors.

- Required: No

### `disableUnits`: `boolean`

This controls whether unit selection should be disabled.

- Required: No

### `enableAlpha`: `boolean`

This controls whether the alpha channel will be offered when selecting
custom colors.

- Required: No
- Default: `false`

### `enableStyle`: `boolean`

This controls whether to support border style selection.

- Required: No
- Default: `true`

### `hideLabelFromVision`: `boolean`

Provides control over whether the label will only be visible to screen readers.

- Required: No

### `isCompact`: `boolean`

This flags the `BorderControl` to render with a more compact appearance. It
restricts the width of the control and prevents it from expanding to take up
additional space.

- Required: No

### `label`: `string`

If provided, a label will be generated using this as the content.

_Whether it is visible only to screen readers is controlled via
`hideLabelFromVision`._

- Required: No

### `onChange`: `( value?: Object ) => void`

A callback function invoked when the border value is changed via an interaction
that selects or clears, border color, style, or width.

_Note: the value may be `undefined` if a user clears all border properties._

- Required: Yes

### `shouldSanitizeBorder`: `boolean`

If opted into, sanitizing the border means that if no width or color have been
selected, the border style is also cleared and `undefined` is returned as the
new border value.

- Required: No
- Default: true

### `showDropdownHeader`: `boolean`

Whether or not to render a header for the border color and style picker
dropdown. The header includes a label for the color picker and a close button.

- Required: No

### `size`: `string`

Size of the control.

- Required: No
- Default: `default`
- Allowed values: `default`, `__unstable-large`

### `value`: `Object`

An object representing a border or `undefined`. Used to set the current border
configuration for this component.

Example:
```js
 {
	color: '#72aee6',
	style: 'solid',
	width: '2px,
}
```

- Required: No

### `width`: `CSSProperties[ 'width' ]`

Controls the visual width of the `BorderControl`. It has no effect if the
`isCompact` prop is set to `true`.

- Required: No

### `withSlider`: `boolean`

Flags whether this `BorderControl` should also render a `RangeControl` for
additional control over a border's width.

- Required: No
