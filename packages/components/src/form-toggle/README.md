# FormToggle

The Form Toggle Control is a switch that should be **used when the effect is boolean and instant**. The Form Toggle Control is a complement to the Checkbox Control.

Use Form Toggle when:

- The effect of the switch is immediately visible to the user. For example: when applying a drop-cap to text, the actual drop-cap is immediately activated.
- There are only two states for the switch: on or off.

Do **not** use:

- When the control is part of a group of other related controls (multiple choice).
- When the effect of flipping the switch is not instantaneous.

When Form Toggle component is not appropriate, use the Checkbox Control.

Note: it is recommended that you pair the switch control with contextual help text, for example `checked ? __( 'Thumbnails are cropped to align.' ) : __( 'Thumbnails are not cropped.' )`.

## Usage

```jsx
import { FormToggle } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyFormToggle = withState( {
	checked: true,
} )( ( { checked, setState } ) => (
	<FormToggle 
		checked={ checked }
		onChange={ () => setState( state => ( { checked: ! state.checked } ) ) } 
	/>
) );
```
