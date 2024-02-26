# ColorPicker

`ColorPicker` is a color picking component based on `react-colorful`. It lets you pick a color visually or by manipulating the individual RGB(A), HSL(A) and Hex(8) color values.

## Usage

```jsx
import { useState } from 'react';
import { ColorPicker } from '@wordpress/components';

function Example() {
	const [color, setColor] = useState();
	return (
		<ColorPicker
			color={color}
			onChange={setColor}
			enableAlpha
			defaultValue="#000"
		/>
	);
}
```

## Props

### `color`: `string`

The current color value to display in the picker. Must be a hex or hex8 string.

- Required: No

### `onChange`: `(hex8Color: string) => void`

Fired when the color changes. Always passes a hex or hex8 color string.

- Required: No

### `enableAlpha`: `boolean`

When `true` the color picker will display the alpha channel both in the bottom inputs as well as in the color picker itself.

- Required: No
- Default: `false`

### `defaultValue`: `string | undefined`

An optional default value to use for the color picker.

- Required: No
- Default: `'#fff'`

### `copyFormat`: `'hex' | 'hsl' | 'rgb' | undefined`

The format to copy when clicking the displayed color format.

- Required: No
