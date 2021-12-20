# DuotonePicker & DuotoneSwatch

## Usage

```jsx
import { DuotonePicker, DuotoneSwatch } from '@wordpress/components';
import { useState } from '@wordpress/element';

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

### `onChange`

-   Type: `Function`
-   Required: Yes

Callback which is called when the duotone colors change.

## DuotoneSwatch Props

### `values`

-   Type: `string[] | null`
-   Required: No

An array of colors to show or `null` to show the placeholder swatch icon.
