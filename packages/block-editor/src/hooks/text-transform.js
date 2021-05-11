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
export const TEXT_TRANSFORM_SUPPORT_KEY = '__experimentalTextTransform';

/**
 * Inspector control panel containing the text transform options.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Text transform edit element.
 */
export function TextTransformEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;
	const isDisabled = useIsTextTransformDisabled( props );

	if ( isDisabled ) {
		return null;
	}

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
 * @param  {string} name Name of the block.
 * @return {boolean}     Whether or not the setting is disabled.
 */
export function useIsTextTransformDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		TEXT_TRANSFORM_SUPPORT_KEY
	);
	const hasTextTransforms = useSetting( 'typography.customTextTransforms' );
	return notSupported || ! hasTextTransforms;
}
