# NumberControl

NumberControls are used to make selections from a range of incremental values.

### Usage

Render a NumberControl to make a selection from a range of incremental values.

```jsx
import { NumberControl } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyNumberControl = withState( {
        columns: 2,
} )( ( { columns, setState } ) => ( 
    <NumberControl
        label="Columns"
        value={ columns }
        onChange={ ( columns ) => setState( { columns } ) }
        min={ 2 }
        max={ 10 }
    />
) );
```
