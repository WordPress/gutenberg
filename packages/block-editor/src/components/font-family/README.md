# FontFamilyControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

FontFamilyControl is a React component that renders a UI that allows users to select a font family.
The component renders a user interface that allows the user to select from a set of predefined font families as defined by the `typography.fontFamilies` presets.
Optionally, you can provide a `fontFamilies` prop that overrides the predefined font families.

![FontFamilyControl component preview](https://i.imgur.com/blS5iA3.png)

## Usage

```jsx
import { useState } from 'react';
import { __experimentalFontFamilyControl as FontFamilyControl } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

// ...

const MyFontFamilyControl = () => {
	const [ fontFamily, setFontFamily ] = useState( '' );

	return (
		<FontFamilyControl
			value={ fontFamily }
			onChange={ ( newFontFamily ) => {
				setFontFamily( newFontFamily );
			} }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
	);
};

/// ...

<MyFontFamilyControl />
```

## Props

The component accepts the following props:

### onChange

A function that receives the new font family value.
If onChange is called without any parameter, it should reset the value, attending to what reset means in that context, e.g., set the font family to undefined or set the font family a starting value.

- Type: `function`
- Required: Yes

### fontFamilies

A user-provided set of font families.
Optional, used in case we want to override the predefined ones coming from presets.

- Type: `Array`
- Required: No

The font families are provided as an array of objects with the following schema:

| Property   | Description                               | Type   |
| ---------- | ----------------------------------------- | ------ |
| fontFamily | Font family, as used in CSS.              | string |
| name       | Optional display name of the font family. | string |

### value

The current font family value.

- Type: `String`
- Required: No
- Default: ''

The rest of the props are passed down to the underlying `<SelectControl />` instance.

#### `__next40pxDefaultSize`

- Type: `boolean`
- Required: No
- Default: `false`

Start opting into the larger default height that will become the default size in a future version.

#### `__nextHasNoMarginBottom`

- Type: `boolean`
- Required: No
- Default: `false`

Start opting into the new margin-free styles that will become the default in a future version.
