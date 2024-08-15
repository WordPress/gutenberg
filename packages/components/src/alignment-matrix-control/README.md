# AlignmentMatrixControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

AlignmentMatrixControl components enable adjustments to horizontal and vertical alignments for UI.

## Usage

```jsx
import { useState } from 'react';
import { __experimentalAlignmentMatrixControl as AlignmentMatrixControl } from '@wordpress/components';

const Example = () => {
	const [ alignment, setAlignment ] = useState( 'center center' );

	return (
		<AlignmentMatrixControl
			value={ alignment }
			onChange={ ( newAlignment ) => setAlignment( newAlignment ) }
		/>
	);
};
```

## Props

The component accepts the following props:

### className

The class that will be added to the classes of the underlying `grid` widget.
-   Type: `string`
-   Required: No

### id

Unique ID for the component.

-  Type: `string`
-  Required: No

### label

Accessible label. If provided, sets the `aria-label` attribute of the underlying `grid` widget.

-   Type: `string`
-   Required: No
-   Default: `Alignment Matrix Control`

### defaultValue

If provided, sets the default alignment value.

- Type: `AlignmentMatrixControlValue`
- Required: No
- Default: `center center`

### value

The current alignment value.

- Type: `AlignmentMatrixControlValue`
- Required: No

### onChange

A function that receives the updated alignment value.

-   Type: `( newValue: AlignmentMatrixControlValue ) => void`
-   Required: No

### width

If provided, sets the width of the control.

 - Type: `number`
 - Required: No
 - Default: `92`
