# AlignmentMatrixControl

<!-- This file is generated automatically and cannot be edited directly. Make edits via TypeScript types and TSDocs. -->

<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-alignmentmatrixcontrol--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>

AlignmentMatrixControl components enable adjustments to horizontal and vertical alignments for UI.

```jsx
import { AlignmentMatrixControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const Example = () => {
	const [ alignment, setAlignment ] = useState( 'center center' );

	return (
		<AlignmentMatrixControl
			value={ alignment }
			onChange={ setAlignment }
		/>
	);
};
```
## Props

### `defaultValue`

If provided, sets the default alignment value.

 - Type: `"center" | "top left" | "top center" | "top right" | "center left" | "center center" | "center right" | "bottom left" | "bottom center" | "bottom right"`
 - Required: No
 - Default: `'center center'`

### `label`

Accessible label. If provided, sets the `aria-label` attribute of the
underlying `grid` widget.

 - Type: `string`
 - Required: No
 - Default: `'Alignment Matrix Control'`

### `onChange`

A function that receives the updated alignment value.

 - Type: `(newValue: AlignmentMatrixControlValue) => void`
 - Required: No

### `value`

The current alignment value.

 - Type: `"center" | "top left" | "top center" | "top right" | "center left" | "center center" | "center right" | "bottom left" | "bottom center" | "bottom right"`
 - Required: No

### `width`

If provided, sets the width of the control.

 - Type: `number`
 - Required: No
 - Default: `92`

## Subcomponents

### AlignmentMatrixControl.Icon

#### Props

##### `disablePointerEvents`

If `true`, disables pointer events on the icon.

 - Type: `boolean`
 - Required: No
 - Default: `true`

##### `value`

The current alignment value.

 - Type: `"center" | "top left" | "top center" | "top right" | "center left" | "center center" | "center right" | "bottom left" | "bottom center" | "bottom right"`
 - Required: No
 - Default: `center`
