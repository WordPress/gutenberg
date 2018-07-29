FormToggle
==========

## Usage

```jsx
import { FormToggle } from '@wordpress/components';
import { withState } from '@wordpress/compose';

withState( {
	checked: true,
} )( ( { checked, setState } ) => (
	<FormToggle 
		checked={ checked }
		onChange={ () => setState( state => ( { checked: ! state.checked } ) ) } 
	/>
) )
```
