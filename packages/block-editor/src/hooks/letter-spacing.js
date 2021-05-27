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
export const LETTER_SPACING_SUPPORT_KEY = '__experimentalLetterSpacing';

/**
 * Inspector control panel containing the letter-spacing options.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Letter-spacing edit element.
 */
export function LetterSpacingEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const isDisabled = useIsLetterSpacingDisabled( props );

	if ( isDisabled ) {
		return null;
	}

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
		/>
	);
}

/**
 * Checks if letter-spacing settings have been disabled.
 *
 * @param  {string} name Name of the block.
 * @return {boolean}     Whether or not the setting is disabled.
 */
export function useIsLetterSpacingDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		LETTER_SPACING_SUPPORT_KEY
	);
	const hasLetterSpacing = useSetting( 'typography.customLetterSpacing' );

	return notSupported || ! hasLetterSpacing;
}
