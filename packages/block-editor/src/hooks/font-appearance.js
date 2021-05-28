/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import FontAppearanceControl from '../components/font-appearance-control';
import useSetting from '../components/use-setting';
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

	const hasFontStyles = ! useIsFontStyleDisabled( props );
	const hasFontWeights = ! useIsFontWeightDisabled( props );

	if ( ! hasFontStyles && ! hasFontWeights ) {
		return null;
	}

	const onChange = ( newStyles ) => {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				typography: {
					...style?.typography,
					fontStyle: newStyles.fontStyle,
					fontWeight: newStyles.fontWeight,
				},
			} ),
		} );
	};

	const fontStyle = style?.typography?.fontStyle;

	const fontWeight = style?.typography?.fontWeight;

	return (
		<FontAppearanceControl
			onChange={ onChange }
			hasFontStyles={ hasFontStyles }
			hasFontWeights={ hasFontWeights }
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
	const hasFontStyles = useSetting( 'typography.customFontStyle' );

	return ! styleSupport || ! hasFontStyles;
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
	const hasFontWeights = useSetting( 'typography.customFontWeight' );

	return ! weightSupport || ! hasFontWeights;
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
