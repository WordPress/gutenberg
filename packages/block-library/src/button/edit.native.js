/**
 * WordPress dependencies
 */
import {
	compose,
	withInstanceId,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	withColors,
} from '@wordpress/block-editor';

const ButtonEdit = ( { attributes, setAttributes, backgroundColor, textColor } ) => {
	const {
		placeholder,
		text,
		borderRadius,
	} = attributes;

	return (
		<RichText
			placeholder={ placeholder || __( 'Add text…' ) }
			value={ text }
			onChange={ ( value ) => setAttributes( { text: value } ) }
			style={ { backgroundColor: backgroundColor.color, color: textColor.color, borderRadius } }
			withoutInteractiveFormatting
		/>
	);
};

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
] )( ButtonEdit );
