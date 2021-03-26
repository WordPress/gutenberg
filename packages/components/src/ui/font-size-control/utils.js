/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { ui } from '@wp-g2/styles';
import { createUnitValue, parseUnitValue } from '@wp-g2/utils';

const DEFAULT_FONT_SIZE = 'default';
const CUSTOM_FONT_SIZE = 'custom';
const MAX_FONT_SIZE_DISPLAY = '25px';
const ASIDE_CONTROL_WIDTH = 70;

export function hasUnit( value ) {
	const [ , unit ] = parseUnitValue( value );
	return !! unit;
}

function getFontSize( values = [], value ) {
	return values.find( ( item ) => item.size === value );
}

export function isCustomValue( values = [], value ) {
	const item = getFontSize( values, value );
	return !! item;
}

export function isCustomSelectedItem( selectedItem ) {
	return selectedItem?.key === CUSTOM_FONT_SIZE;
}

export function getSelectValueFromFontSize( fontSizes, value ) {
	if ( ! value ) return DEFAULT_FONT_SIZE;

	const fontSize = getFontSize( fontSizes, value );
	return fontSize ? fontSize.slug : CUSTOM_FONT_SIZE;
}

export function getSelectOptions( {
	disableCustomFontSizes,
	hasCustomValue,
	options,
} ) {
	if ( disableCustomFontSizes && ! options.length ) return null;

	options = [
		{ slug: DEFAULT_FONT_SIZE, name: __( 'Default' ), size: undefined },
		...options,
	];

	if ( ! hasCustomValue && ! disableCustomFontSizes ) {
		options.push( { slug: CUSTOM_FONT_SIZE, name: __( 'Custom' ) } );
	}

	return options.map( ( option ) => {
		const fontSize =
			typeof option.size === 'number'
				? createUnitValue( option.size, 'px' )
				: option.size;

		return {
			...option,
			key: option.slug,
			style: {
				fontSize: `min( ${ fontSize }, ${ MAX_FONT_SIZE_DISPLAY } )`,
			},
		};
	} );
}

export function getInputValue( fontSizes = [], value ) {
	const hasUnits = hasUnit( value || fontSizes[ 0 ]?.size );

	let noUnitsValue;
	if ( ! hasUnits ) {
		noUnitsValue = value;
	} else {
		noUnitsValue = parseInt( value );
	}

	const isPixelValue =
		typeof value === 'number' ||
		( typeof value === 'string' && value.endsWith( 'px' ) );

	const inputValue = ( isPixelValue && noUnitsValue ) || '';

	return inputValue;
}

export function getSelectTemplateColumns( withNumberInput ) {
	return withNumberInput
		? `minmax(0, 1fr) minmax(auto, ${ ui.value.px(
				ASIDE_CONTROL_WIDTH * 2
		  ) })`
		: `minmax(0, 2fr) minmax(auto, ${ ui.value.px(
				ASIDE_CONTROL_WIDTH
		  ) })`;
}

export function getSliderTemplateColumns() {
	return `2fr minmax(auto, ${ ui.value.px( ASIDE_CONTROL_WIDTH ) })`;
}
