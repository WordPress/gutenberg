/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import TextDecorationControl from '../components/text-decoration-control';
import useEditorFeature from '../components/use-editor-feature';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' supports array indicating support for text
 * decorations e.g. settings found in `block.json`.
 */
export const TEXT_DECORATION_SUPPORT_KEY = '__experimentalTextDecoration';

/**
 * Inspector control panel containing the text decoration options.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Text decoration edit element.
 */
export function TextDecorationEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;
	const textDecorations = useEditorFeature( 'typography.textDecorations' );
	const isDisabled = useIsTextDecorationDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	const textDecoration = getTextDecorationFromAttributeValue(
		textDecorations,
		style?.typography?.textDecoration
	);

	function onChange( newDecoration ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					textDecoration: newDecoration,
				},
			} ),
		} );
	}

	return (
		<TextDecorationControl
			value={ textDecoration }
			textDecorations={ textDecorations }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if text-decoration settings have been disabled.
 *
 * @param  {string} name Name of the block.
 * @return {boolean}     Whether or not the setting is disabled.
 */
export function useIsTextDecorationDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport(
		blockName,
		TEXT_DECORATION_SUPPORT_KEY
	);
	const textDecorations = useEditorFeature( 'typography.textDecorations' );
	const hasTextDecorations = !! textDecorations?.length;

	return notSupported || ! hasTextDecorations;
}

/**
 * Extracts the current text decoration selection, if available, from the CSS
 * variable set as the `styles.typography.textDecoration` attribute.
 *
 * @param  {Array}  textDecorations Available text decorations as defined in theme.json.
 * @param  {string} value           Attribute value in `styles.typography.textDecoration`
 * @return {string}                 Actual text decoration value
 */
const getTextDecorationFromAttributeValue = ( textDecorations, value ) => {
	const attributeParsed = /var:preset\|text-decoration\|(.+)/.exec( value );

	if ( attributeParsed && attributeParsed[ 1 ] ) {
		return textDecorations.find(
			( { slug } ) => slug === attributeParsed[ 1 ]
		)?.slug;
	}

	return value;
};
