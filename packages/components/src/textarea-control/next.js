/**
 * WordPress dependencies
 */
import { FormGroup, TextInput } from '@wordpress/ui.components';
import { withNextComponent as withNext } from '@wordpress/ui.context';

export function TextareaControl( { label, ...props } ) {
	return (
		<FormGroup label={ label }>
			<TextInput minRows={ 3 } maxRows={ 6 } { ...props } multiline />
		</FormGroup>
	);
}

export function withNextComponent( current ) {
	return withNext( current, TextareaControl, 'WPComponentsTextareaControl' );
}
