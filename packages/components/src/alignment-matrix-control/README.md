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

### `autoFocus`

 - Type: `boolean`
 - Required: No
 - Default: `false`

If `true`, focuses the currently active cell receives when mounted.

Intended for cases where the control is revealed in a popover or dialog
and focus should move to it. AlignmentMatrixControl's initialization is
asynchronous, and all rendered cells are tabbable until initialization
is complete. This create race conditions when competing with programmatic
focus management initiated when popovers are opened, where that focus
management itself may be asynchronous. To avoid such race conditions,
disable the external focus management and use this prop instead to focus
the active cell once initialization is complete.

### `defaultValue`

 - Type: `"center" | "top left" | "top center" | "top right" | "center left" | "center center" | "center right" | "bottom left" | "bottom center" | "bottom right"`
 - Required: No
 - Default: `'center center'`

If provided, sets the default alignment value.

### `label`

 - Type: `string`
 - Required: No
 - Default: `'Alignment Matrix Control'`

Accessible label. If provided, sets the `aria-label` attribute of the
underlying `grid` widget.

### `onChange`

 - Type: `((newValue: AlignmentMatrixControlValue) => void)`
 - Required: No

A function that receives the updated alignment value.

### `value`

 - Type: `"center" | "top left" | "top center" | "top right" | "center left" | "center center" | "center right" | "bottom left" | "bottom center" | "bottom right"`
 - Required: No

The current alignment value.

### `width`

 - Type: `number`
 - Required: No
 - Default: `92`

If provided, sets the width of the control.

## Subcomponents

### AlignmentMatrixControl.Icon

#### Props

##### `disablePointerEvents`

 - Type: `boolean`
 - Required: No
 - Default: `true`

If `true`, disables pointer events on the icon.

##### `value`

 - Type: `"center" | "top left" | "top center" | "top right" | "center left" | "center center" | "center right" | "bottom left" | "bottom center" | "bottom right"`
 - Required: No
 - Default: `center`

The current alignment value.
