/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useControlLabel } from './hook';

/**
 * `ControlLabel` is a form component that works with `FormGroup` to provide a
 * label for form elements (e.g. `Switch` or `TextInput`).
 *
 * ```jsx
 * import { ControlLabel, FormGroup, TextInput } from '@wordpress/components/ui';
 *
 * function Example() {
 * 	return (
 * 		<FormGroup>
 * 			<ControlLabel>First Name</ControlLabel>
 * 			<TextInput />
 * 		</FormGroup>
 * 	);
 * }
 * ```
 */
const ControlLabel = createComponent( {
	as: 'label',
	useHook: useControlLabel,
	name: 'ControlLabel',
} );

export default ControlLabel;
