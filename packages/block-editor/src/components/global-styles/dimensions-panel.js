/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	BoxControl,
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { Icon, alignNone, stretchWide } from '@wordpress/icons';
import { useCallback, useState } from '@wordpress/element';
import { getValueFromVariable } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from './utils';
import SpacingSizesControl from '../spacing-sizes-control';
import DimensionControl from '../dimension-control';
import ChildLayoutControl from '../child-layout-control';
import AspectRatioTool from '../dimensions-tool/aspect-ratio-tool';
import { cleanEmptyObject } from '../../hooks/utils';
import { setImmutably } from '../../utils/object';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
} from '../../hooks/block-style-state';
import {
	getCommonInheritanceTooltipText,
	getInheritanceProps,
	getInheritanceTooltipTextByPath,
	InheritanceToolsPanelItem,
} from './inheritance';
import { useStylePushHandlers } from './inherited-value-context';

const AXIAL_SIDES = [ 'horizontal', 'vertical' ];

export function useHasDimensionsPanel(
	settings,
	styleState = DEFAULT_BLOCK_STYLE_STATE
) {
	return (
		hasContentSize( settings ) ||
		hasWideSize( settings ) ||
		hasPadding( settings ) ||
		hasMargin( settings ) ||
		hasGap( settings ) ||
		hasHeight( settings ) ||
		hasMinHeight( settings ) ||
		hasMinWidth( settings ) ||
		hasWidth( settings ) ||
		hasAspectRatio( settings, styleState ) ||
		hasChildLayout( settings, styleState )
	);
}

function hasContentSize( settings ) {
	return settings?.layout?.contentSize;
}

function hasWideSize( settings ) {
	return settings?.layout?.wideSize;
}

function hasPadding( settings ) {
	return settings?.spacing?.padding;
}

function hasMargin( settings ) {
	return settings?.spacing?.margin;
}

function hasGap( settings ) {
	return settings?.spacing?.blockGap;
}

function hasHeight( settings ) {
	return settings?.dimensions?.height;
}

function hasMinHeight( settings ) {
	return settings?.dimensions?.minHeight;
}

function hasMinWidth( settings ) {
	return settings?.dimensions?.minWidth;
}

function hasWidth( settings ) {
	return settings?.dimensions?.width;
}

function hasAspectRatio( settings, styleState = DEFAULT_BLOCK_STYLE_STATE ) {
	return (
		! hasPseudoBlockStyleState( styleState ) &&
		settings?.dimensions?.aspectRatio
	);
}

function hasChildLayout( settings, styleState = DEFAULT_BLOCK_STYLE_STATE ) {
	if ( hasPseudoBlockStyleState( styleState ) ) {
		return false;
	}

	const {
		type: parentLayoutType = 'default',
		default: { type: defaultParentLayoutType = 'default' } = {},
		allowSizingOnChildren = false,
	} = settings?.parentLayout ?? {};

	const support =
		( defaultParentLayoutType === 'flex' ||
			parentLayoutType === 'flex' ||
			defaultParentLayoutType === 'grid' ||
			parentLayoutType === 'grid' ) &&
		allowSizingOnChildren;
	return !! settings?.layout && support;
}

function hasSpacingPresets( settings ) {
	const { defaultSpacingSizes, spacingSizes } = settings?.spacing || {};
	return (
		( defaultSpacingSizes !== false &&
			spacingSizes?.default?.length > 0 ) ||
		spacingSizes?.theme?.length > 0 ||
		spacingSizes?.custom?.length > 0
	);
}

function filterValuesBySides( values, sides ) {
	// If no custom side configuration, all sides are opted into by default.
	// Without any values, we have nothing to filter either.
	if ( ! sides || ! values ) {
		return values;
	}

	// Only include sides opted into within filtered values.
	const filteredValues = {};
	sides.forEach( ( side ) => {
		if ( side === 'vertical' ) {
			filteredValues.top = values.top;
			filteredValues.bottom = values.bottom;
		}
		if ( side === 'horizontal' ) {
			filteredValues.left = values.left;
			filteredValues.right = values.right;
		}
		filteredValues[ side ] = values?.[ side ];
	} );

	return filteredValues;
}

const EMPTY_VALUES = [ undefined, null, '' ];

function hasValue( value ) {
	return ! EMPTY_VALUES.includes( value );
}

/**
 * Layers whose contributions should not bubble up into block-level
 * spacing/dimensions controls. Root-level `spacing.padding`, `spacing.margin`,
 * and `spacing.blockGap` apply to the post content wrapper or root selector
 * only — they are not CSS-inherited cascade properties, so descendant block
 * panels should not surface them as "inherited" placeholders.
 */
const NON_CASCADING_ROOT_LAYERS = new Set( [ 'root', 'rootElement' ] );

function isRootSourced( sources, pathKey ) {
	return NON_CASCADING_ROOT_LAYERS.has( sources?.[ pathKey ]?.layer );
}

/**
 * Drops sides from a sides-shaped (or shorthand) inherited value when the
 * winning source for that side is the root layer. Returns `undefined` when
 * nothing remains. Leaves block- and variation-sourced values intact.
 *
 * @param {Object|string|undefined} value    Inherited value at `basePath`.
 * @param {Object}                  sources  Source map keyed by dot-path.
 * @param {string}                  basePath Dot-path of `value` (e.g. `spacing.padding`).
 * @return {Object|string|undefined} Filtered value, or `undefined` if all sides were root-sourced.
 */
function dropRootSourcedSides( value, sources, basePath ) {
	if ( ! hasValue( value ) ) {
		return value;
	}
	if ( typeof value === 'string' ) {
		return isRootSourced( sources, basePath ) ? undefined : value;
	}
	if ( typeof value !== 'object' ) {
		return value;
	}
	const filtered = {};
	let kept = false;
	for ( const sideKey of Object.keys( value ) ) {
		if ( ! isRootSourced( sources, `${ basePath }.${ sideKey }` ) ) {
			filtered[ sideKey ] = value[ sideKey ];
			kept = true;
		}
	}
	return kept ? filtered : undefined;
}

function splitStyleValue( value ) {
	// Check for shorthand value (a string value).
	if ( hasValue( value ) && typeof value === 'string' ) {
		// Convert to value for individual sides for BoxControl.
		return {
			top: value,
			right: value,
			bottom: value,
			left: value,
		};
	}

	return value;
}

/**
 * Returns the common side value of a sides object (top/right/bottom/left)
 * when all four sides are defined and equal; otherwise returns undefined.
 *
 * Used to derive a placeholder string for BoxControl's
 * `inputProps.placeholder` from an inherited shorthand or
 * shorthand-equivalent split-side value. When the inherited sides differ
 * from each other, the placeholder is suppressed because BoxControl's
 * `inputProps.placeholder` cannot vary per side.
 *
 * @param {Object|string|undefined} sidesValue The inherited sides shape.
 * @return {string|undefined} The common value, or undefined.
 */
function getCommonSidesValue( sidesValue ) {
	if ( ! hasValue( sidesValue ) ) {
		return undefined;
	}
	if ( typeof sidesValue === 'string' ) {
		return sidesValue !== '' ? sidesValue : undefined;
	}
	if ( typeof sidesValue !== 'object' ) {
		return undefined;
	}
	const sideKeys = [ 'top', 'right', 'bottom', 'left' ];
	const values = sideKeys.map( ( k ) => sidesValue[ k ] );
	const allDefined = values.every( hasValue );
	if ( ! allDefined ) {
		return undefined;
	}
	const first = values[ 0 ];
	return values.every( ( v ) => v === first ) ? first : undefined;
}

function splitGapValue( value, isAxialGap ) {
	if ( ! hasValue( value ) ) {
		return value;
	}

	// Check for shorthand value (a string value).
	if ( typeof value === 'string' ) {
		/*
		 * Map the string value to appropriate sides for the spacing control depending
		 * on whether the current block has axial gap support or not.
		 *
		 * Note: The axial value pairs must match for the spacing control to display
		 * the appropriate horizontal/vertical sliders.
		 */
		return isAxialGap
			? { top: value, right: value, bottom: value, left: value }
			: { top: value };
	}

	return {
		...value,
		right: value?.left,
		bottom: value?.top,
	};
}

function DimensionsToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Dimensions' ) }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	contentSize: true,
	wideSize: true,
	padding: true,
	margin: true,
	blockGap: true,
	height: true,
	minHeight: true,
	minWidth: true,
	width: true,
	aspectRatio: true,
	childLayout: true,
};

export default function DimensionsPanel( {
	as: Wrapper = DimensionsToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	inheritedSources = {},
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	onVisualize = () => {},
	// Special case because the layout controls are not part of the dimensions panel
	// in global styles but not in block inspector.
	includeLayoutControls = false,
	styleState = DEFAULT_BLOCK_STYLE_STATE,
	showInheritanceLabelIndicators = true,
} ) {
	const { dimensions, spacing } = settings;

	const decodeValue = ( rawValue ) => {
		if ( rawValue && typeof rawValue === 'object' ) {
			return Object.keys( rawValue ).reduce( ( acc, key ) => {
				acc[ key ] = getValueFromVariable(
					{ settings: { dimensions, spacing } },
					'',
					rawValue[ key ]
				);
				return acc;
			}, {} );
		}
		return getValueFromVariable(
			{ settings: { dimensions, spacing } },
			'',
			rawValue
		);
	};
	const inheritanceProps = ( isInherited, hasLocalOverride, className ) =>
		showInheritanceLabelIndicators
			? getInheritanceProps( isInherited, hasLocalOverride, className )
			: {};
	const tooltipText = ( path ) =>
		getInheritanceTooltipTextByPath( inheritedSources, path );
	const commonTooltipText = ( paths ) =>
		getCommonInheritanceTooltipText( inheritedSources, paths );
	const getPushHandler = useStylePushHandlers( value );

	const showSpacingPresetsControl = hasSpacingPresets( settings );
	const units = useCustomUnits( {
		availableUnits: settings?.spacing?.units || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

	//Minimum Margin Value
	const minimumMargin = -Infinity;
	const [ minMarginValue, setMinMarginValue ] = useState( minimumMargin );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			layout: cleanEmptyObject( {
				...previousValue?.layout,
				contentSize: undefined,
				wideSize: undefined,
				selfStretch: undefined,
				flexSize: undefined,
				columnStart: undefined,
				rowStart: undefined,
				columnSpan: undefined,
				rowSpan: undefined,
			} ),
			spacing: {
				...previousValue?.spacing,
				padding: undefined,
				margin: undefined,
				blockGap: undefined,
			},
			dimensions: {
				...previousValue?.dimensions,
				height: undefined,
				minHeight: undefined,
				minWidth: undefined,
				aspectRatio: undefined,
				width: undefined,
			},
		};
	}, [] );

	// Content Width
	const showContentSizeControl =
		hasContentSize( settings ) && includeLayoutControls;
	const localContentSizeValue = decodeValue( value?.layout?.contentSize );
	const inheritedContentSizeValue = decodeValue(
		inheritedValue?.layout?.contentSize
	);
	const isContentSizePlaceholder =
		! hasValue( value?.layout?.contentSize ) &&
		hasValue( inheritedContentSizeValue );
	const setContentSizeValue = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'layout', 'contentSize' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	const hasUserSetContentSizeValue = () =>
		hasValue( value?.layout?.contentSize );
	const resetContentSizeValue = () => setContentSizeValue( undefined );

	// Wide Width
	const showWideSizeControl =
		hasWideSize( settings ) && includeLayoutControls;
	const localWideSizeValue = decodeValue( value?.layout?.wideSize );
	const inheritedWideSizeValue = decodeValue(
		inheritedValue?.layout?.wideSize
	);
	const isWideSizePlaceholder =
		! hasValue( value?.layout?.wideSize ) &&
		hasValue( inheritedWideSizeValue );
	const setWideSizeValue = ( newValue ) => {
		onChange(
			setImmutably(
				value,
				[ 'layout', 'wideSize' ],
				hasValue( newValue ) ? newValue : undefined
			)
		);
	};
	const hasUserSetWideSizeValue = () => hasValue( value?.layout?.wideSize );
	const resetWideSizeValue = () => setWideSizeValue( undefined );

	// Padding
	const showPaddingControl = hasPadding( settings );
	const inheritedPaddingValues = splitStyleValue(
		decodeValue(
			dropRootSourcedSides(
				inheritedValue?.spacing?.padding,
				inheritedSources,
				'spacing.padding'
			)
		)
	);
	// Local-only values feed BoxControl's `values` (with the inherited
	// surfaced via the at-rest placeholder).
	const localPaddingValues = splitStyleValue(
		decodeValue( value?.spacing?.padding )
	);
	// Merged local-then-inherited values feed SpacingSizesControl's
	// `values` because the preset slider has no placeholder slot — the
	// active chip itself is the at-rest cue.
	const paddingValues = hasValue( value?.spacing?.padding )
		? localPaddingValues
		: inheritedPaddingValues;
	const inheritedPaddingPlaceholder = getCommonSidesValue(
		inheritedPaddingValues
	);
	const isPaddingPlaceholder =
		! hasValue( value?.spacing?.padding ) &&
		inheritedPaddingPlaceholder !== undefined;
	const paddingSides = Array.isArray( settings?.spacing?.padding )
		? settings?.spacing?.padding
		: settings?.spacing?.padding?.sides;
	const isAxialPadding =
		paddingSides &&
		paddingSides.some( ( side ) => AXIAL_SIDES.includes( side ) );
	const setPaddingValues = ( newPaddingValues ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		onChange( setImmutably( value, [ 'spacing', 'padding' ], padding ) );
	};
	const hasPaddingValue = () =>
		hasValue( value?.spacing?.padding ) &&
		Object.keys( value?.spacing?.padding ).length;
	const resetPaddingValue = () => setPaddingValues( undefined );
	const paddingTooltipText = commonTooltipText( [
		'spacing.padding.top',
		'spacing.padding.right',
		'spacing.padding.bottom',
		'spacing.padding.left',
	] );
	const onMouseOverPadding = () => onVisualize( 'padding' );

	// Margin
	const showMarginControl = hasMargin( settings );
	const inheritedMarginValues = splitStyleValue(
		decodeValue(
			dropRootSourcedSides(
				inheritedValue?.spacing?.margin,
				inheritedSources,
				'spacing.margin'
			)
		)
	);
	const localMarginValues = splitStyleValue(
		decodeValue( value?.spacing?.margin )
	);
	const marginValues = hasValue( value?.spacing?.margin )
		? localMarginValues
		: inheritedMarginValues;
	const inheritedMarginPlaceholder = getCommonSidesValue(
		inheritedMarginValues
	);
	const isMarginPlaceholder =
		! hasValue( value?.spacing?.margin ) &&
		inheritedMarginPlaceholder !== undefined;
	const marginSides = Array.isArray( settings?.spacing?.margin )
		? settings?.spacing?.margin
		: settings?.spacing?.margin?.sides;
	const isAxialMargin =
		marginSides &&
		marginSides.some( ( side ) => AXIAL_SIDES.includes( side ) );
	const setMarginValues = ( newMarginValues ) => {
		const margin = filterValuesBySides( newMarginValues, marginSides );
		onChange( setImmutably( value, [ 'spacing', 'margin' ], margin ) );
	};
	const hasMarginValue = () =>
		hasValue( value?.spacing?.margin ) &&
		Object.keys( value?.spacing?.margin ).length;
	const resetMarginValue = () => setMarginValues( undefined );
	const marginTooltipText = commonTooltipText( [
		'spacing.margin.top',
		'spacing.margin.right',
		'spacing.margin.bottom',
		'spacing.margin.left',
	] );
	const onMouseOverMargin = () => onVisualize( 'margin' );

	// Block Gap
	const showGapControl = hasGap( settings );
	const gapSides = Array.isArray( settings?.spacing?.blockGap )
		? settings?.spacing?.blockGap
		: settings?.spacing?.blockGap?.sides;
	const isAxialGap =
		gapSides && gapSides.some( ( side ) => AXIAL_SIDES.includes( side ) );
	const localGapRaw = decodeValue( value?.spacing?.blockGap );
	const inheritedGapRaw = isRootSourced(
		inheritedSources,
		'spacing.blockGap'
	)
		? undefined
		: decodeValue( inheritedValue?.spacing?.blockGap );
	// Merge local-then-inherited so SpacingSizesControl's chip slider and
	// the axial-gap BoxControl reflect the local value when set and fall
	// back to the inherited value at rest.
	const gapRawForDisplay = hasValue( value?.spacing?.blockGap )
		? localGapRaw
		: inheritedGapRaw;
	const gapValues = splitGapValue( gapRawForDisplay, isAxialGap );
	// Placeholder state for the single-input (non-axial, non-preset) blockGap
	// path. The axial / preset paths render compound or chip controls without
	// a native placeholder slot — the displayed `values` themselves are the
	// at-rest cue for those.
	const isGapPlaceholder =
		! hasValue( value?.spacing?.blockGap ) &&
		typeof inheritedGapRaw === 'string' &&
		inheritedGapRaw !== '';
	const setGapValue = ( newGapValue ) => {
		onChange(
			setImmutably( value, [ 'spacing', 'blockGap' ], newGapValue )
		);
	};
	const setGapValues = ( nextBoxGapValue ) => {
		if ( ! hasValue( nextBoxGapValue ) ) {
			setGapValue( null );
		}
		// If axial gap is not enabled, treat the 'top' value as the shorthand gap value.
		if ( ! isAxialGap && nextBoxGapValue?.hasOwnProperty( 'top' ) ) {
			setGapValue( nextBoxGapValue.top );
		} else {
			setGapValue( {
				top: nextBoxGapValue?.top,
				left: nextBoxGapValue?.left,
			} );
		}
	};
	const resetGapValue = () => setGapValue( undefined );
	const hasGapValue = () => hasValue( value?.spacing?.blockGap );
	const gapTooltipText = commonTooltipText( [
		'spacing.blockGap',
		'spacing.blockGap.top',
		'spacing.blockGap.left',
	] );

	// Min Height
	const showMinHeightControl = hasMinHeight( settings );
	const localMinHeightValue = decodeValue( value?.dimensions?.minHeight );
	const inheritedMinHeightValue = decodeValue(
		inheritedValue?.dimensions?.minHeight
	);
	const isMinHeightPlaceholder =
		! hasValue( value?.dimensions?.minHeight ) &&
		hasValue( inheritedMinHeightValue );
	const setMinHeightValue = ( newValue ) => {
		const tempValue = setImmutably(
			value,
			[ 'dimensions', 'minHeight' ],
			newValue
		);
		// Apply min-height, while removing any applied aspect ratio.
		onChange(
			setImmutably(
				tempValue,
				[ 'dimensions', 'aspectRatio' ],
				undefined
			)
		);
	};
	const resetMinHeightValue = () => {
		setMinHeightValue( undefined );
	};
	const hasMinHeightValue = () => hasValue( value?.dimensions?.minHeight );

	// Height
	const showHeightControl = hasHeight( settings );
	const localHeightValue = decodeValue( value?.dimensions?.height );
	const inheritedHeightValue = decodeValue(
		inheritedValue?.dimensions?.height
	);
	const isHeightPlaceholder =
		! hasValue( value?.dimensions?.height ) &&
		hasValue( inheritedHeightValue );
	const setHeightValue = ( newValue ) => {
		const tempValue = setImmutably(
			value,
			[ 'dimensions', 'height' ],
			newValue
		);
		// Apply height, while removing any applied aspect ratio.
		onChange(
			setImmutably(
				tempValue,
				[ 'dimensions', 'aspectRatio' ],
				undefined
			)
		);
	};
	const resetHeightValue = () => {
		setHeightValue( undefined );
	};
	const hasHeightValue = () => hasValue( value?.dimensions?.height );

	// Min Width
	const showMinWidthControl = hasMinWidth( settings );
	const localMinWidthValue = decodeValue( value?.dimensions?.minWidth );
	const inheritedMinWidthValue = decodeValue(
		inheritedValue?.dimensions?.minWidth
	);
	const isMinWidthPlaceholder =
		! hasValue( value?.dimensions?.minWidth ) &&
		hasValue( inheritedMinWidthValue );
	const setMinWidthValue = ( newValue ) => {
		onChange(
			setImmutably( value, [ 'dimensions', 'minWidth' ], newValue )
		);
	};
	const resetMinWidthValue = () => {
		setMinWidthValue( undefined );
	};
	const hasMinWidthValue = () => hasValue( value?.dimensions?.minWidth );

	// Width
	const showWidthControl = hasWidth( settings );
	const localWidthValue = decodeValue( value?.dimensions?.width );
	const inheritedWidthValue = decodeValue(
		inheritedValue?.dimensions?.width
	);
	const isWidthPlaceholder =
		! hasValue( value?.dimensions?.width ) &&
		hasValue( inheritedWidthValue );
	const setWidthValue = ( newValue ) => {
		onChange( setImmutably( value, [ 'dimensions', 'width' ], newValue ) );
	};
	const resetWidthValue = () => {
		setWidthValue( undefined );
	};
	const hasWidthValue = () => hasValue( value?.dimensions?.width );

	// Aspect Ratio
	const showAspectRatioControl = hasAspectRatio( settings, styleState );
	const localAspectRatioValue = decodeValue( value?.dimensions?.aspectRatio );
	const inheritedAspectRatioValue = decodeValue(
		inheritedValue?.dimensions?.aspectRatio
	);
	const aspectRatioValue = localAspectRatioValue ?? inheritedAspectRatioValue;
	const isAspectRatioPlaceholder =
		! hasValue( value?.dimensions?.aspectRatio ) &&
		hasValue( inheritedAspectRatioValue );
	const setAspectRatioValue = ( newValue ) => {
		const tempValue = setImmutably(
			value,
			[ 'dimensions', 'aspectRatio' ],
			newValue
		);
		// Apply aspect-ratio, while removing any applied min-height.
		onChange(
			setImmutably( tempValue, [ 'dimensions', 'minHeight' ], undefined )
		);
	};
	const hasAspectRatioValue = () =>
		hasValue( value?.dimensions?.aspectRatio );

	// Child Layout. There is no Global Styles inheritance model for the
	// child-layout sub-keys (`selfStretch`, `flexSize`, `columnStart`,
	// `rowStart`, `columnSpan`, `rowSpan`); they are per-block attributes
	// only. Render the local value directly so user-set overrides are
	// reflected in the control rather than washed out by a misshapen
	// inherited layout payload.
	const showChildLayoutControl = hasChildLayout( settings, styleState );
	const childLayout = value?.layout;

	const setChildLayout = ( newChildLayout ) => {
		onChange( {
			...value,
			layout: {
				...value?.layout,
				...newChildLayout,
			},
		} );
	};

	const onMouseLeaveControls = () => onVisualize( false );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ ( showContentSizeControl || showWideSizeControl ) && (
				<span className="span-columns">
					{ __( 'Set the width of the main content area.' ) }
				</span>
			) }
			{ showContentSizeControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isContentSizePlaceholder,
						hasUserSetContentSizeValue() &&
							inheritedContentSizeValue !== undefined
					) }
					label={ __( 'Content width' ) }
					hasValue={ hasUserSetContentSizeValue }
					onDeselect={ resetContentSizeValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'layout', 'contentSize' ] ],
						resetContentSizeValue
					) }
					isShownByDefault={
						defaultControls.contentSize ??
						DEFAULT_CONTROLS.contentSize
					}
					panelId={ panelId }
					inheritanceTooltipText={ tooltipText(
						'layout.contentSize'
					) }
				>
					<UnitControl
						__next40pxDefaultSize
						label={ __( 'Content width' ) }
						labelPosition="top"
						value={ localContentSizeValue ?? '' }
						placeholder={
							isContentSizePlaceholder
								? inheritedContentSizeValue
								: undefined
						}
						onChange={ ( nextContentSize ) => {
							setContentSizeValue( nextContentSize );
						} }
						units={ units }
						prefix={
							<InputControlPrefixWrapper variant="icon">
								<Icon icon={ alignNone } />
							</InputControlPrefixWrapper>
						}
					/>
				</InheritanceToolsPanelItem>
			) }
			{ showWideSizeControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isWideSizePlaceholder,
						hasUserSetWideSizeValue() &&
							inheritedWideSizeValue !== undefined
					) }
					label={ __( 'Wide width' ) }
					hasValue={ hasUserSetWideSizeValue }
					onDeselect={ resetWideSizeValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'layout', 'wideSize' ] ],
						resetWideSizeValue
					) }
					isShownByDefault={
						defaultControls.wideSize ?? DEFAULT_CONTROLS.wideSize
					}
					panelId={ panelId }
					inheritanceTooltipText={ tooltipText( 'layout.wideSize' ) }
				>
					<UnitControl
						__next40pxDefaultSize
						label={ __( 'Wide width' ) }
						labelPosition="top"
						value={ localWideSizeValue ?? '' }
						placeholder={
							isWideSizePlaceholder
								? inheritedWideSizeValue
								: undefined
						}
						onChange={ ( nextWideSize ) => {
							setWideSizeValue( nextWideSize );
						} }
						units={ units }
						prefix={
							<InputControlPrefixWrapper variant="icon">
								<Icon icon={ stretchWide } />
							</InputControlPrefixWrapper>
						}
					/>
				</InheritanceToolsPanelItem>
			) }
			{ showPaddingControl && (
				<InheritanceToolsPanelItem
					hasValue={ hasPaddingValue }
					label={ __( 'Padding' ) }
					onDeselect={ resetPaddingValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'spacing', 'padding' ] ],
						resetPaddingValue
					) }
					isShownByDefault={
						defaultControls.padding ?? DEFAULT_CONTROLS.padding
					}
					{ ...inheritanceProps(
						isPaddingPlaceholder,
						hasPaddingValue() &&
							inheritedPaddingPlaceholder !== undefined,
						{
							'tools-panel-item-spacing':
								showSpacingPresetsControl,
						}
					) }
					panelId={ panelId }
					inheritanceTooltipText={ paddingTooltipText }
				>
					{ ! showSpacingPresetsControl && (
						<BoxControl
							values={ localPaddingValues }
							onChange={ setPaddingValues }
							label={ __( 'Padding' ) }
							sides={ paddingSides }
							units={ units }
							allowReset={ false }
							splitOnAxis={ isAxialPadding }
							inputProps={ {
								onMouseOver: onMouseOverPadding,
								onMouseOut: onMouseLeaveControls,
								placeholder: isPaddingPlaceholder
									? inheritedPaddingPlaceholder
									: undefined,
							} }
						/>
					) }
					{ showSpacingPresetsControl && (
						<SpacingSizesControl
							values={ paddingValues }
							onChange={ setPaddingValues }
							label={ __( 'Padding' ) }
							sides={ paddingSides }
							units={ units }
							allowReset={ false }
							onMouseOver={ onMouseOverPadding }
							onMouseOut={ onMouseLeaveControls }
						/>
					) }
				</InheritanceToolsPanelItem>
			) }
			{ showMarginControl && (
				<InheritanceToolsPanelItem
					hasValue={ hasMarginValue }
					label={ __( 'Margin' ) }
					onDeselect={ resetMarginValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'spacing', 'margin' ] ],
						resetMarginValue
					) }
					isShownByDefault={
						defaultControls.margin ?? DEFAULT_CONTROLS.margin
					}
					{ ...inheritanceProps(
						isMarginPlaceholder,
						hasMarginValue() &&
							inheritedMarginPlaceholder !== undefined,
						{
							'tools-panel-item-spacing':
								showSpacingPresetsControl,
						}
					) }
					panelId={ panelId }
					inheritanceTooltipText={ marginTooltipText }
				>
					{ ! showSpacingPresetsControl && (
						<BoxControl
							values={ localMarginValues }
							onChange={ setMarginValues }
							inputProps={ {
								min: minMarginValue,
								onDragStart: () => {
									// Reset to 0 in case the value was negative.
									setMinMarginValue( 0 );
								},
								onDragEnd: () => {
									setMinMarginValue( minimumMargin );
								},
								onMouseOver: onMouseOverMargin,
								onMouseOut: onMouseLeaveControls,
								placeholder: isMarginPlaceholder
									? inheritedMarginPlaceholder
									: undefined,
							} }
							label={ __( 'Margin' ) }
							sides={ marginSides }
							units={ units }
							allowReset={ false }
							splitOnAxis={ isAxialMargin }
						/>
					) }
					{ showSpacingPresetsControl && (
						<SpacingSizesControl
							values={ marginValues }
							onChange={ setMarginValues }
							minimumCustomValue={ -Infinity }
							label={ __( 'Margin' ) }
							sides={ marginSides }
							units={ units }
							allowReset={ false }
							onMouseOver={ onMouseOverMargin }
							onMouseOut={ onMouseLeaveControls }
						/>
					) }
				</InheritanceToolsPanelItem>
			) }
			{ showGapControl && (
				<InheritanceToolsPanelItem
					hasValue={ hasGapValue }
					label={ __( 'Block spacing' ) }
					onDeselect={ resetGapValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'spacing', 'blockGap' ] ],
						resetGapValue
					) }
					isShownByDefault={
						defaultControls.blockGap ?? DEFAULT_CONTROLS.blockGap
					}
					{ ...inheritanceProps(
						isGapPlaceholder,
						hasGapValue() && inheritedGapRaw !== undefined,
						{
							'tools-panel-item-spacing':
								showSpacingPresetsControl,
							'single-column':
								// If UnitControl is used, should be single-column.
								! showSpacingPresetsControl && ! isAxialGap,
						}
					) }
					panelId={ panelId }
					inheritanceTooltipText={ gapTooltipText }
				>
					{ ! showSpacingPresetsControl &&
						( isAxialGap ? (
							<BoxControl
								label={ __( 'Block spacing' ) }
								min={ 0 }
								onChange={ setGapValues }
								units={ units }
								sides={ gapSides }
								values={ gapValues }
								allowReset={ false }
								splitOnAxis={ isAxialGap }
							/>
						) : (
							<UnitControl
								__next40pxDefaultSize
								label={ __( 'Block spacing' ) }
								min={ 0 }
								onChange={ setGapValue }
								units={ units }
								value={ localGapRaw ?? undefined }
								placeholder={
									isGapPlaceholder
										? inheritedGapRaw
										: undefined
								}
							/>
						) ) }
					{ showSpacingPresetsControl && (
						<SpacingSizesControl
							label={ __( 'Block spacing' ) }
							min={ 0 }
							onChange={ setGapValues }
							showSideInLabel={ false }
							sides={ isAxialGap ? gapSides : [ 'top' ] } // Use 'top' as the shorthand property in non-axial configurations.
							values={ gapValues }
							allowReset={ false }
						/>
					) }
				</InheritanceToolsPanelItem>
			) }
			{ showChildLayoutControl && (
				<ChildLayoutControl
					value={ childLayout }
					onChange={ setChildLayout }
					parentLayout={ settings?.parentLayout }
					panelId={ panelId }
					showGridSpanDefaults={
						! hasViewportBlockStyleState( styleState )
					}
					isShownByDefault={
						defaultControls.childLayout ??
						DEFAULT_CONTROLS.childLayout
					}
				/>
			) }
			{ showMinHeightControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isMinHeightPlaceholder,
						hasMinHeightValue() &&
							inheritedMinHeightValue !== undefined
					) }
					hasValue={ hasMinHeightValue }
					label={ __( 'Minimum height' ) }
					onDeselect={ resetMinHeightValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'dimensions', 'minHeight' ] ],
						resetMinHeightValue
					) }
					isShownByDefault={
						defaultControls.minHeight ?? DEFAULT_CONTROLS.minHeight
					}
					panelId={ panelId }
					inheritanceTooltipText={ tooltipText(
						'dimensions.minHeight'
					) }
				>
					<DimensionControl
						label={ __( 'Minimum height' ) }
						value={ localMinHeightValue }
						onChange={ setMinHeightValue }
						placeholder={
							isMinHeightPlaceholder
								? inheritedMinHeightValue
								: undefined
						}
						dimensionSizes={ dimensions?.dimensionSizes }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ showMinWidthControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isMinWidthPlaceholder,
						hasMinWidthValue() &&
							inheritedMinWidthValue !== undefined
					) }
					hasValue={ hasMinWidthValue }
					label={ __( 'Minimum width' ) }
					onDeselect={ resetMinWidthValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'dimensions', 'minWidth' ] ],
						resetMinWidthValue
					) }
					isShownByDefault={
						defaultControls.minWidth ?? DEFAULT_CONTROLS.minWidth
					}
					panelId={ panelId }
					inheritanceTooltipText={ tooltipText(
						'dimensions.minWidth'
					) }
				>
					<DimensionControl
						label={ __( 'Minimum width' ) }
						value={ localMinWidthValue }
						onChange={ setMinWidthValue }
						placeholder={
							isMinWidthPlaceholder
								? inheritedMinWidthValue
								: undefined
						}
						dimensionSizes={ dimensions?.dimensionSizes }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ showHeightControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isHeightPlaceholder,
						hasHeightValue() && inheritedHeightValue !== undefined
					) }
					hasValue={ hasHeightValue }
					label={ __( 'Height' ) }
					onDeselect={ resetHeightValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'dimensions', 'height' ] ],
						resetHeightValue
					) }
					isShownByDefault={
						defaultControls.height ?? DEFAULT_CONTROLS.height
					}
					panelId={ panelId }
					inheritanceTooltipText={ tooltipText(
						'dimensions.height'
					) }
				>
					<DimensionControl
						label={ __( 'Height' ) }
						value={ localHeightValue }
						onChange={ setHeightValue }
						placeholder={
							isHeightPlaceholder
								? inheritedHeightValue
								: undefined
						}
						dimensionSizes={ dimensions?.dimensionSizes }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ showWidthControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						isWidthPlaceholder,
						hasWidthValue() && inheritedWidthValue !== undefined
					) }
					hasValue={ hasWidthValue }
					label={ __( 'Width' ) }
					onDeselect={ resetWidthValue }
					onPushToGlobalStyles={ getPushHandler(
						[ [ 'dimensions', 'width' ] ],
						resetWidthValue
					) }
					isShownByDefault={
						defaultControls.width ?? DEFAULT_CONTROLS.width
					}
					panelId={ panelId }
					inheritanceTooltipText={ tooltipText( 'dimensions.width' ) }
				>
					<DimensionControl
						label={ __( 'Width' ) }
						value={ localWidthValue }
						onChange={ setWidthValue }
						placeholder={
							isWidthPlaceholder ? inheritedWidthValue : undefined
						}
						dimensionSizes={ dimensions?.dimensionSizes }
					/>
				</InheritanceToolsPanelItem>
			) }
			{ showAspectRatioControl && (
				<AspectRatioTool
					hasValue={ hasAspectRatioValue }
					value={ aspectRatioValue }
					onChange={ setAspectRatioValue }
					panelId={ panelId }
					{ ...inheritanceProps(
						isAspectRatioPlaceholder,
						hasAspectRatioValue() &&
							inheritedAspectRatioValue !== undefined
					) }
					inheritanceTooltipText={ tooltipText(
						'dimensions.aspectRatio'
					) }
					isShownByDefault={
						defaultControls.aspectRatio ??
						DEFAULT_CONTROLS.aspectRatio
					}
				/>
			) }
		</Wrapper>
	);
}
