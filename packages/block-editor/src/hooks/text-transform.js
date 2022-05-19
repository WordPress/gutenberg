/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import TextTransformControl from '../components/text-transform-control';
import useSetting from '../components/use-setting';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' supports array indicating support for text
 * transforms e.g. settings found in `block.json`.
 */
export const TEXT_TRANSFORM_SUPPORT_KEY =
	'typography.__experimentalTextTransform';

/**
 * Inspector control panel containing the text transform options.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Text transform edit element.
 */
export function TextTransformEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	function onChange( newTransform ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					textTransform: newTransform,
				},
			} ),
		} );
	}

	return (
		<TextTransformControl
			value={ style?.typography?.textTransform }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if text-transform settings have been disabled.
 *
 * @param {string} name Name of the block.
 *
 * @return {boolean} Whether or not the setting is disabled.
 */
export function useIsTextTransformDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		TEXT_TRANSFORM_SUPPORT_KEY
	);
	const hasTextTransforms = useSetting( 'typography.textTransform' );
	return notSupported || ! hasTextTransforms;
}

/**
 * Checks if there is a current value set for the text transform block support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a text transform set.
 */
export function hasTextTransformValue( props ) {
	return !! props.attributes.style?.typography?.textTransform;
}

/**
 * Resets the text transform block support attribute. This can be used when
 * disabling the text transform support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetTextTransform( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				textTransform: undefined,
			},
		} ),
	} );
}
