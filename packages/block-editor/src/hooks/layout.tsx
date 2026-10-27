import clsx from 'clsx';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useCallback } from '@wordpress/element';
import {
	getBlockSupport,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { useSelect } from '@wordpress/data';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { kebabCase } from '@wordpress/kebab-case';
import type { ComponentType } from 'react';
import type { BlockType, BlockVariation } from '@wordpress/blocks';
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';
import { useSettings } from '../components/use-settings';
import { getLayoutType, getLayoutTypes } from '../layouts';
import { useBlockEditingMode } from '../components/block-editing-mode';
import { LAYOUT_DEFINITIONS } from '../layouts/definitions';
import { normalizeLegacyLayout } from '../layouts/utils';
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
import type {
	BlockListBlockHookProps,
	BlockWithLayoutStylesProps,
	ResetAllContext,
	ResetAllFilter,
	HasLayoutPanelControlsOptions,
	LayoutAttributes,
	LayoutPanelProps,
	LayoutTypeSwitcherProps,
	ResponsiveLayoutStylesOptions,
} from './types';
import type { Layout, LayoutBlockSupport } from '../layouts/types';

const VARIATION_PREFIX = 'is-style-';

const layoutBlockSupportKey = 'layout';
const CHILD_LAYOUT_KEYS = [
	'selfStretch',
	'flexSize',
	'columnStart',
	'columnSpan',
	'rowStart',
	'rowSpan',
];
const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

function getDefaultLayout(
	layoutBlockSupport: LayoutBlockSupport = {},
	blockVariation: Pick< BlockVariation, 'attributes' > | undefined
): Layout | undefined {
	const defaultBlockLayout = layoutBlockSupport?.default;

	return (
		// A variation sets the layout attribute.
		( blockVariation?.attributes?.layout as Layout | undefined ) ??
		defaultBlockLayout
	);
}

/**
 * Returns the layout values to use when resetting layout controls.
 *
 * @param layoutBlockSupport Block layout support settings.
 * @param blockVariation     Block variation settings.
 *
 * @return Reset layout values.
 */
export function getResetLayout(
	layoutBlockSupport: LayoutBlockSupport = {},
	blockVariation?: Pick< BlockVariation, 'attributes' >
): Layout | undefined {
	return cleanEmptyObject( {
		...getDefaultLayout( layoutBlockSupport, blockVariation ),
	} );
}

export function getLayoutStateOverrides(
	layout: Layout | undefined = {},
	baseLayout: Layout | undefined = {},
	existingLayout: Layout | undefined = {}
) {
	const overrides: Record< string, unknown > = {};
	const childLayoutValues = Object.fromEntries(
		CHILD_LAYOUT_KEYS.filter(
			( key ) => Object.hasOwn( existingLayout || {}, key )
			// Only keys of the existing layout are kept.
		).map( ( key ) => [ key, existingLayout![ key ] ] )
	);

	Object.entries( layout || {} ).forEach( ( [ key, value ] ) => {
		const baseHasValue = Object.hasOwn( baseLayout || {}, key );
		if (
			! CHILD_LAYOUT_KEYS.includes( key ) &&
			value !== baseLayout?.[ key ]
		) {
			overrides[ key ] =
				value === undefined && baseHasValue ? null : value;
		}
	} );

	return cleanEmptyObject( {
		...childLayoutValues,
		...overrides,
	} );
}

/**
 * Checks whether the layout panel has any controls to display.
 *
 * @param options                                 Options.
 * @param options.layoutType                      Active layout type.
 * @param options.constrainedType                 Constrained layout type.
 * @param options.layoutBlockSupport              Layout support settings.
 * @param options.showInheritToggle               Whether to show the inherit toggle.
 * @param options.showLayoutTypeSwitcher          Whether to show the layout type switcher.
 * @param options.displayControlsForLegacyLayouts Whether to show legacy layout controls.
 *
 * @return Whether the layout panel has controls.
 */
export function hasLayoutPanelControls( {
	layoutType,
	constrainedType,
	layoutBlockSupport,
	showInheritToggle,
	showLayoutTypeSwitcher,
	displayControlsForLegacyLayouts,
}: HasLayoutPanelControlsOptions ): boolean {
	const hasActiveLayoutControls =
		layoutType?.name !== 'default' &&
		layoutType?.hasInspectorControls( layoutBlockSupport );
	const hasLegacyLayoutControls =
		displayControlsForLegacyLayouts &&
		constrainedType?.hasInspectorControls( layoutBlockSupport );

	return !! (
		showInheritToggle ||
		showLayoutTypeSwitcher ||
		hasActiveLayoutControls ||
		hasLegacyLayoutControls
	);
}

function getLayoutContainerValues( layout: Layout | undefined = {} ): Layout {
	return Object.fromEntries(
		Object.entries( layout || {} ).filter(
			( [ key ] ) => ! CHILD_LAYOUT_KEYS.includes( key )
		)
	);
}

function hasLayoutBlockSupport( blockName: string | BlockType ) {
	return (
		hasBlockSupport( blockName, 'layout' ) ||
		hasBlockSupport( blockName, '__experimentalLayout' )
	);
}

/**
 * Generates the utility classnames for the given block's layout attributes.
 *
 * @param blockAttributes Block attributes.
 * @param blockName       Block name.
 *
 * @return Array of CSS classname strings.
 */
export function useLayoutClasses(
	blockAttributes: LayoutAttributes = {},
	blockName: string = ''
): string[] {
	const { layout } = blockAttributes;
	const { default: defaultBlockLayout } =
		// The layout support is an object.
		( getBlockSupport( blockName, layoutBlockSupportKey ) as
			{ default?: Layout } | undefined ) || {};
	const usedLayout =
		normalizeLegacyLayout( layout ) || defaultBlockLayout || {};

	const layoutClassnames: string[] = [];

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
 * @param blockAttributes Block attributes.
 * @param blockName       Block name.
 * @param selector        A selector to use in generating the CSS rule.
 *
 * @return CSS rule.
 */
export function useLayoutStyles(
	blockAttributes: LayoutAttributes = {},
	blockName: string,
	selector: string
): string | undefined {
	const { layout = {}, style = {} } = blockAttributes;
	const usedLayout = normalizeLegacyLayout( layout ) || {};
	const fullLayoutType = getLayoutType( usedLayout?.type || 'default' );
	const [ blockGapSupport ] = useSettings( 'spacing.blockGap' );
	// Like the server's `isset()` check, an unset or `null` setting means the
	// theme has not opted into block gap.
	const hasBlockGapSupport =
		blockGapSupport !== null && blockGapSupport !== undefined;
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
 * @param options                     Options.
 * @param options.attributes          Block attributes.
 * @param options.blockName           Block name.
 * @param options.selector            CSS selector.
 * @param options.layout              Active block layout.
 * @param options.hasBlockGapSupport  Whether block gap is supported.
 * @param options.globalBlockGapValue Global block gap fallback.
 * @param options.viewportSettings    Viewport breakpoint settings.
 *
 * @return CSS rule.
 */
export function getResponsiveLayoutStyles( {
	attributes = {},
	blockName,
	selector,
	layout = {},
	hasBlockGapSupport,
	globalBlockGapValue,
	viewportSettings,
}: ResponsiveLayoutStylesOptions ): string {
	return Object.entries( getResponsiveMediaQueries( viewportSettings ) )
		.map( ( [ viewport, mediaQuery ] ) => {
			const viewportStyle = getStyleForState( attributes?.style, {
				viewport,
				pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
			} );
			const viewportLayout = getLayoutContainerValues(
				// A style state holds the layout it overrides.
				viewportStyle?.layout as Layout | undefined
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
}: LayoutPanelProps ) {
	const settings = useBlockSettings( blockName );
	// Block settings come from theme.json under settings.[blockName].
	const { layout: layoutSettings } = settings;
	const {
		themeSupportsLayout,
		activeBlockVariation,
		selectedState,
		isResponsiveEditing,
	} = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getSettings,
				getSelectedBlockStyleState,
				isResponsiveEditing: getIsResponsiveEditing,
			} = unlock( select( blockEditorStore ) );
			return {
				activeBlockVariation: select(
					blocksStore
				).getActiveBlockVariation(
					blockName,
					getBlockAttributes( clientId ) || {},
					'block'
				),
				themeSupportsLayout: getSettings().supportsLayout,
				selectedState: getSelectedBlockStyleState( clientId ),
				isResponsiveEditing: getIsResponsiveEditing(),
			};
		},
		[ blockName, clientId ]
	);

	const blockEditingMode = useBlockEditingMode();
	const isViewportLayoutState =
		hasViewportBlockStyleState( selectedState ) &&
		! hasPseudoBlockStyleState( selectedState );
	const resetLayoutFilter = useCallback(
		( ...resetArgs: Parameters< ResetAllFilter > ) => {
			const attributes = resetArgs[ 0 ] || {};
			const context: Partial< ResetAllContext > = resetArgs[ 1 ] || {};

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
			// The layout support is an object.
			const resetLayoutBlockSupport = getBlockSupport(
				resetBlockName,
				layoutBlockSupportKey,
				{}
			) as LayoutBlockSupport;

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
	// The layout support is an object.
	const layoutBlockSupport = getBlockSupport(
		blockName,
		layoutBlockSupportKey,
		{}
	) as LayoutBlockSupport;
	const blockSupportAndThemeSettings: LayoutBlockSupport = {
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
	const baseLayout: Layout = layout || defaultBlockLayout || {};
	const stateStyle = isViewportLayoutState
		? getStyleForState( style, selectedState )
		: undefined;
	// A style state holds the layout it overrides.
	const stateLayout = stateStyle?.layout as Layout | undefined;
	const usedLayout: Layout = isViewportLayoutState
		? cleanEmptyObject( {
				...baseLayout,
				...stateLayout,
			} ) || {}
		: baseLayout;
	const resetLayoutDefaults = isViewportLayoutState
		? baseLayout
		: getResetLayout( layoutBlockSupport, activeBlockVariation );
	const blockSupportAndLayout: LayoutBlockSupport & Layout = {
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
	const showLayoutPanel = hasLayoutPanelControls( {
		layoutType,
		constrainedType,
		layoutBlockSupport: blockSupportAndThemeSettings,
		showInheritToggle,
		showLayoutTypeSwitcher,
		displayControlsForLegacyLayouts,
	} );

	const onChangeLayout = ( newLayout: Layout | undefined ) => {
		if ( isViewportLayoutState ) {
			const nextStateStyle = cleanEmptyObject( {
				...stateStyle,
				layout: getLayoutStateOverrides(
					newLayout,
					baseLayout,
					// A style state holds the layout it overrides.
					stateStyle?.layout as Layout | undefined
				),
			} );
			setAttributes( {
				style: setStyleForState( style, selectedState, nextStateStyle ),
			} );
			return;
		}

		setAttributes( { layout: cleanEmptyObject( newLayout ) } );
	};
	const onChangeType = ( newType: string ) =>
		onChangeLayout( { type: newType } );
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
			{ showLayoutPanel && (
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
			) }
			{ ! inherit && layoutType && (
				<layoutType.toolBarControls
					layout={ usedLayout }
					onChange={ onChangeLayout }
					layoutBlockSupport={ layoutBlockSupport }
					controlsGroup={
						isResponsiveEditing &&
						hasViewportBlockStyleState( selectedState ) &&
						! hasPseudoBlockStyleState( selectedState )
							? 'style-state'
							: 'block'
					}
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
	hasSupport( name: string | BlockType ) {
		return hasLayoutBlockSupport( name );
	},
};

function LayoutTypeSwitcher( { type, onChange }: LayoutTypeSwitcherProps ) {
	return (
		<ToggleGroupControl
			isBlock
			label={ __( 'Layout type' ) }
			hideLabelFromVision
			isAdaptiveWidth
			value={ type }
			// The options have string values.
			onChange={
				onChange as ( value: string | number | undefined ) => void
			}
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
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
export function addAttribute( settings: BlockType ): BlockType {
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
	viewportSettings,
	layoutClasses,
}: BlockWithLayoutStylesProps ) {
	const { name, attributes } = props;
	const id = useInstanceId( BlockListBlock );
	const { layout } = attributes;
	const { default: defaultBlockLayout } =
		// The layout support is an object.
		( getBlockSupport( name, layoutBlockSupportKey ) as
			{ default?: Layout } | undefined ) || {};
	const usedLayout =
		normalizeLegacyLayout( layout ) || defaultBlockLayout || {};

	const selectorPrefix = `wp-container-${ kebabCase( name ) }-is-layout-`;
	// Higher specificity to override defaults from theme.json.
	const selector = `.${ selectorPrefix }${ id }`;
	// Like the server's `isset()` check, an unset or `null` setting means the
	// theme has not opted into block gap.
	const hasBlockGapSupport =
		blockGapSupport !== null && blockGapSupport !== undefined;

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
		viewportSettings,
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
	(
		BlockListBlock: ComponentType<
			BlockListBlockHookProps & Record< string, unknown >
		>
	) =>
		function WithLayoutStyles(
			props: BlockListBlockHookProps & { attributes: LayoutAttributes }
		) {
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

					return {
						blockGapSupport,
						globalBlockGapValue,
						viewportSettings:
							settings?.__experimentalFeatures?.viewport,
					};
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
