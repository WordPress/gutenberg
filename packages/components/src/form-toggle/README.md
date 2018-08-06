# FormToggle

The Form Toggle Control (or Switch) is a complement to the Checkbox Control, which is used when the effect is instant and boolean. Like its light switch counterpart that brings light, when you flip this switch something changes instantanously.

Use:

- When the effect of the switch is immediately visible to the user. For example when applying a dropcap to text, the actual dropcap is immediately activated.
- When there are only two states for the switch, on or off.

Do **not** use:

- When the control is part of a group of other related controls (multiple choice).
- When the effect of flipping the switch is not instantaneous.

When the Form Toggle compoment is not appropriate, use the Checkbox Control.

Note: it is highly recommended that you pair the switch control with contextual help text, for example `checked ? __( 'Thumbnails are cropped to align.' ) : __( 'Thumbnails are not cropped.' )`.

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
