# AlignmentMatrixControl

AlignmentMatrixControl components enable adjustments to horizontal and vertical alignments for UI.

## Usage

```jsx
import { __experimentalAlignmentMatrixControl as AlignmentMatrixControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const Example = () => {
	const [alignment, setAlignment] = useState('center center');

	return (
		<AlignmentMatrixControl
			value={alignment}
			onChange={(newAlignment) => setAlignment(newAlignment)}
		/>
	);
};
```

## Props

The component accepts the following props:
### className

The class that will be added with "component-alignment-matrix-control" to the classes of the wrapper <Composite/> component.
If no className is passed only "component-alignment-matrix-control" is used.

-   Type: `String`
-   Required: No

### id

Unique ID for the component.
-  Type: `String`
-  Required: No
### label

If provided, sets the aria-label attribute of the wrapper <Composite/> component.

-   Type: `String`
-   Required: No
-   Default: `Alignment Matrix Control`
### defaultValue

If provided, sets the default alignment value.
- Type: `String`
- Required: No
- Default: `center center`

### onChange

A function that receives the updated alignment value.

-   Type: `function`
-   Required: No
-   Default: `noop`
### width

If provided, sets the width of the wrapper <Composite/> component.
 - Type: `Number`
 - Required: No
 - Default: `92`
