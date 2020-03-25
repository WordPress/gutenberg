# AlignmentMatrixControl

AlignmentMatrixControl components let adjust horizontal and vertical alignments for UI.

## Usage

```jsx
import { AlignmentMatrixControl } from '@wordpress/components';
import { useState } from '@wordpress/elememt';

const Example = () => {
	const [ alignment, setAlignment ] = useState( 'center' );

	return (
		<AlignmentMatrixControl value={ alignment } onChange={ setAlignment } />
	);
};
```
