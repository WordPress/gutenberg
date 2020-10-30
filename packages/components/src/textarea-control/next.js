/**
 * WordPress dependencies
 */
import { FormGroup, TextInput } from '@wordpress/ui.components';

export function TextareaControlNext( { label, ...props } ) {
	return (
		<FormGroup label={ label }>
			<TextInput minRows={ 3 } maxRows={ 6 } { ...props } multiline />
		</FormGroup>
	);
}
