/**
 * Internal dependencies
 */
import { contextConnect } from '../context';
import { Grid } from '../../grid';
import { View } from '../../view';
import FormGroupContent from './form-group-content';
import { useFormGroup } from './use-form-group';

/**
 * @param {import('../context').PolymorphicComponentProps<import('./types').FormGroupProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function FormGroup( props, forwardedRef ) {
	const { contentProps, horizontal, ...otherProps } = useFormGroup( props );

	if ( horizontal ) {
		return (
			<Grid
				templateColumns="minmax(0, 1fr) 2fr"
				{ ...otherProps }
				ref={ forwardedRef }
			>
				<FormGroupContent { ...contentProps } />
			</Grid>
		);
	}

	return (
		<View { ...otherProps } ref={ forwardedRef }>
			<FormGroupContent { ...contentProps } />
		</View>
	);
}

/**
 * `FormGroup` is a form component that groups a label with a form element (e.g. `Switch` or `TextInput`).
 *
 * @example
 * ```jsx
 * import { FormGroup, TextInput } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<FormGroup label="First name">
 * 			<TextInput />
 * 		</FormGroup>
 * 	);
 * }
 * ```
 */
const ConnectedFormGroup = contextConnect( FormGroup, 'FormGroup' );

export default ConnectedFormGroup;
