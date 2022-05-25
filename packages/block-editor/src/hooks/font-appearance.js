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
export const FONT_STYLE_SUPPORT_KEY = 'typography.__experimentalFontStyle';

/**
 * Key within block settings' support array indicating support for font weight.
 */
export const FONT_WEIGHT_SUPPORT_KEY = 'typography.__experimentalFontWeight';

/**
 * Inspector control panel containing the font appearance options.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Font appearance edit element.
 */
export function FontAppearanceEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const hasFontStyles = ! useIsFontStyleDisabled( props );
	const hasFontWeights = ! useIsFontWeightDisabled( props );

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
 * @param {Object} props      Block properties.
 * @param {string} props.name Name for the block type.
 *
 * @return {boolean} Whether font style support has been disabled.
 */
export function useIsFontStyleDisabled( { name: blockName } = {} ) {
	const styleSupport = hasBlockSupport( blockName, FONT_STYLE_SUPPORT_KEY );
	const hasFontStyles = useSetting( 'typography.fontStyle' );

	return ! styleSupport || ! hasFontStyles;
}

/**
 * Checks if font weight support has been disabled either by not opting in for
 * support or by failing to provide preset weights.
 *
 * @param {Object} props      Block properties.
 * @param {string} props.name Name for the block type.
 *
 * @return {boolean} Whether font weight support has been disabled.
 */
export function useIsFontWeightDisabled( { name: blockName } = {} ) {
	const weightSupport = hasBlockSupport( blockName, FONT_WEIGHT_SUPPORT_KEY );
	const hasFontWeights = useSetting( 'typography.fontWeight' );

	return ! weightSupport || ! hasFontWeights;
}

/**
 * Checks if font appearance support has been disabled.
 *
 * @param {Object} props Block properties.
 *
 * @return {boolean} Whether font appearance support has been disabled.
 */
export function useIsFontAppearanceDisabled( props ) {
	const stylesDisabled = useIsFontStyleDisabled( props );
	const weightsDisabled = useIsFontWeightDisabled( props );

	return stylesDisabled && weightsDisabled;
}

/**
 * Checks if there is either a font style or weight value set within the
 * typography styles.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a font style or weight.
 */
export function hasFontAppearanceValue( props ) {
	const { fontStyle, fontWeight } = props.attributes.style?.typography || {};
	return !! fontStyle || !! fontWeight;
}

/**
 * Resets the font style and weight block support attributes. This can be used
 * when disabling the font appearance support controls for a block via a
 * progressive discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetFontAppearance( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				fontStyle: undefined,
				fontWeight: undefined,
			},
		} ),
	} );
}
