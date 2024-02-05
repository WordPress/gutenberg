/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { memo, useMemo, useEffect, useId, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	useBlockEditContext,
	mayDisplayControlsKey,
	mayDisplayParentControlsKey,
} from '../components/block-edit/context';
import { useSettings } from '../components';
import { useSettingsForBlockElement } from '../components/global-styles/hooks';
import { getValueFromObjectPath, setImmutably } from '../utils/object';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
/**
 * External dependencies
 */
import classnames from 'classnames';

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
 * @param {string|Object} blockNameOrType Block name or block type object.
 * @param {string}        featureSet      Name of block support feature set.
 * @param {string}        feature         Name of the individual feature to check.
 *
 * @return {boolean} Whether serialization should occur.
 */
export function shouldSkipSerialization(
	blockNameOrType,
	featureSet,
	feature
) {
	const support = getBlockSupport( blockNameOrType, featureSet );
	const skipSerialization = support?.__experimentalSkipSerialization;

	if ( Array.isArray( skipSerialization ) ) {
		return skipSerialization.includes( feature );
	}

	return skipSerialization;
}

export function useStyleOverride( { id, css, assets, __unstableType } = {} ) {
	const { setStyleOverride, deleteStyleOverride } = unlock(
		useDispatch( blockEditorStore )
	);
	const fallbackId = useId();
	useEffect( () => {
		// Unmount if there is CSS and assets are empty.
		if ( ! css && ! assets ) return;
		const _id = id || fallbackId;
		setStyleOverride( _id, {
			id,
			css,
			assets,
			__unstableType,
		} );
		return () => {
			deleteStyleOverride( _id );
		};
	}, [
		id,
		css,
		assets,
		__unstableType,
		fallbackId,
		setStyleOverride,
		deleteStyleOverride,
	] );
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
		backgroundImage,
		backgroundSize,
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
		aspectRatio,
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
		shadow,
	] = useSettings(
		'background.backgroundImage',
		'background.backgroundSize',
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
		'dimensions.aspectRatio',
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
		'shadow'
	);

	const rawSettings = useMemo( () => {
		return {
			background: {
				backgroundImage,
				backgroundSize,
			},
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
				aspectRatio,
				minHeight,
			},
			layout,
			parentLayout,
			shadow,
		};
	}, [
		backgroundImage,
		backgroundSize,
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
		aspectRatio,
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
		shadow,
	] );

	return useSettingsForBlockElement( rawSettings, name );
}

export function createBlockEditFilter( features ) {
	// We don't want block controls to re-render when typing inside a block.
	// `memo` will prevent re-renders unless props change, so only pass the
	// needed props and not the whole attributes object.
	features = features.map( ( settings ) => {
		return { ...settings, Edit: memo( settings.edit ) };
	} );
	const withBlockEditHooks = createHigherOrderComponent(
		( OriginalBlockEdit ) => ( props ) => {
			const context = useBlockEditContext();
			// CAUTION: code added before this line will be executed for all
			// blocks, not just those that support the feature! Code added
			// above this line should be carefully evaluated for its impact on
			// performance.
			return [
				...features.map( ( feature, i ) => {
					const {
						Edit,
						hasSupport,
						attributeKeys = [],
						shareWithChildBlocks,
					} = feature;
					const shouldDisplayControls =
						context[ mayDisplayControlsKey ] ||
						( context[ mayDisplayParentControlsKey ] &&
							shareWithChildBlocks );

					if (
						! shouldDisplayControls ||
						! hasSupport( props.name )
					) {
						return null;
					}

					const neededProps = {};
					for ( const key of attributeKeys ) {
						if ( props.attributes[ key ] ) {
							neededProps[ key ] = props.attributes[ key ];
						}
					}

					return (
						<Edit
							// We can use the index because the array length
							// is fixed per page load right now.
							key={ i }
							name={ props.name }
							isSelected={ props.isSelected }
							clientId={ props.clientId }
							setAttributes={ props.setAttributes }
							__unstableParentLayout={
								props.__unstableParentLayout
							}
							// This component is pure, so only pass needed
							// props!!!
							{ ...neededProps }
						/>
					);
				} ),
				<OriginalBlockEdit key="edit" { ...props } />,
			];
		},
		'withBlockEditHooks'
	);
	addFilter( 'editor.BlockEdit', 'core/editor/hooks', withBlockEditHooks );
}

function BlockProps( { index, useBlockProps, setAllWrapperProps, ...props } ) {
	const wrapperProps = useBlockProps( props );
	const setWrapperProps = ( next ) =>
		setAllWrapperProps( ( prev ) => {
			const nextAll = [ ...prev ];
			nextAll[ index ] = next;
			return nextAll;
		} );
	// Setting state after every render is fine because this component is
	// pure and will only re-render when needed props change.
	useEffect( () => {
		// We could shallow compare the props, but since this component only
		// changes when needed attributes change, the benefit is probably small.
		setWrapperProps( wrapperProps );
		return () => {
			setWrapperProps( undefined );
		};
	} );
	return null;
}

const BlockPropsPure = memo( BlockProps );

export function createBlockListBlockFilter( features ) {
	const withBlockListBlockHooks = createHigherOrderComponent(
		( BlockListBlock ) => ( props ) => {
			const [ allWrapperProps, setAllWrapperProps ] = useState(
				Array( features.length ).fill( undefined )
			);
			return [
				...features.map( ( feature, i ) => {
					const {
						hasSupport,
						attributeKeys = [],
						useBlockProps,
					} = feature;

					const neededProps = {};
					for ( const key of attributeKeys ) {
						if ( props.attributes[ key ] ) {
							neededProps[ key ] = props.attributes[ key ];
						}
					}

					if (
						// Skip rendering if none of the needed attributes are
						// set.
						! Object.keys( neededProps ).length ||
						! hasSupport( props.name )
					) {
						return null;
					}

					return (
						<BlockPropsPure
							// We can use the index because the array length
							// is fixed per page load right now.
							key={ i }
							index={ i }
							useBlockProps={ useBlockProps }
							// This component is pure, so we must pass a stable
							// function reference.
							setAllWrapperProps={ setAllWrapperProps }
							name={ props.name }
							// This component is pure, so only pass needed
							// props!!!
							{ ...neededProps }
						/>
					);
				} ),
				<BlockListBlock
					key="edit"
					{ ...props }
					wrapperProps={ allWrapperProps
						.filter( Boolean )
						.reduce( ( acc, wrapperProps ) => {
							return {
								...acc,
								...wrapperProps,
								className: classnames(
									acc.className,
									wrapperProps.className
								),
								style: {
									...acc.style,
									...wrapperProps.style,
								},
							};
						}, props.wrapperProps || {} ) }
				/>,
			];
		},
		'withBlockListBlockHooks'
	);
	addFilter(
		'editor.BlockListBlock',
		'core/editor/hooks',
		withBlockListBlockHooks
	);
}

export function createBlockSaveFilter( features ) {
	function extraPropsFromHooks( props, name, attributes ) {
		return features.reduce( ( accu, feature ) => {
			const { hasSupport, attributeKeys = [], addSaveProps } = feature;

			const neededAttributes = {};
			for ( const key of attributeKeys ) {
				if ( attributes[ key ] ) {
					neededAttributes[ key ] = attributes[ key ];
				}
			}

			if (
				// Skip rendering if none of the needed attributes are
				// set.
				! Object.keys( neededAttributes ).length ||
				! hasSupport( name )
			) {
				return accu;
			}

			return addSaveProps( accu, name, neededAttributes );
		}, props );
	}
	addFilter(
		'blocks.getSaveContent.extraProps',
		'core/editor/hooks',
		extraPropsFromHooks,
		0
	);
	addFilter(
		'blocks.getSaveContent.extraProps',
		'core/editor/hooks',
		( props ) => {
			// Previously we had a filter deleting the className if it was an empty
			// string. That filter is no longer running, so now we need to delete it
			// here.
			if ( props.hasOwnProperty( 'className' ) && ! props.className ) {
				delete props.className;
			}

			return props;
		}
	);
}
