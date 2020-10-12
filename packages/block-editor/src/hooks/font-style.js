/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import FontStyleControl from '../components/font-style-control';
import useEditorFeature from '../components/use-editor-feature';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' supports array indicating support for font styles.
 * e.g. settings found in `block.json`.
 */
export const FONT_STYLE_SUPPORT_KEY = '__experimentalFontStyle';

/**
 * Inspector control panel containing the font style options.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Font style edit element.
 */
export function FontStyleEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;
	const fontStyles = useEditorFeature( 'typography.fontStyles' );
	const isDisabled = useIsFontStyleDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	const fontStyle = getFontStyleFromAttributeValue(
		fontStyles,
		style?.typography?.fontStyle
	);

	function onChange( newStyle ) {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					fontStyle: newStyle,
				},
			} ),
		} );
	}

	return (
		<FontStyleControl
			value={ fontStyle }
			fontStyles={ fontStyles }
			onChange={ onChange }
		/>
	);
}

/**
 * Checks if font-style settings have been disabled.
 *
 * @param  {string} name Name of the block.
 * @return {boolean}     Whether or not the setting is disabled.
 */
export function useIsFontStyleDisabled( { name: blockName } = {} ) {
	const notSupported = ! hasBlockSupport( blockName, FONT_STYLE_SUPPORT_KEY );
	const fontStyles = useEditorFeature( 'typography.fontStyles' );
	const hasFontStyles = !! fontStyles?.length;

	return notSupported || ! hasFontStyles;
}

/**
 * Extracts the current font style selection, if available, from the CSS
 * variable set as the `styles.typography.fontStyle` attribute.
 *
 * @param  {Array}  fontStyles Available font styles as defined in theme.json.
 * @param  {string} value      Attribute value in `styles.typography.fontStyle`
 * @return {string}            Actual font style value
 */
const getFontStyleFromAttributeValue = ( fontStyles, value ) => {
	const attributeParsed = /var:preset\|font-style\|(.+)/.exec( value );

	if ( attributeParsed && attributeParsed[ 1 ] ) {
		return fontStyles.find( ( { slug } ) => slug === attributeParsed[ 1 ] )
			?.slug;
	}

	return value;
};
