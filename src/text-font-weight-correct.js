/**
 * External dependencies
 *
 * @format
 */

/**
 * External dependencies
 */
import { Platform, Text } from 'react-native';
import { merge } from 'lodash';
/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

const textRender = Text.render;

const getCorrectFontWeight = ( fontWeight ) => {
	switch ( fontWeight ) {
		case '100':
		case '200':
		case '300':
			return {
				fontFamily: 'sans-serif-thin',
				fontWeight: 'normal',
			};
		case '400':
			return {
				fontFamily: 'sans-serif-light',
				fontWeight: 'normal',
			};
		case '500':
		case 'normal':
			return {
				fontFamily: 'sans-serif',
				fontWeight: 'normal',
			};
		case '600':
			return {
				fontFamily: 'sans-serif-medium',
				fontWeight: 'normal',
			};
		case '700':
		case 'bold':
			return {
				fontFamily: 'sans-serif',
				fontWeight: 'bold',
			};
		case '800':
		case '900':
			return {
				fontFamily: 'sans-serif-medium',
				fontWeight: 'bold',
			};
	}
};

const correctTextFontWeight = ( args ) => {
	const baseText = textRender.call( this, args );
	const { style } = baseText.props;

	const flatStyle = Array.isArray( style ) ? merge( {}, ...style ) : style;
	const shouldCorrectFontWeight = flatStyle && flatStyle.fontWeight;

	return shouldCorrectFontWeight ?
		cloneElement( baseText, {
			style: [ flatStyle, getCorrectFontWeight( flatStyle.fontWeight ) ],
		} ) :
		baseText;
};

export default () => {
	if ( Platform.OS === 'android' ) {
		Text.render = correctTextFontWeight;
	}
};
