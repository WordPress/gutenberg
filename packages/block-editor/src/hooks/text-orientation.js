/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import TextOrientationControl from '../components/text-orientation-control';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' supports array indicating support for text
 * orientation e.g. settings found in `block.json`.
 */
export const TEXT_ORIENTATION_SUPPORT_KEY =
	'typography.__experimentalTextOrientation';

/**
 * Inspector control panel containing the text orientation options.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Text orientation edit element.
 */
export function TextOrientationEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	function onChange( newOrientation ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					writingMode: newOrientation,
				},
			} ),
		} );
	}

	return (
		<TextOrientationControl
			value={ style?.typography?.writingMode }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if text orientation settings have been disabled.
 *
 * @param {string} name Name of the block.
 *
 * @return {boolean} Whether or not the setting is disabled.
 */
export function useIsTextOrientationDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		TEXT_ORIENTATION_SUPPORT_KEY
	);
	const hasTextOrientation = useSetting( 'typography.textOrientation' );

	return notSupported || ! hasTextOrientation;
}

/**
 * Checks if there is a current value set for the text orientation block support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a text orientation set.
 */
export function hasTextOrientationValue( props ) {
	return !! props.attributes.style?.typography?.textOrientation;
}

/**
 * Resets the text orientation block support attribute. This can be used when
 * disabling the text orientation support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetTextOrientation( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				writingMode: undefined,
			},
		} ),
	} );
}
