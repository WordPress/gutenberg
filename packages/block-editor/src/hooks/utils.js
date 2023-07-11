/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSetting } from '../components';
import { useSettingsForBlockElement } from '../components/global-styles/hooks';
import { setImmutably } from '../utils/object';

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
				const styleValue = get( referenceBlockAttributes, path );
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
	const fontFamilies = useSetting( 'typography.fontFamilies' );
	const fontSizes = useSetting( 'typography.fontSizes' );
	const customFontSize = useSetting( 'typography.customFontSize' );
	const fontStyle = useSetting( 'typography.fontStyle' );
	const fontWeight = useSetting( 'typography.fontWeight' );
	const lineHeight = useSetting( 'typography.lineHeight' );
	const textColumns = useSetting( 'typography.textColumns' );
	const textDecoration = useSetting( 'typography.textDecoration' );
	const writingMode = useSetting( 'typography.writingMode' );
	const textTransform = useSetting( 'typography.textTransform' );
	const letterSpacing = useSetting( 'typography.letterSpacing' );
	const padding = useSetting( 'spacing.padding' );
	const margin = useSetting( 'spacing.margin' );
	const blockGap = useSetting( 'spacing.blockGap' );
	const spacingSizes = useSetting( 'spacing.spacingSizes' );
	const units = useSetting( 'spacing.units' );
	const minHeight = useSetting( 'dimensions.minHeight' );
	const layout = useSetting( 'layout' );
	const borderColor = useSetting( 'border.color' );
	const borderRadius = useSetting( 'border.radius' );
	const borderStyle = useSetting( 'border.style' );
	const borderWidth = useSetting( 'border.width' );
	const customColorsEnabled = useSetting( 'color.custom' );
	const customColors = useSetting( 'color.palette.custom' );
	const customDuotone = useSetting( 'color.customDuotone' );
	const themeColors = useSetting( 'color.palette.theme' );
	const defaultColors = useSetting( 'color.palette.default' );
	const defaultPalette = useSetting( 'color.defaultPalette' );
	const defaultDuotone = useSetting( 'color.defaultDuotone' );
	const userDuotonePalette = useSetting( 'color.duotone.custom' );
	const themeDuotonePalette = useSetting( 'color.duotone.theme' );
	const defaultDuotonePalette = useSetting( 'color.duotone.default' );
	const userGradientPalette = useSetting( 'color.gradients.custom' );
	const themeGradientPalette = useSetting( 'color.gradients.theme' );
	const defaultGradientPalette = useSetting( 'color.gradients.default' );
	const defaultGradients = useSetting( 'color.defaultGradients' );
	const areCustomGradientsEnabled = useSetting( 'color.customGradient' );
	const isBackgroundEnabled = useSetting( 'color.background' );
	const isLinkEnabled = useSetting( 'color.link' );
	const isTextEnabled = useSetting( 'color.text' );

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
	] );

	return useSettingsForBlockElement( rawSettings, name );
}
