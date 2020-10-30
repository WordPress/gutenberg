/**
 * WordPress dependencies
 */
import { FormGroup, TextInput } from '@wordpress/ui.components';

export function TextControlNext( {
	label,
	hideLabelFromVision,
	labelHidden: labelHiddenProp,
	...props
} ) {
	const labelHidden = hideLabelFromVision || labelHiddenProp;

	return (
		<FormGroup label={ label } labelHidden={ labelHidden }>
			<TextInput { ...props } />
		</FormGroup>
	);
}
