# AlignmentMatrixControl

AlignmentMatrixControl components enable adjustments to horizontal and vertical alignments for UI.

## Usage

```jsx
import { __experimentalAlignmentMatrixControl as AlignmentMatrixControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

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

The class that will be added to the classes of the wrapper <Composite/> component.

-   Type: `string`
-   Required: No

### id

Unique ID for the component.

-  Type: `string`
-  Required: No

### label

Accessible label. If provided, sets the `aria-label` attribute of the underlying <Composite/> component.

-   Type: `string`
-   Required: No
-   Default: `Alignment Matrix Control`

### defaultValue

If provided, sets the default alignment value.

- Type: `string`
- Required: No
- Default: `center center`

### value

The current alignment value.
- Type: `string`
- Required: No

### onChange

A function that receives the updated alignment value.

-   Type: `( nextValue: string ) => void`
-   Required: No

### width

If provided, sets the width of the wrapper <Composite/> component.

 - Type: `number`
 - Required: No
 - Default: `92`
