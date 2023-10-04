# DimensionControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`DimensionControl` is a component designed to provide a UI to control spacing and/or dimensions.

## Usage

```jsx
import { useState } from 'react';
import { __experimentalDimensionControl as DimensionControl } from '@wordpress/components';

export default function MyCustomDimensionControl() {
	const [ paddingSize, setPaddingSize ] = useState( '' );

	return (
		<DimensionControl
			label={ 'Padding' }
			icon={ 'desktop' }
			onChange={ ( value ) => setPaddingSize( value ) }
			value={ paddingSize }
		/>
	);
}
```

_Note:_ by default, if you do not provide an initial `value` prop for the current dimension value, then no value will be selected (ie: there is no default dimension set).

## Props

### `label`

-   **Type:** `string`
-   **Required:** Yes

The human readable label for the control.

### `value`

-   **Type:** `string`
-   **Required:** No

The current value of the dimension UI control. If provided the UI with automatically select the value.

### `sizes`

-   **Type:** `{ name: string; slug: string }[]`
-   **Default:** See `packages/block-editor/src/components/dimension-control/sizes.ts`
-   **Required:** No

An optional array of size objects in the following shape:

```
[
	{
		name: __( 'Small' ),
		slug: 'small',
	},
		{
		name: __( 'Medium' ),
		slug: 'small',
	},
	// ...etc
]
```

By default a set of relative sizes (`small`, `medium`...etc) are provided. See `packages/block-editor/src/components/dimension-control/sizes.js`.

### `icon`

-   **Type:** `string`
-   **Required:** No

An optional dashicon to display before to the control label.

### `onChange`

-   **Type:** `( value?: string ) => void;`
-   **Required:** No
-   **Arguments:**:
    -   `size` - a string representing the selected size (eg: `medium`)

A callback which is triggered when a spacing size value changes (is selected/clicked).

### `className`

-   **Type:** `string`
-   **Default:** `''`
-   **Required:** No

A string of classes to be added to the control component.
