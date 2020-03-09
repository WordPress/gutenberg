/**
 * External dependencies
 */
import { isUndefined } from 'lodash';

/**
 * Internal dependencies
 */
import { __experimentalUseBlockEditProps as useBlockEditProps } from '../../index';

export const BASE_DEFAULT_VALUE = 1.5;
export const INITIAL_VALUE = '';
export const STEP = 0.1;

/**
 * Retrieves the attributes/setter for the block, but adjusted to target just the lineHeight attribute
 *
 * @return {Array<string|undefined, Function>} [lineHeight, setLineHeight] from the block's edit props.
 */
export function useLineHeightState() {
	const [ attributes, setAttributes ] = useBlockEditProps();

	const { lineHeight } = attributes;

	const setLineHeight = ( value ) => {
		setAttributes( { lineHeight: value } );
	};

	return [ lineHeight, setLineHeight ];
}

/**
 * Determines if the lineHeight attribute has been properly defined.
 *
 * @param {any} lineHeight The value to check.
 *
 * @return {boolean} Whether the lineHeight attribute is valid.
 */
export function isLineHeightDefined( lineHeight ) {
	return ! isUndefined( lineHeight ) && lineHeight !== INITIAL_VALUE;
}

/**
 * Generates the "inline" lineHeight attribute styles, if defined.
 *
 * @param {Object} attributes Attributes from a block.
 *
 * @return {Object} Style properties with the lineHeight attribute, if defined.
 */
export function getLineHeightControlStyles( { lineHeight } = {} ) {
	if ( ! isLineHeightDefined( lineHeight ) ) {
		return {};
	}

	const value = parseFloat( lineHeight ) * 100;

	// Using CSS variable to set the style. This reduces specifity, allowing for
	// easier overrides, if needed.
	return {
		'--wp--core-paragraph--line-height': `${ value }%`,
	};
}

/**
 * Generates the CSS className representing the  lineHeight attribute styles, if defined.
 *
 * @param {Object} attributes Attributes from a block.
 *
 * @return {string} CSS className of the lineHeight attribute, if defined.
 */
export function getLineHeightControlClassName( { lineHeight } = {} ) {
	if ( ! isLineHeightDefined( lineHeight ) ) {
		return '';
	}

	return 'has-line-height';
}
