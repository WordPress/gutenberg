/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import LetterSpacingControl from '../components/letter-spacing-control';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' supports array indicating support for letter-spacing
 * e.g. settings found in `block.json`.
 */
export const LETTER_SPACING_SUPPORT_KEY =
	'typography.__experimentalLetterSpacing';

/**
 * Inspector control panel containing the letter-spacing options.
 *
 * @param {Object} props Block properties.
 * @return {WPElement}    Letter-spacing edit element.
 */
export function LetterSpacingEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	function onChange( newSpacing ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					letterSpacing: newSpacing,
				},
			} ),
		} );
	}

	return (
		<LetterSpacingControl
			value={ style?.typography?.letterSpacing }
			onChange={ onChange }
			__unstableInputWidth={ '100%' }
		/>
	);
}

/**
 * Checks if letter-spacing settings have been disabled.
 *
 * @param {string} name Name of the block.
 * @return {boolean}     Whether or not the setting is disabled.
 */
export function useIsLetterSpacingDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		LETTER_SPACING_SUPPORT_KEY
	);
	const hasLetterSpacing = useSetting( 'typography.letterSpacing' );

	return notSupported || ! hasLetterSpacing;
}

/**
 * Checks if there is a current value set for the letter spacing block support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a letter spacing set.
 */
export function hasLetterSpacingValue( props ) {
	return !! props.attributes.style?.typography?.letterSpacing;
}

/**
 * Resets the letter spacing block support attribute. This can be used when
 * disabling the letter spacing support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetLetterSpacing( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				letterSpacing: undefined,
			},
		} ),
	} );
}
