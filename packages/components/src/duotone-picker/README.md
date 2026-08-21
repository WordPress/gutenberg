# DuotonePicker & DuotoneSwatch

## Usage

```jsx
import { useState } from 'react';
import { DuotonePicker, DuotoneSwatch } from '@wordpress/components';

const DUOTONE_PALETTE = [
	{ colors: [ '#8c00b7', '#fcff41' ], name: 'Purple and yellow', slug: 'purple-yellow' },
	{ colors: [ '#000097', '#ff4747' ], name: 'Blue and red', slug: 'blue-red' },
];

const COLOR_PALETTE = [
	{ color: '#ff4747', name: 'Red', slug: 'red' },
	{ color: '#fcff41', name: 'Yellow', slug: 'yellow' },
	{ color: '#000097', name: 'Blue', slug: 'blue' },
	{ color: '#8c00b7', name: 'Purple', slug: 'purple' },
];

const Example = () => {
	const [ duotone, setDuotone ] = useState( [ '#000000', '#ffffff' ] );
	return (
		<>
			<DuotonePicker
				duotonePalette={ DUOTONE_PALETTE }
				colorPalette={ COLOR_PALETTE }
				value={ duotone }
				onChange={ setDuotone }
			/>
			<DuotoneSwatch values={ duotone } />
		</>
	);
};
```

## DuotonePicker Props

### `colorPalette`

-   Type: `Object[]`
-   Required: Yes

Array of color presets of the form `{ color: '#000000', name: 'Black', slug: 'black' }`.

### `duotonePalette`

-   Type: `Object[]`
-   Required: Yes

Array of duotone presets of the form `{ colors: [ '#000000', '#ffffff' ], name: 'Grayscale', slug: 'grayscale' }`.

### `value`

-   Type: `string[]`
-   Required: Yes

An array of colors for the duotone effect.

### `selectedSlug`

-   Type: `string`
-   Required: No

The slug of the selected duotone preset. When a non-empty `selectedSlug` is given, selection is decided strictly by slug, which keeps two presets holding the same pair of colors apart. Presets whose slug does not match will not appear selected in this mode, even if their colors match `value`.

An empty string is treated the same as `undefined`: selection falls back to matching by color value.

### `onChange`

-   Type: `(value: string[] | 'unset' | undefined, index?: number | undefined, slug?: string | undefined) => void`
-   Required: Yes

The function called when the duotone colors change. It is passed the new `value` as an argument. When a preset from `duotonePalette` is picked, the second argument is its index and the third is its slug.

Both are omitted whenever no preset is being picked: the custom, unset and clear controls, and deselecting the currently selected preset, which reports `undefined` alone.

### `asButtons`: `boolean`

Whether the control should present as a set of buttons, each with its own tab stop.

- Required: No
- Default: `false`

### `loop`: `boolean`

Prevents keyboard interaction from wrapping around. Only used when `asButtons` is not true.

- Required: No
- Default: `true`

## DuotoneSwatch Props

### `values`

-   Type: `string[] | null`
-   Required: No

An array of colors to show or `null` to show the placeholder swatch icon.
