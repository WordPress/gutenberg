import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	BoxControl,
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { Icon, alignNone, stretchWide } from '@wordpress/icons';
import { useCallback, useState } from '@wordpress/element';
import { getValueFromVariable } from '@wordpress/global-styles-engine';
import type { ComponentProps } from 'react';
import type { ClassValue } from 'clsx';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';
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
	getInheritanceProps,
	InheritanceToolsPanelItem,
	isGlobalStylesInheritanceIndicatorUIEnabled,
} from './inheritance';
import type { BlockStyleState } from '../../hooks/types';
import type { ChildLayout } from '../child-layout-control/types';
import type {
	DimensionsPanelProps,
	PanelResetAllFilter,
	PanelStyle,
	SpacingSidesValue,
	StyleSettings,
	StyleToolsPanelProps,
	StyleValue,
} from './types';

type BoxValues = ComponentProps< typeof BoxControl >[ 'values' ];
type BoxSides = ComponentProps< typeof BoxControl >[ 'sides' ];
type SpacingValues = ComponentProps< typeof SpacingSizesControl >[ 'values' ];
type SpacingSides = ComponentProps< typeof SpacingSizesControl >[ 'sides' ];

const AXIAL_SIDES = [ 'horizontal', 'vertical' ];

/**
 * Determines whether a spacing control (`BoxControl` or `SpacingSizesControl`)
 * renders its linked/unlink toggle button, which the local-override reset dot
 * offsets itself against.
 *
 * @param sides            Configurable sides for the control.
 * @param isPresetsControl Whether the presets-based
 *                         `SpacingSizesControl` is used.
 *
 * @return Whether the toggle button is rendered.
 */
function hasSpacingToggle(
	sides: string[] | undefined,
	isPresetsControl: boolean
): boolean {
	if ( sides?.length === 1 ) {
		return false;
	}
	if ( isPresetsControl ) {
		const hasOnlyAxialSides =
			sides?.includes( 'horizontal' ) &&
			sides?.includes( 'vertical' ) &&
			sides?.length === 2;
		return ! hasOnlyAxialSides;
	}
	return true;
}

export function useHasDimensionsPanel(
	settings: StyleSettings | undefined,
	styleState: BlockStyleState = DEFAULT_BLOCK_STYLE_STATE
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

function hasContentSize( settings: StyleSettings | undefined ) {
	return settings?.layout?.contentSize;
}

function hasWideSize( settings: StyleSettings | undefined ) {
	return settings?.layout?.wideSize;
}

function hasPadding( settings: StyleSettings | undefined ) {
	return settings?.spacing?.padding;
}

function hasMargin( settings: StyleSettings | undefined ) {
	return settings?.spacing?.margin;
}

function hasGap( settings: StyleSettings | undefined ) {
	return settings?.spacing?.blockGap;
}

function hasHeight( settings: StyleSettings | undefined ) {
	return settings?.dimensions?.height;
}

function hasMinHeight( settings: StyleSettings | undefined ) {
	return settings?.dimensions?.minHeight;
}

function hasMinWidth( settings: StyleSettings | undefined ) {
	return settings?.dimensions?.minWidth;
}

function hasWidth( settings: StyleSettings | undefined ) {
	return settings?.dimensions?.width;
}

function hasAspectRatio(
	settings: StyleSettings | undefined,
	styleState: BlockStyleState = DEFAULT_BLOCK_STYLE_STATE
) {
	return (
		! hasPseudoBlockStyleState( styleState ) &&
		settings?.dimensions?.aspectRatio
	);
}

function hasChildLayout(
	settings: StyleSettings | undefined,
	styleState: BlockStyleState = DEFAULT_BLOCK_STYLE_STATE
) {
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

function hasSpacingPresets( settings: StyleSettings | undefined ) {
	// A missing count compares as no presets.
	const { defaultSpacingSizes, spacingSizes } = settings?.spacing || {};
	return (
		( defaultSpacingSizes !== false &&
			( spacingSizes?.default?.length as number ) > 0 ) ||
		( spacingSizes?.theme?.length as number ) > 0 ||
		( spacingSizes?.custom?.length as number ) > 0
	);
}

function filterValuesBySides(
	values: SpacingSidesValue | undefined,
	sides: string[] | undefined
) {
	// If no custom side configuration, all sides are opted into by default.
	// Without any values, we have nothing to filter either.
	if ( ! sides || ! values ) {
		return values;
	}

	// Only include sides opted into within filtered values.
	const filteredValues: SpacingSidesValue = {};
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

const EMPTY_VALUES: unknown[] = [ undefined, null, '' ];

function hasValue( value: unknown ) {
	return ! EMPTY_VALUES.includes( value );
}

/**
 * Extracts the numeric quantity from a raw CSS value so it can be used as a
 * unit-control placeholder. The control's unit selector already reflects the
 * inherited unit, so the placeholder must contain only the number (e.g.
 * `120px` -> `120`) rather than the full unit string.
 *
 * @param rawValue Inherited value to parse.
 * @return The numeric quantity, or `undefined` when absent.
 */
function getNumericPlaceholder(
	rawValue: string | number | undefined
): number | undefined {
	if ( ! hasValue( rawValue ) ) {
		return undefined;
	}
	const [ quantity ] = parseQuantityAndUnitFromRawValue( rawValue );
	return quantity;
}

function splitStyleValue(
	value: StyleValue | SpacingSidesValue
): StyleValue | SpacingSidesValue {
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
 * @param sidesValue The inherited sides shape.
 * @return The common value, or undefined.
 */
function getCommonSidesValue(
	sidesValue: StyleValue | SpacingSidesValue
): StyleValue {
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
	// An object holds a value per side.
	const values = sideKeys.map(
		( k ) => ( sidesValue as SpacingSidesValue )[ k ]
	);
	const allDefined = values.every( hasValue );
	if ( ! allDefined ) {
		return undefined;
	}
	const first = values[ 0 ];
	return values.every( ( v ) => v === first ) ? first : undefined;
}

/**
 * Returns whether a sides object (top/right/bottom/left) or shorthand string
 * holds any value on at least one side.
 *
 * Unlike `getCommonSidesValue`, this does not require every side to be defined
 * or equal. It is used to drive the inherited-from-Global-Styles label
 * treatment and the local-override dot, which should reflect the mere presence
 * of an inherited value regardless of whether the individual sides match (a
 * constraint that only applies to BoxControl's single-string placeholder).
 *
 * @param sidesValue The sides shape.
 * @return Whether any side holds a value.
 */
function hasAnySideValue(
	sidesValue: StyleValue | SpacingSidesValue
): boolean {
	if ( ! hasValue( sidesValue ) ) {
		return false;
	}
	if ( typeof sidesValue === 'string' ) {
		return sidesValue !== '';
	}
	if ( typeof sidesValue !== 'object' ) {
		return false;
	}
	return [ 'top', 'right', 'bottom', 'left' ].some( ( side ) =>
		// An object holds a value per side.
		hasValue( ( sidesValue as SpacingSidesValue )[ side ] )
	);
}

function splitGapValue(
	value: StyleValue | SpacingSidesValue,
	isAxialGap: boolean | undefined
): StyleValue | SpacingSidesValue {
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

	// An object holds the gap of each axis.
	return {
		...( value as SpacingSidesValue ),
		right: ( value as SpacingSidesValue )?.left,
		bottom: ( value as SpacingSidesValue )?.top,
	};
}

function DimensionsToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
}: StyleToolsPanelProps ) {
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

const DEFAULT_CONTROLS: Record< string, boolean > = {
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
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	onVisualize = () => {},
	// Special case because the layout controls are not part of the dimensions panel
	// in global styles but not in block inspector.
	includeLayoutControls = false,
	allowAxialBlockGap = true,
	styleState = DEFAULT_BLOCK_STYLE_STATE,
	showInheritanceLabelIndicators = isGlobalStylesInheritanceIndicatorUIEnabled(),
}: DimensionsPanelProps ) {
	const { dimensions, spacing } = settings;

	const decodeValue = ( rawValue: StyleValue | SpacingSidesValue ) => {
		if ( rawValue && typeof rawValue === 'object' ) {
			return Object.keys( rawValue ).reduce< SpacingSidesValue >(
				( acc, key ) => {
					acc[ key ] = getValueFromVariable(
						// Only the dimension and spacing presets are read.
						{
							settings: { dimensions, spacing },
						} as GlobalStylesConfig,
						'',
						// An object holds a value per side.
						( rawValue as SpacingSidesValue )[ key ]
					);
					return acc;
				},
				{}
			);
		}
		return getValueFromVariable(
			// Only the dimension and spacing presets are read.
			{ settings: { dimensions, spacing } } as GlobalStylesConfig,
			'',
			rawValue
		);
	};
	// Always keep the layout className (e.g. `single-column`); only the
	// inheritance treatment is gated on `showInheritanceLabelIndicators`.
	const inheritanceProps = (
		isInherited: unknown,
		hasLocalOverride: unknown,
		className?: ClassValue
	) =>
		getInheritanceProps(
			showInheritanceLabelIndicators && isInherited,
			showInheritanceLabelIndicators && hasLocalOverride,
			className
		);

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

	const resetAllFilter: PanelResetAllFilter = useCallback(
		( previousValue ) => {
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
		},
		[]
	);

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
	const setContentSizeValue = ( newValue?: string ) => {
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
	const setWideSizeValue = ( newValue?: string ) => {
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
		decodeValue( inheritedValue?.spacing?.padding )
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
	// Label/dot inheritance treatment is independent of whether the inherited
	// sides share a common value — it only reflects the presence of an
	// inherited value (the all-sides-equal constraint applies solely to the
	// single-string BoxControl placeholder above).
	const hasInheritedPadding = hasAnySideValue( inheritedPaddingValues );
	const isPaddingInherited =
		! hasValue( value?.spacing?.padding ) && hasInheritedPadding;
	const paddingSides = Array.isArray( settings?.spacing?.padding )
		? settings?.spacing?.padding
		: // The setting is an array or an object with the sides.
			( settings?.spacing?.padding as { sides?: string[] } | undefined )
				?.sides;
	const isAxialPadding =
		paddingSides &&
		paddingSides.some( ( side: string ) => AXIAL_SIDES.includes( side ) );
	const setPaddingValues = ( newPaddingValues?: SpacingSidesValue ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		onChange( setImmutably( value, [ 'spacing', 'padding' ], padding ) );
	};
	const hasPaddingValue = () =>
		hasValue( value?.spacing?.padding ) &&
		// A set value is a string or an object.
		Object.keys( value?.spacing?.padding as object ).length;
	const resetPaddingValue = () => setPaddingValues( undefined );
	const onMouseOverPadding = () => onVisualize( 'padding' );

	// Margin
	const showMarginControl = hasMargin( settings );
	const inheritedMarginValues = splitStyleValue(
		decodeValue( inheritedValue?.spacing?.margin )
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
	const hasInheritedMargin = hasAnySideValue( inheritedMarginValues );
	const isMarginInherited =
		! hasValue( value?.spacing?.margin ) && hasInheritedMargin;
	const marginSides = Array.isArray( settings?.spacing?.margin )
		? settings?.spacing?.margin
		: // The setting is an array or an object with the sides.
			( settings?.spacing?.margin as { sides?: string[] } | undefined )
				?.sides;
	const isAxialMargin =
		marginSides &&
		marginSides.some( ( side: string ) => AXIAL_SIDES.includes( side ) );
	const setMarginValues = ( newMarginValues?: SpacingSidesValue ) => {
		const margin = filterValuesBySides( newMarginValues, marginSides );
		onChange( setImmutably( value, [ 'spacing', 'margin' ], margin ) );
	};
	const hasMarginValue = () =>
		hasValue( value?.spacing?.margin ) &&
		// A set value is a string or an object.
		Object.keys( value?.spacing?.margin as object ).length;
	const resetMarginValue = () => setMarginValues( undefined );
	const onMouseOverMargin = () => onVisualize( 'margin' );

	// Block Gap
	const showGapControl = hasGap( settings );
	const gapSides = Array.isArray( settings?.spacing?.blockGap )
		? settings?.spacing?.blockGap
		: // The setting is an array or an object with the sides.
			( settings?.spacing?.blockGap as { sides?: string[] } | undefined )
				?.sides;
	const isAxialGap =
		allowAxialBlockGap &&
		gapSides &&
		gapSides.some( ( side: string ) => AXIAL_SIDES.includes( side ) );
	const localGapRaw = decodeValue( value?.spacing?.blockGap );
	const inheritedGapRaw = decodeValue( inheritedValue?.spacing?.blockGap );
	const localGapForSingleInput =
		! isAxialGap && typeof localGapRaw === 'object'
			? localGapRaw?.top
			: localGapRaw;
	const inheritedGapForSingleInput =
		! isAxialGap && typeof inheritedGapRaw === 'object'
			? inheritedGapRaw?.top
			: inheritedGapRaw;
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
		typeof inheritedGapForSingleInput === 'string' &&
		inheritedGapForSingleInput !== '';
	const setGapValue = (
		newGapValue: StyleValue | { top?: StyleValue; left?: StyleValue }
	) => {
		onChange(
			setImmutably( value, [ 'spacing', 'blockGap' ], newGapValue )
		);
	};
	const setGapValues = ( nextBoxGapValue?: SpacingSidesValue ) => {
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

	// Min Height
	const showMinHeightControl = hasMinHeight( settings );
	const localMinHeightValue = decodeValue( value?.dimensions?.minHeight );
	const inheritedMinHeightValue = decodeValue(
		inheritedValue?.dimensions?.minHeight
	);
	const isMinHeightPlaceholder =
		! hasValue( value?.dimensions?.minHeight ) &&
		hasValue( inheritedMinHeightValue );
	const setMinHeightValue = ( newValue?: string ) => {
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
	const setHeightValue = ( newValue?: string ) => {
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
	const setMinWidthValue = ( newValue?: string ) => {
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
	const setWidthValue = ( newValue?: string ) => {
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
	const setAspectRatioValue = ( newValue?: string ) => {
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
	// The block's layout style holds its child layout.
	const childLayout = value?.layout as ChildLayout | undefined;

	const setChildLayout = ( newChildLayout: ChildLayout ) => {
		onChange( {
			...value,
			// A child layout holds style values.
			layout: {
				...value?.layout,
				...newChildLayout,
			} as PanelStyle[ 'layout' ],
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
					isShownByDefault={
						defaultControls.contentSize ??
						DEFAULT_CONTROLS.contentSize
					}
					panelId={ panelId }
				>
					<UnitControl
						label={ __( 'Content width' ) }
						labelPosition="top"
						// Local-then-inherited: render the inherited value as the
						// control's value at rest so the unit parses from it
						// (e.g. "620px" keeps its unit rather than the value
						// string sitting greyed-out behind a default px unit). It
						// is only written to local on user change.
						value={
							localContentSizeValue ?? inheritedContentSizeValue
						}
						placeholder={
							isContentSizePlaceholder
								? // The input renders the number as is.
									( getNumericPlaceholder(
										inheritedContentSizeValue
									) as unknown as string )
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
					isShownByDefault={
						defaultControls.wideSize ?? DEFAULT_CONTROLS.wideSize
					}
					panelId={ panelId }
				>
					<UnitControl
						label={ __( 'Wide width' ) }
						labelPosition="top"
						// Local-then-inherited: render the inherited value as the
						// control's value at rest so the unit parses from it
						// rather than the value string sitting greyed-out behind
						// a default px unit. It is only written to local on user
						// change.
						value={ localWideSizeValue ?? inheritedWideSizeValue }
						placeholder={
							isWideSizePlaceholder
								? // The input renders the number as is.
									( getNumericPlaceholder(
										inheritedWideSizeValue
									) as unknown as string )
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
					// A side count is truthy like `true`.
					hasValue={ hasPaddingValue as () => boolean }
					label={ __( 'Padding' ) }
					hasInlineEndToggle={ hasSpacingToggle(
						paddingSides,
						showSpacingPresetsControl
					) }
					onDeselect={ resetPaddingValue }
					isShownByDefault={
						defaultControls.padding ?? DEFAULT_CONTROLS.padding
					}
					{ ...inheritanceProps(
						isPaddingInherited,
						hasPaddingValue() && hasInheritedPadding,
						{
							'tools-panel-item-spacing':
								showSpacingPresetsControl,
						}
					) }
					panelId={ panelId }
				>
					{ ! showSpacingPresetsControl && (
						<BoxControl
							// Split values hold a size per side.
							values={ localPaddingValues as BoxValues }
							onChange={ setPaddingValues }
							label={ __( 'Padding' ) }
							// The setting lists side names.
							sides={ paddingSides as BoxSides }
							units={ units }
							allowReset={ false }
							splitOnAxis={ isAxialPadding }
							inputProps={ {
								onMouseOver: onMouseOverPadding,
								onMouseOut: onMouseLeaveControls,
								// The common side value is a CSS size.
								placeholder: isPaddingPlaceholder
									? ( inheritedPaddingPlaceholder as string )
									: undefined,
							} }
						/>
					) }
					{ showSpacingPresetsControl && (
						<SpacingSizesControl
							// Split values hold a size per side.
							values={ paddingValues as SpacingValues }
							onChange={ setPaddingValues }
							label={ __( 'Padding' ) }
							// The setting lists side names.
							sides={ paddingSides as SpacingSides }
							// @ts-expect-error SpacingSizesControl ignores this prop.
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
					// A side count is truthy like `true`.
					hasValue={ hasMarginValue as () => boolean }
					label={ __( 'Margin' ) }
					hasInlineEndToggle={ hasSpacingToggle(
						marginSides,
						showSpacingPresetsControl
					) }
					onDeselect={ resetMarginValue }
					isShownByDefault={
						defaultControls.margin ?? DEFAULT_CONTROLS.margin
					}
					{ ...inheritanceProps(
						isMarginInherited,
						hasMarginValue() && hasInheritedMargin,
						{
							'tools-panel-item-spacing':
								showSpacingPresetsControl,
						}
					) }
					panelId={ panelId }
				>
					{ ! showSpacingPresetsControl && (
						<BoxControl
							// Split values hold a size per side.
							values={ localMarginValues as BoxValues }
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
								// The common side value is a CSS size.
								placeholder: isMarginPlaceholder
									? ( inheritedMarginPlaceholder as string )
									: undefined,
							} }
							label={ __( 'Margin' ) }
							// The setting lists side names.
							sides={ marginSides as BoxSides }
							units={ units }
							allowReset={ false }
							splitOnAxis={ isAxialMargin }
						/>
					) }
					{ showSpacingPresetsControl && (
						<SpacingSizesControl
							// Split values hold a size per side.
							values={ marginValues as SpacingValues }
							onChange={ setMarginValues }
							minimumCustomValue={ -Infinity }
							label={ __( 'Margin' ) }
							// The setting lists side names.
							sides={ marginSides as SpacingSides }
							// @ts-expect-error SpacingSizesControl ignores this prop.
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
					hasInlineEndToggle={ isAxialGap }
					onDeselect={ resetGapValue }
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
				>
					{ ! showSpacingPresetsControl &&
						( isAxialGap ? (
							<BoxControl
								label={ __( 'Block spacing' ) }
								// @ts-expect-error BoxControl ignores this prop.
								min={ 0 }
								onChange={ setGapValues }
								units={ units }
								// The setting lists side names.
								sides={ gapSides as BoxSides }
								// Split values hold a size per side.
								values={ gapValues as BoxValues }
								allowReset={ false }
								splitOnAxis={ isAxialGap }
							/>
						) : (
							<UnitControl
								label={ __( 'Block spacing' ) }
								min={ 0 }
								onChange={ setGapValue }
								units={ units }
								value={ localGapForSingleInput ?? undefined }
								placeholder={
									isGapPlaceholder
										? inheritedGapForSingleInput
										: undefined
								}
							/>
						) ) }
					{ showSpacingPresetsControl && (
						<SpacingSizesControl
							key={ isAxialGap ? 'axial-gap' : 'single-gap' }
							label={ __( 'Block spacing' ) }
							// @ts-expect-error SpacingSizesControl ignores this prop.
							min={ 0 }
							onChange={ setGapValues }
							showSideInLabel={ false }
							sides={ isAxialGap ? gapSides : [ 'top' ] } // Use 'top' as the shorthand property in non-axial configurations.
							// Split values hold a size per side.
							values={ gapValues as SpacingValues }
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
					// The block inspector passes the block's client ID here.
					panelId={ panelId as string }
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
					isShownByDefault={
						defaultControls.minHeight ?? DEFAULT_CONTROLS.minHeight
					}
					panelId={ panelId }
				>
					<DimensionControl
						label={ __( 'Minimum height' ) }
						// Local-then-inherited: render the inherited value as the
						// control's value at rest so the unit parses from it
						// (e.g. "120px" keeps its unit rather than the value
						// string sitting behind a default px unit). It is only
						// written to local on user change.
						value={ localMinHeightValue ?? inheritedMinHeightValue }
						onChange={ setMinHeightValue }
						placeholder={
							isMinHeightPlaceholder
								? // The input renders the number as is.
									( getNumericPlaceholder(
										inheritedMinHeightValue
									) as unknown as string )
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
					isShownByDefault={
						defaultControls.minWidth ?? DEFAULT_CONTROLS.minWidth
					}
					panelId={ panelId }
				>
					<DimensionControl
						label={ __( 'Minimum width' ) }
						// Local-then-inherited: render the inherited value as the
						// control's value at rest so the unit parses from it
						// rather than the value string sitting behind a default
						// px unit. It is only written to local on user change.
						value={ localMinWidthValue ?? inheritedMinWidthValue }
						onChange={ setMinWidthValue }
						placeholder={
							isMinWidthPlaceholder
								? // The input renders the number as is.
									( getNumericPlaceholder(
										inheritedMinWidthValue
									) as unknown as string )
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
					isShownByDefault={
						defaultControls.height ?? DEFAULT_CONTROLS.height
					}
					panelId={ panelId }
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
					isShownByDefault={
						defaultControls.width ?? DEFAULT_CONTROLS.width
					}
					panelId={ panelId }
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
					isShownByDefault={
						defaultControls.aspectRatio ??
						DEFAULT_CONTROLS.aspectRatio
					}
				/>
			) }
		</Wrapper>
	);
}
