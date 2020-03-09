/**
 * External dependencies
 */
import { isUndefined } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __experimentalUseBlockEditProps as useBlockEditProps } from '../../index';
import { LineHeightControlWrapper } from './styles';

const BASE_DEFAULT_VALUE = 1.5;
const INITIAL_VALUE = '';
const STEP = 0.1;

export default function LineHeightControl( props ) {
	const [ lineHeight, setLineHeight ] = useLineHeightState();

	const handleOnChange = ( nextValue ) => {
		// Set the next value as normal if lineHeight has been defined
		if ( isLineHeightDefined( lineHeight ) ) {
			return setLineHeight( nextValue );
		}

		// Otherwise...
		let adjustedNextValue;

		if ( nextValue === `${ STEP }` ) {
			// Increment by step value
			adjustedNextValue = BASE_DEFAULT_VALUE + STEP;
		} else {
			// Decrement by step value
			adjustedNextValue = BASE_DEFAULT_VALUE - STEP;
		}

		setLineHeight( adjustedNextValue );
	};

	return (
		<LineHeightControlWrapper>
			<TextControl
				autoComplete="off"
				onChange={ handleOnChange }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				type="number"
				value={ lineHeight || INITIAL_VALUE }
				{ ...props }
				min={ 0 }
			/>
		</LineHeightControlWrapper>
	);
}

/**
 * Retrieves the attributes/setter for the block, but adjusted to target just the lineHeight attribute
 *
 * @return {Array<string|undefined, Function>} [lineHeight, setLineHeight] from the block's edit props.
 */
function useLineHeightState() {
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
function isLineHeightDefined( lineHeight ) {
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
