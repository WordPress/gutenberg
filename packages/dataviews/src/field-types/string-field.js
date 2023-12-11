/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

export function StringFieldEdit( { item, field } ) {
	const [ value, setValue ] = useState( field.getValue( { item } ) );
	return (
		<form
			onSubmit={ ( event ) => {
				event.preventDefault();
				field.setValue( { value, item } );
			} }
		>
			<TextControl
				__nextHasNoMarginBottom
				label={ field.header }
				hideLabelFromVision
				value={ value }
				onChange={ setValue }
				size="__unstable-large"
				style={ { margin: 0 } }
			/>
		</form>
	);
}
