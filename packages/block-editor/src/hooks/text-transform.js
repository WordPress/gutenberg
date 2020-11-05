/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import TextTransformControl from '../components/text-transform-control';
import useEditorFeature from '../components/use-editor-feature';
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
	const textTransforms = useEditorFeature( 'typography.textTransforms' );
	const isDisabled = useIsTextTransformDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	const textTransform = getTextTransformFromAttributeValue(
		textTransforms,
		style?.typography?.textTransform
	);

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
			value={ textTransform }
			textTransforms={ textTransforms }
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
	const textTransforms = useEditorFeature( 'typography.textTransforms' );
	const hasTextTransforms = !! textTransforms?.length;

	return notSupported || ! hasTextTransforms;
}

/**
 * Extracts the current text transform selection, if available, from the CSS
 * variable set as the `styles.typography.textTransform` attribute.
 *
 * @param  {Array}  textTransforms Available text transforms as defined in theme.json.
 * @param  {string} value          Attribute value in `styles.typography.textTransform`
 * @return {string}                Actual text transform value
 */
const getTextTransformFromAttributeValue = ( textTransforms, value ) => {
	const attributeParsed = /var:preset\|text-transform\|(.+)/.exec( value );

	if ( attributeParsed && attributeParsed[ 1 ] ) {
		return textTransforms.find(
			( { slug } ) => slug === attributeParsed[ 1 ]
		)?.slug;
	}

	return value;
};
