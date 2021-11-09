/**
 * Internal dependencies
 */
import { contextConnect } from '../context';
import { View } from '../../view';
import { useControlLabel } from './hook';

/**
 * @param {import('../context').WordPressComponentProps<import('./types').Props, 'label', false>} props
 * @param {import('react').Ref<any>}                                                              forwardedRef
 */
function ControlLabel( props, forwardedRef ) {
	const controlLabelProps = useControlLabel( props );

	return <View as="label" { ...controlLabelProps } ref={ forwardedRef } />;
}

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
const ConnectedControlLabel = contextConnect( ControlLabel, 'ControlLabel' );

export default ConnectedControlLabel;
