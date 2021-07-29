# ColorPicker

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`ColorPicker` is a color picking component based on `react-colorful`. It lets you pick a color visually or by manipulating the individual RGB(A), HSL(A) and Hex(8) color values.

## Usage

```jsx
import { ColorPicker } from '@wordpress/components/ui';

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

### `color`

**Type**: `string`

The current color value to display in the picker. Must be a hex or hex8 string.

### `onChange`

**Type**: `(hex8Color: string) => void`

Fired when the color changes. Always passes a hex8 color string.

### `enableAlpha`

**Type**: `boolean`

Defaults to `false`. When `true` the color picker will display the alpha channel both in the bottom inputs as well as in the color picker itself.

### `defaultValue`

**Type**: `string | undefined`

An optional default value to use for the color picker.

### `copyFormat`

**Type**: `'hex' | 'hsl' | 'rgb' | undefined`

The format to copy when clicking the displayed color format.
