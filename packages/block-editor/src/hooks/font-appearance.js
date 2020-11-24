/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import FontAppearanceControl from '../components/font-appearance-control';
import useEditorFeature from '../components/use-editor-feature';
import { cleanEmptyObject } from './utils';

/**
 * Key within block settings' support array indicating support for font style.
 */
export const FONT_STYLE_SUPPORT_KEY = '__experimentalFontStyle';

/**
 * Key within block settings' support array indicating support for font weight.
 */
export const FONT_WEIGHT_SUPPORT_KEY = '__experimentalFontWeight';

/**
 * Inspector control panel containing the font appearance options.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Font appearance edit element.
 */
export function FontAppearanceEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const fontStyles = useEditorFeature( 'typography.fontStyles' );
	const fontWeights = useEditorFeature( 'typography.fontWeights' );
	const isFontStyleDisabled = useIsFontStyleDisabled( props );
	const isFontWeightDisabled = useIsFontWeightDisabled( props );

	if ( isFontStyleDisabled && isFontWeightDisabled ) {
		return null;
	}

	const onChange = ( newStyles ) => {
		// Match style selection with preset and create CSS var style if appropriate.
		const presetStyle = fontStyles.find(
			( { slug } ) => slug === newStyles.fontStyle
		);
		const newFontStyle = presetStyle
			? `var:preset|font-style|${ presetStyle.slug }`
			: undefined;

		// Match weight selection with preset and create CSS var style if appropriate.
		const presetWeight = fontWeights.find(
			( { slug } ) => slug === newStyles.fontWeight
		);
		const newFontWeight = presetWeight
			? `var:preset|font-weight|${ presetWeight.slug }`
			: undefined;

		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					fontStyle: newFontStyle,
					fontWeight: newFontWeight,
				},
			} ),
		} );
	};

	const fontStyle = getFontAppearanceValueFromStyle(
		fontStyles,
		style?.typography?.fontStyle
	);

	const fontWeight = getFontAppearanceValueFromStyle(
		fontWeights,
		style?.typography?.fontWeight
	);

	return (
		<FontAppearanceControl
			onChange={ onChange }
			options={ {
				fontStyles: isFontStyleDisabled ? undefined : fontStyles,
				fontWeights: isFontWeightDisabled ? undefined : fontWeights,
			} }
			value={ { fontStyle, fontWeight } }
		/>
	);
}

/**
 * Checks if font style support has been disabled either by not opting in for
 * support or by failing to provide preset styles.
 *
 * @param  {Object} props      Block properties.
 * @param  {string} props.name Name for the block type.
 * @return {boolean}           Whether font style support has been disabled.
 */
export function useIsFontStyleDisabled( { name: blockName } = {} ) {
	const styleSupport = hasBlockSupport( blockName, FONT_STYLE_SUPPORT_KEY );
	const fontStyles = useEditorFeature( 'typography.fontStyles' );

	return ! styleSupport || ! fontStyles?.length;
}

/**
 * Checks if font weight support has been disabled either by not opting in for
 * support or by failing to provide preset weights.
 *
 * @param  {Object} props      Block properties.
 * @param  {string} props.name Name for the block type.
 * @return {boolean}           Whether font weight support has been disabled.
 */
export function useIsFontWeightDisabled( { name: blockName } = {} ) {
	const weightSupport = hasBlockSupport( blockName, FONT_WEIGHT_SUPPORT_KEY );
	const fontWeights = useEditorFeature( 'typography.fontWeights' );

	return ! weightSupport || ! fontWeights?.length;
}

/**
 * Checks if font appearance support has been disabled.
 *
 * @param  {Object} props      Block properties.
 * @return {boolean}           Whether font appearance support has been disabled.
 */
export function useIsFontAppearanceDisabled( props ) {
	const stylesDisabled = useIsFontStyleDisabled( props );
	const weightsDisabled = useIsFontWeightDisabled( props );

	return stylesDisabled && weightsDisabled;
}

/**
 * Extracts the current selection, if available, from the CSS variable set
 * within a style attribute property e.g. `style.typography.fontStyle`
 * or `style.typography.fontWeight`.
 *
 * @param  {Array}  presets  Available preset options.
 * @param  {string} style    Style attribute value to parse
 * @return {string}          Actual CSS property value.
 */
const getFontAppearanceValueFromStyle = ( presets, style ) => {
	if ( ! style ) {
		return undefined;
	}

	const parsedValue = style.slice( style.lastIndexOf( '|' ) + 1 );
	const preset = presets.find( ( { slug } ) => slug === parsedValue );

	return preset?.slug || style;
};
