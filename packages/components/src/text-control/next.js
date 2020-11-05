/**
 * WordPress dependencies
 */
import { FormGroup, TextInput } from '@wordpress/ui.components';
import { withNextComponent as withNext } from '@wordpress/ui.context';

export function TextControl( {
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

export function withNextComponent( current ) {
	return withNext( current, TextControl, 'WPComponentsTextControl' );
}
