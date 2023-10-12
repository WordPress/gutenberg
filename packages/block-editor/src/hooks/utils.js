/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSettings } from '../components';
import { useSettingsForBlockElement } from '../components/global-styles/hooks';
import { getValueFromObjectPath, setImmutably } from '../utils/object';

/**
 * Removed falsy values from nested object.
 *
 * @param {*} object
 * @return {*} Object cleaned from falsy values
 */
export const cleanEmptyObject = ( object ) => {
	if (
		object === null ||
		typeof object !== 'object' ||
		Array.isArray( object )
	) {
		return object;
	}

	const cleanedNestedObjects = Object.entries( object )
		.map( ( [ key, value ] ) => [ key, cleanEmptyObject( value ) ] )
		.filter( ( [ , value ] ) => value !== undefined );
	return ! cleanedNestedObjects.length
		? undefined
		: Object.fromEntries( cleanedNestedObjects );
};

export function transformStyles(
	activeSupports,
	migrationPaths,
	result,
	source,
	index,
	results
) {
	// If there are no active supports return early.
	if (
		Object.values( activeSupports ?? {} ).every(
			( isActive ) => ! isActive
		)
	) {
		return result;
	}
	// If the condition verifies we are probably in the presence of a wrapping transform
	// e.g: nesting paragraphs in a group or columns and in that case the styles should not be transformed.
	if ( results.length === 1 && result.innerBlocks.length === source.length ) {
		return result;
	}
	// For cases where we have a transform from one block to multiple blocks
	// or multiple blocks to one block we apply the styles of the first source block
	// to the result(s).
	let referenceBlockAttributes = source[ 0 ]?.attributes;
	// If we are in presence of transform between more than one block in the source
	// that has more than one block in the result
	// we apply the styles on source N to the result N,
	// if source N does not exists we do nothing.
	if ( results.length > 1 && source.length > 1 ) {
		if ( source[ index ] ) {
			referenceBlockAttributes = source[ index ]?.attributes;
		} else {
			return result;
		}
	}
	let returnBlock = result;
	Object.entries( activeSupports ).forEach( ( [ support, isActive ] ) => {
		if ( isActive ) {
			migrationPaths[ support ].forEach( ( path ) => {
				const styleValue = getValueFromObjectPath(
					referenceBlockAttributes,
					path
				);
				if ( styleValue ) {
					returnBlock = {
						...returnBlock,
						attributes: setImmutably(
							returnBlock.attributes,
							path,
							styleValue
						),
					};
				}
			} );
		}
	} );
	return returnBlock;
}

/**
 * Check whether serialization of specific block support feature or set should
 * be skipped.
 *
 * @param {string|Object} blockType  Block name or block type object.
 * @param {string}        featureSet Name of block support feature set.
 * @param {string}        feature    Name of the individual feature to check.
 *
 * @return {boolean} Whether serialization should occur.
 */
export function shouldSkipSerialization( blockType, featureSet, feature ) {
	const support = getBlockSupport( blockType, featureSet );
	const skipSerialization = support?.__experimentalSkipSerialization;

	if ( Array.isArray( skipSerialization ) ) {
		return skipSerialization.includes( feature );
	}

	return skipSerialization;
}

/**
 * Based on the block and its context, returns an object of all the block settings.
 * This object can be passed as a prop to all the Styles UI components
 * (TypographyPanel, DimensionsPanel...).
 *
 * @param {string} name         Block name.
 * @param {*}      parentLayout Parent layout.
 *
 * @return {Object} Settings object.
 */
export function useBlockSettings( name, parentLayout ) {
	const [
		fontFamilies,
		fontSizes,
		customFontSize,
		fontStyle,
		fontWeight,
		lineHeight,
		textColumns,
		textDecoration,
		writingMode,
		textTransform,
		letterSpacing,
		padding,
		margin,
		blockGap,
		spacingSizes,
		units,
		minHeight,
		layout,
		borderColor,
		borderRadius,
		borderStyle,
		borderWidth,
		customColorsEnabled,
		customColors,
		customDuotone,
		themeColors,
		defaultColors,
		defaultPalette,
		defaultDuotone,
		userDuotonePalette,
		themeDuotonePalette,
		defaultDuotonePalette,
		userGradientPalette,
		themeGradientPalette,
		defaultGradientPalette,
		defaultGradients,
		areCustomGradientsEnabled,
		isBackgroundEnabled,
		isLinkEnabled,
		isTextEnabled,
		isHeadingEnabled,
		isButtonEnabled,
	] = useSettings( [
		'typography.fontFamilies',
		'typography.fontSizes',
		'typography.customFontSize',
		'typography.fontStyle',
		'typography.fontWeight',
		'typography.lineHeight',
		'typography.textColumns',
		'typography.textDecoration',
		'typography.writingMode',
		'typography.textTransform',
		'typography.letterSpacing',
		'spacing.padding',
		'spacing.margin',
		'spacing.blockGap',
		'spacing.spacingSizes',
		'spacing.units',
		'dimensions.minHeight',
		'layout',
		'border.color',
		'border.radius',
		'border.style',
		'border.width',
		'color.custom',
		'color.palette.custom',
		'color.customDuotone',
		'color.palette.theme',
		'color.palette.default',
		'color.defaultPalette',
		'color.defaultDuotone',
		'color.duotone.custom',
		'color.duotone.theme',
		'color.duotone.default',
		'color.gradients.custom',
		'color.gradients.theme',
		'color.gradients.default',
		'color.defaultGradients',
		'color.customGradient',
		'color.background',
		'color.link',
		'color.text',
		'color.heading',
		'color.button',
	] );

	const rawSettings = useMemo( () => {
		return {
			color: {
				palette: {
					custom: customColors,
					theme: themeColors,
					default: defaultColors,
				},
				gradients: {
					custom: userGradientPalette,
					theme: themeGradientPalette,
					default: defaultGradientPalette,
				},
				duotone: {
					custom: userDuotonePalette,
					theme: themeDuotonePalette,
					default: defaultDuotonePalette,
				},
				defaultGradients,
				defaultPalette,
				defaultDuotone,
				custom: customColorsEnabled,
				customGradient: areCustomGradientsEnabled,
				customDuotone,
				background: isBackgroundEnabled,
				link: isLinkEnabled,
				heading: isHeadingEnabled,
				button: isButtonEnabled,
				text: isTextEnabled,
			},
			typography: {
				fontFamilies: {
					custom: fontFamilies,
				},
				fontSizes: {
					custom: fontSizes,
				},
				customFontSize,
				fontStyle,
				fontWeight,
				lineHeight,
				textColumns,
				textDecoration,
				textTransform,
				letterSpacing,
				writingMode,
			},
			spacing: {
				spacingSizes: {
					custom: spacingSizes,
				},
				padding,
				margin,
				blockGap,
				units,
			},
			border: {
				color: borderColor,
				radius: borderRadius,
				style: borderStyle,
				width: borderWidth,
			},
			dimensions: {
				minHeight,
			},
			layout,
			parentLayout,
		};
	}, [
		fontFamilies,
		fontSizes,
		customFontSize,
		fontStyle,
		fontWeight,
		lineHeight,
		textColumns,
		textDecoration,
		textTransform,
		letterSpacing,
		writingMode,
		padding,
		margin,
		blockGap,
		spacingSizes,
		units,
		minHeight,
		layout,
		parentLayout,
		borderColor,
		borderRadius,
		borderStyle,
		borderWidth,
		customColorsEnabled,
		customColors,
		customDuotone,
		themeColors,
		defaultColors,
		defaultPalette,
		defaultDuotone,
		userDuotonePalette,
		themeDuotonePalette,
		defaultDuotonePalette,
		userGradientPalette,
		themeGradientPalette,
		defaultGradientPalette,
		defaultGradients,
		areCustomGradientsEnabled,
		isBackgroundEnabled,
		isLinkEnabled,
		isTextEnabled,
		isHeadingEnabled,
		isButtonEnabled,
	] );

	return useSettingsForBlockElement( rawSettings, name );
}
