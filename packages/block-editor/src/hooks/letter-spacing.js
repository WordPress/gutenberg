/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useEditorFeature from '../components/use-editor-feature';
import LetterSpacingControl from '../components/letter-spacing-control';
import { cleanEmptyObject } from './utils';

/**
 * Key within a block's `block.json` "supports" object indicating support for letter spacing.
 */
export const LETTER_SPACING_SUPPORT_KEY = '__experimentalLetterSpacing';

/**
 * Checks if letter spacing settings have been disabled.
 *
 * @param  {string} name Name of the block.
 * @return {boolean}     Whether or not the setting is disabled.
 */
export function useIsLetterSpacingDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useEditorFeature( 'typography.customLetterSpacing' );

	return (
		! hasBlockSupport( blockName, LETTER_SPACING_SUPPORT_KEY ) || isDisabled
	);
}

/**
 * Inspector control panel containing the letter spacing options.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Letter spacing edit element.
 */
export function LetterSpacingEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	if ( useIsLetterSpacingDisabled( props ) ) {
		return null;
	}

	const onChange = ( newLetterSpacingValue ) => {
		const newStyle = {
			...style,
			typography: {
				...style?.typography,
				letterSpacing: parseInt( newLetterSpacingValue, 10 ),
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	return (
		<LetterSpacingControl
			value={ style?.typography?.letterSpacing }
			onChange={ onChange }
		/>
	);
}
