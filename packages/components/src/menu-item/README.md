# MenuItem

## Usage

```jsx
import { MenuItem } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyMenuItem = withState( {
	isActive: true,
} )( ( { isActive, setState } ) => (
	<MenuItem
		icon={ isActive ? 'yes' : 'no' }
		isSelected={ isActive }
		onClick={ () => setState( state => ( { isActive: ! state.isActive } ) ) }
	>
		Toggle
	</MenuItem>
) )
```
