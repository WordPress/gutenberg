/**
 * External dependencies
 */
import { View, Platform } from 'react-native';
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
		<View
			style={ [
				{ padding: 4, backgroundColor: 'transparent', alignSelf: 'flex-start' },
				isSelected && { borderRadius: BORDER_RADIUS * 2, borderColor: BLUE_COLOR, borderWidth: 1 },
			] }
		>
			<View
				style={ [
					{
						borderRadius: borderRadius || BORDER_RADIUS,
						overflow: 'hidden',
						backgroundColor: backgroundColor.color || BLUE_COLOR,
						alignSelf: 'flex-start',
					},
					Platform.OS === 'ios' && {	paddingVertical: 10, paddingHorizontal: 16 },
				] }
			>
				<RichText
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					style={ {
						backgroundColor: 'transparent',
						color: textColor.color || '#fff',
						paddingVertical: 10,
						paddingHorizontal: 16,
						minWidth: 108,
					} }
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
