/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useCallback } from '@wordpress/element';
import {
	getBlockSupport,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';
import { useSettings } from '../components/use-settings';
import { getLayoutType, getLayoutTypes } from '../layouts';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { LAYOUT_DEFINITIONS } from '../layouts/definitions';
import { cleanEmptyObject, useBlockSettings, useStyleOverride } from './utils';
import { unlock } from '../lock-unlock';
import { globalStylesDataKey } from '../store/private-keys';
import { getVariationNameFromClass } from './block-style-variation';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
	isDefaultBlockStyleState,
	setStyleForState,
} from './block-style-state';

const VARIATION_PREFIX = 'is-style-';

const layoutBlockSupportKey = 'layout';
// Keep in sync with WP_Theme_JSON_Gutenberg::RESPONSIVE_BREAKPOINTS and
// packages/global-styles-engine/src/core/render.tsx.
const RESPONSIVE_BREAKPOINTS = {
	'@mobile': '@media (width <= 480px)',
	'@tablet': '@media (480px < width <= 782px)',
};
const CHILD_LAYOUT_KEYS = [
	'selfStretch',
	'flexSize',
	'columnStart',
	'columnSpan',
	'rowStart',
	'rowSpan',
];
const { kebabCase } = unlock( componentsPrivateApis );

function getDefaultLayout( layoutBlockSupport = {}, blockVariation ) {
	const defaultBlockLayout = layoutBlockSupport?.default;

	return blockVariation?.attributes?.layout ?? defaultBlockLayout;
}

/**
 * Returns the layout values to use when resetting layout controls.
 *
 * @param { Object }           layoutBlockSupport Block layout support settings.
 * @param { Object|undefined } blockVariation     Block variation settings.
 *
 * @return { Object|undefined } Reset layout values.
 */
export function getResetLayout( layoutBlockSupport = {}, blockVariation ) {
	return cleanEmptyObject( {
		...getDefaultLayout( layoutBlockSupport, blockVariation ),
	} );
}

function getLayoutStateOverrides(
	layout = {},
	baseLayout = {},
	existingLayout = {}
) {
	const overrides = {};
	const childLayoutValues = Object.fromEntries(
		CHILD_LAYOUT_KEYS.filter( ( key ) =>
			Object.hasOwn( existingLayout || {}, key )
		).map( ( key ) => [ key, existingLayout[ key ] ] )
	);

	Object.entries( layout || {} ).forEach( ( [ key, value ] ) => {
		if (
			! CHILD_LAYOUT_KEYS.includes( key ) &&
			value !== baseLayout?.[ key ]
		) {
			overrides[ key ] = value;
		}
	} );

	return cleanEmptyObject( {
		...childLayoutValues,
		...overrides,
	} );
}

function getLayoutContainerValues( layout = {} ) {
	return Object.fromEntries(
		Object.entries( layout || {} ).filter(
			( [ key ] ) => ! CHILD_LAYOUT_KEYS.includes( key )
		)
	);
}

function hasLayoutBlockSupport( blockName ) {
	return (
		hasBlockSupport( blockName, 'layout' ) ||
		hasBlockSupport( blockName, '__experimentalLayout' )
	);
}

/**
 * Generates the utility classnames for the given block's layout attributes.
 *
 * @param { Object } blockAttributes Block attributes.
 * @param { string } blockName       Block name.
 *
 * @return { Array } Array of CSS classname strings.
 */
export function useLayoutClasses( blockAttributes = {}, blockName = '' ) {
	const { layout } = blockAttributes;
	const { default: defaultBlockLayout } =
		getBlockSupport( blockName, layoutBlockSupportKey ) || {};
	const usedLayout =
		layout?.inherit || layout?.contentSize || layout?.wideSize
			? { ...layout, type: 'constrained' }
			: layout || defaultBlockLayout || {};

	const layoutClassnames = [];

	if ( LAYOUT_DEFINITIONS[ usedLayout?.type || 'default' ]?.className ) {
		const baseClassName =
			LAYOUT_DEFINITIONS[ usedLayout?.type || 'default' ]?.className;
		const splitBlockName = blockName.split( '/' );
		const fullBlockName =
			splitBlockName[ 0 ] === 'core'
				? splitBlockName.pop()
				: splitBlockName.join( '-' );
		const compoundClassName = `wp-block-${ fullBlockName }-${ baseClassName }`;
		layoutClassnames.push( baseClassName, compoundClassName );
	}

	const hasGlobalPadding = useSelect(
		( select ) => {
			// Early return to avoid subscription when layout doesn't use global padding
			if (
				! usedLayout?.inherit &&
				! usedLayout?.contentSize &&
				usedLayout?.type !== 'constrained'
			) {
				return false;
			}

			return select( blockEditorStore ).getSettings()
				.__experimentalFeatures?.useRootPaddingAwareAlignments;
		},
		[ usedLayout?.contentSize, usedLayout?.inherit, usedLayout?.type ]
	);

	if ( hasGlobalPadding ) {
		layoutClassnames.push( 'has-global-padding' );
	}

	if ( usedLayout?.orientation ) {
		layoutClassnames.push( `is-${ kebabCase( usedLayout.orientation ) }` );
	}

	if ( usedLayout?.justifyContent ) {
		layoutClassnames.push(
			`is-content-justification-${ kebabCase(
				usedLayout.justifyContent
			) }`
		);
	}

	if ( usedLayout?.flexWrap && usedLayout.flexWrap === 'nowrap' ) {
		layoutClassnames.push( 'is-nowrap' );
	}

	return layoutClassnames;
}

/**
 * Generates a CSS rule with the given block's layout styles.
 *
 * @param { Object } blockAttributes Block attributes.
 * @param { string } blockName       Block name.
 * @param { string } selector        A selector to use in generating the CSS rule.
 *
 * @return { string } CSS rule.
 */
export function useLayoutStyles( blockAttributes = {}, blockName, selector ) {
	const { layout = {}, style = {} } = blockAttributes;
	// Update type for blocks using legacy layouts.
	const usedLayout =
		layout?.inherit || layout?.contentSize || layout?.wideSize
			? { ...layout, type: 'constrained' }
			: layout || {};
	const fullLayoutType = getLayoutType( usedLayout?.type || 'default' );
	const [ blockGapSupport ] = useSettings( 'spacing.blockGap' );
	const hasBlockGapSupport = blockGapSupport !== null;
	return fullLayoutType?.getLayoutStyle?.( {
		blockName,
		selector,
		layout,
		style,
		hasBlockGapSupport,
	} );
}

/**
 * Generates responsive layout CSS for viewport state styles.
 *
 * Viewport state blockGap values need to go through the layout definitions
 * because flow/constrained layouts use child margins while flex/grid use gap.
 *
 * @param { Object }  options                     Options.
 * @param { Object }  options.attributes          Block attributes.
 * @param { string }  options.blockName           Block name.
 * @param { string }  options.selector            CSS selector.
 * @param { Object }  options.layout              Active block layout.
 * @param { boolean } options.hasBlockGapSupport  Whether block gap is supported.
 * @param { * }       options.globalBlockGapValue Global block gap fallback.
 *
 * @return { string } CSS rule.
 */
export function getResponsiveLayoutStyles( {
	attributes = {},
	blockName,
	selector,
	layout = {},
	hasBlockGapSupport,
	globalBlockGapValue,
} ) {
	return Object.entries( RESPONSIVE_BREAKPOINTS )
		.map( ( [ viewport, mediaQuery ] ) => {
			const viewportStyle = getStyleForState( attributes?.style, {
				viewport,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} );
			const viewportLayout = getLayoutContainerValues(
				viewportStyle?.layout
			);
			const hasViewportLayout = Object.keys( viewportLayout ).length > 0;
			const hasViewportBlockGap =
				viewportStyle?.spacing &&
				Object.hasOwn( viewportStyle.spacing, 'blockGap' );
			const hasViewportPadding =
				viewportStyle?.spacing &&
				Object.hasOwn( viewportStyle.spacing, 'padding' );
			if (
				! hasViewportLayout &&
				! hasViewportBlockGap &&
				! hasViewportPadding
			) {
				return '';
			}

			const layoutType = getLayoutType( layout?.type || 'default' );
			const viewportCSS = layoutType?.getLayoutStyle?.( {
				blockName,
				selector,
				layout,
				viewportOverrides: viewportLayout,
				style: viewportStyle,
				hasBlockGapSupport,
				globalBlockGapValue,
			} );

			return viewportCSS ? `${ mediaQuery }{${ viewportCSS }}` : '';
		} )
		.filter( Boolean )
		.join( '' );
}

function LayoutPanelPure( {
	layout,
	style,
	setAttributes,
	name: blockName,
	clientId,
} ) {
	const settings = useBlockSettings( blockName );
	// Block settings come from theme.json under settings.[blockName].
	const { layout: layoutSettings } = settings;
	const { themeSupportsLayout, activeBlockVariation, selectedState } =
		useSelect(
			( select ) => {
				const blockEditorSelect = select( blockEditorStore );
				const { getBlockAttributes, getSettings } = blockEditorSelect;
				const { getSelectedBlockStyleState } =
					unlock( blockEditorSelect );
				return {
					activeBlockVariation: select(
						blocksStore
					).getActiveBlockVariation(
						blockName,
						getBlockAttributes( clientId ) || {},
						'block'
					),
					themeSupportsLayout: getSettings().supportsLayout,
					selectedState:
						getSelectedBlockStyleState?.( clientId ) ??
						DEFAULT_BLOCK_STYLE_STATE,
				};
			},
			[ blockName, clientId ]
		);

	const blockEditingMode = useBlockEditingMode();
	const isViewportLayoutState =
		hasViewportBlockStyleState( selectedState ) &&
		! hasPseudoBlockStyleState( selectedState );
	const resetLayoutFilter = useCallback(
		( ...resetArgs ) => {
			const attributes = resetArgs[ 0 ] || {};
			const context = resetArgs[ 1 ] || {};

			if ( isViewportLayoutState ) {
				const existingStateStyle =
					getStyleForState(
						attributes.style ?? style,
						selectedState
					) || {};
				const nextStateStyle = cleanEmptyObject( {
					...existingStateStyle,
					layout: undefined,
				} );

				return {
					style: setStyleForState(
						attributes.style ?? style,
						selectedState,
						nextStateStyle
					),
				};
			}

			const resetBlockName = context.name || blockName;
			const resetLayoutBlockSupport = getBlockSupport(
				resetBlockName,
				layoutBlockSupportKey,
				{}
			);

			return {
				layout: getResetLayout(
					resetLayoutBlockSupport,
					activeBlockVariation
				),
			};
		},
		[
			blockName,
			activeBlockVariation,
			isViewportLayoutState,
			selectedState,
			style,
		]
	);

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	// Layout block support comes from the block's block.json.
	const layoutBlockSupport = getBlockSupport(
		blockName,
		layoutBlockSupportKey,
		{}
	);
	const blockSupportAndThemeSettings = {
		...layoutSettings,
		...layoutBlockSupport,
	};
	const {
		allowSwitching,
		allowEditing = true,
		allowInheriting = true,
		default: defaultBlockLayout,
	} = blockSupportAndThemeSettings;

	if ( ! allowEditing ) {
		return null;
	}

	/*
	 * Try to find the layout type from either the
	 * block's layout settings or any saved layout config.
	 */
	const baseLayout = layout || defaultBlockLayout || {};
	const stateStyle = isViewportLayoutState
		? getStyleForState( style, selectedState )
		: undefined;
	const stateLayout = stateStyle?.layout;
	const usedLayout = isViewportLayoutState
		? cleanEmptyObject( {
				...baseLayout,
				...stateLayout,
		  } ) || {}
		: baseLayout;
	const resetLayoutDefaults = isViewportLayoutState
		? baseLayout
		: getResetLayout( layoutBlockSupport, activeBlockVariation );
	const blockSupportAndLayout = {
		...layoutBlockSupport,
		...usedLayout,
	};
	const { type, default: { type: defaultType = 'default' } = {} } =
		blockSupportAndLayout;
	const blockLayoutType = type || defaultType;

	// Only show the inherit toggle if it's supported,
	// and either the default / flow or the constrained layout type is in use, as the toggle switches from one to the other.
	const showInheritToggle = !! (
		allowInheriting &&
		( ! blockLayoutType ||
			blockLayoutType === 'default' ||
			blockLayoutType === 'constrained' ||
			blockSupportAndLayout.inherit )
	);

	const { inherit = false, contentSize = null } = usedLayout;
	/**
	 * `themeSupportsLayout` is only relevant to the `default/flow` or
	 * `constrained` layouts and it should not be taken into account when other
	 * `layout` types are used.
	 */
	if (
		( blockLayoutType === 'default' ||
			blockLayoutType === 'constrained' ) &&
		! themeSupportsLayout
	) {
		return null;
	}
	const layoutType = getLayoutType( blockLayoutType );
	const constrainedType = getLayoutType( 'constrained' );
	const displayControlsForLegacyLayouts =
		! usedLayout.type && ( contentSize || inherit );
	const hasContentSizeOrLegacySettings = !! inherit || !! contentSize;
	const showLayoutTypeSwitcher =
		isDefaultBlockStyleState( selectedState ) &&
		! inherit &&
		allowSwitching;

	const onChangeLayout = ( newLayout ) => {
		if ( isViewportLayoutState ) {
			const nextStateStyle = cleanEmptyObject( {
				...stateStyle,
				layout: getLayoutStateOverrides(
					cleanEmptyObject( newLayout ),
					baseLayout,
					stateStyle?.layout
				),
			} );
			setAttributes( {
				style: setStyleForState( style, selectedState, nextStateStyle ),
			} );
			return;
		}

		setAttributes( { layout: cleanEmptyObject( newLayout ) } );
	};
	const onChangeType = ( newType ) => onChangeLayout( { type: newType } );
	const resetLayout = () => onChangeLayout( resetLayoutDefaults );
	const resetInheritToggle = () => onChangeLayout( { type: 'default' } );
	const isUsingContentWidth = () =>
		layoutType?.name === 'constrained' || hasContentSizeOrLegacySettings;
	const hasInheritToggleValue = () =>
		isViewportLayoutState
			? ( usedLayout?.type ?? 'default' ) !==
			  ( resetLayoutDefaults?.type ?? 'default' )
			: layout?.type === 'constrained';
	const hasLayoutTypeValue = () =>
		( usedLayout?.type ?? 'default' ) !==
		( resetLayoutDefaults?.type ?? 'default' );

	return (
		<>
			<InspectorControls
				group="layout"
				resetAllFilter={ resetLayoutFilter }
			>
				{ showInheritToggle && (
					<ToolsPanelItem
						label={ __( 'Use content width' ) }
						hasValue={ hasInheritToggleValue }
						onDeselect={ resetInheritToggle }
						isShownByDefault
						panelId={ clientId }
					>
						<ToggleControl
							label={ __( 'Inner blocks use content width' ) }
							checked={ isUsingContentWidth() }
							onChange={ () =>
								onChangeLayout( {
									type: isUsingContentWidth()
										? 'default'
										: 'constrained',
								} )
							}
							help={
								isUsingContentWidth()
									? __(
											'Nested blocks use content width with options for full and wide widths.'
									  )
									: __(
											'Nested blocks will fill the width of this container.'
									  )
							}
						/>
					</ToolsPanelItem>
				) }

				{ showLayoutTypeSwitcher && (
					<ToolsPanelItem
						label={ __( 'Layout type' ) }
						hasValue={ hasLayoutTypeValue }
						onDeselect={ resetLayout }
						isShownByDefault
						panelId={ clientId }
					>
						<LayoutTypeSwitcher
							type={ blockLayoutType }
							onChange={ onChangeType }
						/>
					</ToolsPanelItem>
				) }

				{ layoutType && layoutType.name !== 'default' && (
					<layoutType.inspectorControls
						layout={ usedLayout }
						value={ layout }
						onChange={ onChangeLayout }
						layoutBlockSupport={ blockSupportAndThemeSettings }
						resetLayout={ resetLayoutDefaults }
						name={ blockName }
						clientId={ clientId }
					/>
				) }
				{ constrainedType && displayControlsForLegacyLayouts && (
					<constrainedType.inspectorControls
						layout={ usedLayout }
						value={ layout }
						onChange={ onChangeLayout }
						layoutBlockSupport={ blockSupportAndThemeSettings }
						resetLayout={ resetLayoutDefaults }
						name={ blockName }
						clientId={ clientId }
					/>
				) }
			</InspectorControls>
			{ ! inherit && layoutType && (
				<layoutType.toolBarControls
					layout={ usedLayout }
					onChange={ onChangeLayout }
					layoutBlockSupport={ layoutBlockSupport }
					name={ blockName }
					clientId={ clientId }
				/>
			) }
		</>
	);
}

export default {
	shareWithChildBlocks: true,
	edit: LayoutPanelPure,
	attributeKeys: [ 'layout', 'style' ],
	hasSupport( name ) {
		return hasLayoutBlockSupport( name );
	},
};

function LayoutTypeSwitcher( { type, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			isBlock
			label={ __( 'Layout type' ) }
			hideLabelFromVision
			isAdaptiveWidth
			value={ type }
			onChange={ onChange }
		>
			{ getLayoutTypes().map( ( { name, label } ) => {
				return (
					<ToggleGroupControlOption
						key={ name }
						value={ name }
						label={ label }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}

/**
 * Filters registered block settings, extending attributes to include `layout`.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	if ( 'type' in ( settings.attributes?.layout ?? {} ) ) {
		return settings;
	}
	if ( hasLayoutBlockSupport( settings ) ) {
		settings.attributes = {
			...settings.attributes,
			layout: {
				type: 'object',
			},
		};
	}

	return settings;
}

function BlockWithLayoutStyles( {
	block: BlockListBlock,
	props,
	blockGapSupport,
	globalBlockGapValue,
	layoutClasses,
} ) {
	const { name, attributes } = props;
	const id = useInstanceId( BlockListBlock );
	const { layout } = attributes;
	const { default: defaultBlockLayout } =
		getBlockSupport( name, layoutBlockSupportKey ) || {};
	const usedLayout =
		layout?.inherit || layout?.contentSize || layout?.wideSize
			? { ...layout, type: 'constrained' }
			: layout || defaultBlockLayout || {};

	const selectorPrefix = `wp-container-${ kebabCase( name ) }-is-layout-`;
	// Higher specificity to override defaults from theme.json.
	const selector = `.${ selectorPrefix }${ id }`;
	const hasBlockGapSupport = blockGapSupport !== null;

	// Get CSS string for the current layout type.
	// The CSS and `style` element is only output if it is not empty.
	const fullLayoutType = getLayoutType( usedLayout?.type || 'default' );
	const baseLayoutCSS = fullLayoutType?.getLayoutStyle?.( {
		blockName: name,
		selector,
		layout: usedLayout,
		style: attributes?.style,
		hasBlockGapSupport,
		globalBlockGapValue,
	} );
	const responsiveLayoutCSS = getResponsiveLayoutStyles( {
		attributes,
		blockName: name,
		selector,
		layout: usedLayout,
		hasBlockGapSupport,
		globalBlockGapValue,
	} );
	const css = [ baseLayoutCSS, responsiveLayoutCSS ]
		.filter( Boolean )
		.join( '' );

	// Attach a `wp-container-` id-based class name as well as a layout class name such as `is-layout-flex`.
	const layoutClassNames = clsx(
		{
			[ `${ selectorPrefix }${ id }` ]: !! css, // Only attach a container class if there is generated CSS to be attached.
		},
		layoutClasses
	);

	useStyleOverride( { css } );

	return (
		<BlockListBlock
			{ ...props }
			__unstableLayoutClassNames={ layoutClassNames }
		/>
	);
}

/**
 * Override the default block element to add the layout styles.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withLayoutStyles = createHigherOrderComponent(
	( BlockListBlock ) =>
		function WithLayoutStyles( props ) {
			const { clientId, name, attributes } = props;
			const blockSupportsLayout = hasLayoutBlockSupport( name );
			const layoutClasses = useLayoutClasses( attributes, name );
			const extraProps = useSelect(
				( select ) => {
					// The callback returns early to avoid block editor subscription.
					if ( ! blockSupportsLayout ) {
						return;
					}

					const { getSettings, getBlockSettings } = unlock(
						select( blockEditorStore )
					);
					const settings = getSettings();
					const { disableLayoutStyles } = settings;

					if ( disableLayoutStyles ) {
						return;
					}

					const [ blockGapSupport ] = getBlockSettings(
						clientId,
						'spacing.blockGap'
					);

					// Get default blockGap value from global styles for use in layouts like grid.
					// Check style variation first, then block-specific styles, then fall back to root styles.
					const globalStyles = settings[ globalStylesDataKey ];

					// Check if the block has an active style variation with a blockGap value.
					// Only check the registry if the className contains a variation class to avoid unnecessary lookups.
					let variationBlockGapValue;
					const className = attributes?.className;
					if ( className?.includes( VARIATION_PREFIX ) ) {
						const { getBlockStyles } = select( blocksStore );
						const registeredStyles = getBlockStyles( name );
						const variationName = getVariationNameFromClass(
							className,
							registeredStyles
						);
						variationBlockGapValue = variationName
							? globalStyles?.blocks?.[ name ]?.variations?.[
									variationName
							  ]?.spacing?.blockGap
							: undefined;
					}

					const globalBlockGapValue =
						variationBlockGapValue ??
						globalStyles?.blocks?.[ name ]?.spacing?.blockGap ??
						globalStyles?.spacing?.blockGap;

					return { blockGapSupport, globalBlockGapValue };
				},
				[ blockSupportsLayout, clientId, attributes?.className, name ]
			);

			if ( ! extraProps ) {
				return (
					<BlockListBlock
						{ ...props }
						__unstableLayoutClassNames={
							blockSupportsLayout ? layoutClasses : undefined
						}
					/>
				);
			}

			return (
				<BlockWithLayoutStyles
					block={ BlockListBlock }
					props={ props }
					layoutClasses={ layoutClasses }
					{ ...extraProps }
				/>
			);
		},
	'withLayoutStyles'
);

addFilter(
	'blocks.registerBlockType',
	'core/layout/addAttribute',
	addAttribute
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/layout/with-layout-styles',
	withLayoutStyles
);
