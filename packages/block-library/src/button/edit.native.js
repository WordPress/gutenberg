/**
 * External dependencies
 */
import { View } from 'react-native';
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

const BORDER_RADIUS = 4;
const BLUE_COLOR = '#2271b1';

const ButtonEdit = ( { attributes, setAttributes, backgroundColor, textColor, isSelected } ) => {
	const {
		placeholder,
		text,
		borderRadius,
	} = attributes;

	return (
		<View style={ [ { padding: 4 }, isSelected && { borderRadius: BORDER_RADIUS * 2, borderColor: BLUE_COLOR, borderWidth: 1 } ] }>
			<View style={ { borderRadius: borderRadius || BORDER_RADIUS, overflow: 'hidden', paddingVertical: 10, backgroundColor: backgroundColor.color || BLUE_COLOR } }>
				<RichText
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					style={ { textAlign: 'center', backgroundColor: 'transparent', color: textColor.color || '#fff' } }
					textAlign="center"
				/>
			</View>
		</View>

	);
};

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
] )( ButtonEdit );
