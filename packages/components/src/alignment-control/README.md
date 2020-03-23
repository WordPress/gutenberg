# AlignmentControl

AlignmentControl components let adjust horizontal and vertical alignments for UI.

## Usage

```jsx
import { AlignmentControl } from '@wordpress/components';
import { useState } from '@wordpress/elememt';

const Example = () => {
	const [ alignment, setAlignment ] = useState( 'center' );

	return (
		<AlignmentControl alignment={ alignment } onChange={ setAlignment } />
	);
};
```
