/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalBoxControl as BoxControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalView as View,
} from '@wordpress/components';
import { Icon, positionCenter, stretchWide } from '@wordpress/icons';
import { useCallback, Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getValueFromVariable } from './utils';
import SpacingSizesControl from '../spacing-sizes-control';
import HeightControl from '../height-control';
import ChildLayoutControl from '../child-layout-control';
import { cleanEmptyObject } from '../../hooks/utils';
import { immutableSet } from '../../utils/object';

const AXIAL_SIDES = [ 'horizontal', 'vertical' ];

export function useHasDimensionsPanel( settings ) {
	const hasContentSize = useHasContentSize( settings );
	const hasWideSize = useHasWideSize( settings );
	const hasPadding = useHasPadding( settings );
	const hasMargin = useHasMargin( settings );
	const hasGap = useHasGap( settings );
	const hasMinHeight = useHasMinHeight( settings );
	const hasChildLayout = useHasChildLayout( settings );

	return (
		Platform.OS === 'web' &&
		( hasContentSize ||
			hasWideSize ||
			hasPadding ||
			hasMargin ||
			hasGap ||
			hasMinHeight ||
			hasChildLayout )
	);
}

function useHasContentSize( settings ) {
	return settings?.layout?.contentSize;
}

function useHasWideSize( settings ) {
	return settings?.layout?.wideSize;
}

function useHasPadding( settings ) {
	return settings?.spacing?.padding;
}

function useHasMargin( settings ) {
	return settings?.spacing?.margin;
}

function useHasGap( settings ) {
	return settings?.spacing?.blockGap;
}

function useHasMinHeight( settings ) {
	return settings?.dimensions?.minHeight;
}

function useHasChildLayout( settings ) {
	const {
		type: parentLayoutType = 'default',
		default: { type: defaultParentLayoutType = 'default' } = {},
		allowSizingOnChildren = false,
	} = settings?.parentLayout ?? {};

	const support =
		( defaultParentLayoutType === 'flex' || parentLayoutType === 'flex' ) &&
		allowSizingOnChildren;

	return !! settings?.layout && support;
}

function useHasSpacingPresets( settings ) {
	const {
		custom,
		theme,
		default: defaultPresets,
	} = settings?.spacing?.spacingSizes || {};
	const presets = custom ?? theme ?? defaultPresets ?? [];

	return presets.length > 0;
}

function filterValuesBySides( values, sides ) {
	if ( ! sides ) {
		// If no custom side configuration all sides are opted into by default.
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

function splitStyleValue( value ) {
	// Check for shorthand value (a string value).
	if ( value && typeof value === 'string' ) {
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

function splitGapValue( value ) {
	// Check for shorthand value (a string value).
	if ( value && typeof value === 'string' ) {
		// If the value is a string, treat it as a single side (top) for the spacing controls.
		return {
			top: value,
		};
	}

	if ( value ) {
		return {
			...value,
			right: value?.left,
			bottom: value?.top,
		};
	}

	return value;
}

function DimensionsToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Dimensions' ) }
			resetAll={ resetAll }
			panelId={ panelId }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	contentSize: false,
	wideSize: false,
	padding: false,
	margin: false,
	blockGap: false,
	minHeight: false,
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
} ) {
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );

	const showSpacingPresetsControl = useHasSpacingPresets( settings );
	const units = useCustomUnits( {
		availableUnits: settings?.spacing?.units || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

	// Content Size
	const showContentSizeControl =
		useHasContentSize( settings ) && includeLayoutControls;
	const contentSizeValue = decodeValue( inheritedValue?.layout?.contentSize );
	const setContentSizeValue = ( newValue ) => {
		onChange(
			immutableSet( value, [ 'layout', 'contentSize' ], newValue )
		);
	};
	const hasUserSetContentSizeValue = () => !! value?.layout?.contentSize;
	const resetContentSizeValue = () => setContentSizeValue( undefined );

	// Wide Size
	const showWideSizeControl =
		useHasWideSize( settings ) && includeLayoutControls;
	const wideSizeValue = decodeValue( inheritedValue?.layout?.wideSize );
	const setWideSizeValue = ( newValue ) => {
		onChange( immutableSet( value, [ 'layout', 'wideSize' ], newValue ) );
	};
	const hasUserSetWideSizeValue = () => !! value?.layout?.wideSize;
	const resetWideSizeValue = () => setWideSizeValue( undefined );

	// Padding
	const showPaddingControl = useHasPadding( settings );
	const rawPadding = decodeValue( inheritedValue?.spacing?.padding );
	const paddingValues = splitStyleValue( rawPadding );
	const paddingSides = Array.isArray( settings?.spacing?.padding )
		? settings?.spacing?.padding
		: settings?.spacing?.padding?.sides;
	const isAxialPadding =
		paddingSides &&
		paddingSides.some( ( side ) => AXIAL_SIDES.includes( side ) );
	const setPaddingValues = ( newPaddingValues ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		onChange( immutableSet( value, [ 'spacing', 'padding' ], padding ) );
	};
	const hasPaddingValue = () =>
		!! value?.spacing?.padding &&
		Object.keys( value?.spacing?.padding ).length;
	const resetPaddingValue = () => setPaddingValues( undefined );
	const onMouseOverPadding = () => onVisualize( 'padding' );

	// Margin
	const showMarginControl = useHasMargin( settings );
	const rawMargin = decodeValue( inheritedValue?.spacing?.margin );
	const marginValues = splitStyleValue( rawMargin );
	const marginSides = Array.isArray( settings?.spacing?.margin )
		? settings?.spacing?.margin
		: settings?.spacing?.margin?.sides;
	const isAxialMargin =
		marginSides &&
		marginSides.some( ( side ) => AXIAL_SIDES.includes( side ) );
	const setMarginValues = ( newMarginValues ) => {
		const margin = filterValuesBySides( newMarginValues, marginSides );
		onChange( immutableSet( value, [ 'spacing', 'margin' ], margin ) );
	};
	const hasMarginValue = () =>
		!! value?.spacing?.margin &&
		Object.keys( value?.spacing?.margin ).length;
	const resetMarginValue = () => setMarginValues( undefined );
	const onMouseOverMargin = () => onVisualize( 'margin' );

	// Block Gap
	const showGapControl = useHasGap( settings );
	const gapValue = decodeValue( inheritedValue?.spacing?.blockGap );
	const gapValues = splitGapValue( gapValue );
	const gapSides = Array.isArray( settings?.spacing?.blockGap )
		? settings?.spacing?.blockGap
		: settings?.spacing?.blockGap?.sides;
	const isAxialGap =
		gapSides && gapSides.some( ( side ) => AXIAL_SIDES.includes( side ) );
	const setGapValue = ( newGapValue ) => {
		onChange(
			immutableSet( value, [ 'spacing', 'blockGap' ], newGapValue )
		);
	};
	const setGapValues = ( nextBoxGapValue ) => {
		if ( ! nextBoxGapValue ) {
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
	const hasGapValue = () => !! value?.spacing?.blockGap;

	// Min Height
	const showMinHeightControl = useHasMinHeight( settings );
	const minHeightValue = decodeValue( inheritedValue?.dimensions?.minHeight );
	const setMinHeightValue = ( newValue ) => {
		onChange(
			immutableSet( value, [ 'dimensions', 'minHeight' ], newValue )
		);
	};
	const resetMinHeightValue = () => {
		setMinHeightValue( undefined );
	};
	const hasMinHeightValue = () => !! value?.dimensions?.minHeight;

	// Child Layout
	const showChildLayoutControl = useHasChildLayout( settings );
	const childLayout = inheritedValue?.layout;
	const { orientation = 'horizontal' } = settings?.parentLayout ?? {};
	const childLayoutOrientationLabel =
		orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
	const setChildLayout = ( newChildLayout ) => {
		onChange( {
			...value,
			layout: {
				...value?.layout,
				...newChildLayout,
			},
		} );
	};
	const resetChildLayoutValue = () => {
		setChildLayout( {
			selfStretch: undefined,
			flexSize: undefined,
		} );
	};
	const hasChildLayoutValue = () => !! value?.layout;

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			layout: cleanEmptyObject( {
				...previousValue?.layout,
				contentSize: undefined,
				wideSize: undefined,
				selfStretch: undefined,
				flexSize: undefined,
			} ),
			spacing: {
				...previousValue?.spacing,
				padding: undefined,
				margin: undefined,
				blockGap: undefined,
			},
			dimensions: {
				...previousValue?.dimensions,
				minHeight: undefined,
			},
		};
	}, [] );

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
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Content size' ) }
					hasValue={ hasUserSetContentSizeValue }
					onDeselect={ resetContentSizeValue }
					isShownByDefault={
						defaultControls.contentSize ??
						DEFAULT_CONTROLS.contentSize
					}
					panelId={ panelId }
				>
					<HStack alignment="flex-end" justify="flex-start">
						<UnitControl
							label={ __( 'Content' ) }
							labelPosition="top"
							__unstableInputWidth="80px"
							value={ contentSizeValue || '' }
							onChange={ ( nextContentSize ) => {
								setContentSizeValue( nextContentSize );
							} }
							units={ units }
						/>
						<View>
							<Icon icon={ positionCenter } />
						</View>
					</HStack>
				</ToolsPanelItem>
			) }
			{ showWideSizeControl && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Wide size' ) }
					hasValue={ hasUserSetWideSizeValue }
					onDeselect={ resetWideSizeValue }
					isShownByDefault={
						defaultControls.wideSize ?? DEFAULT_CONTROLS.wideSize
					}
					panelId={ panelId }
				>
					<HStack alignment="flex-end" justify="flex-start">
						<UnitControl
							label={ __( 'Wide' ) }
							labelPosition="top"
							__unstableInputWidth="80px"
							value={ wideSizeValue || '' }
							onChange={ ( nextWideSize ) => {
								setWideSizeValue( nextWideSize );
							} }
							units={ units }
						/>
						<View>
							<Icon icon={ stretchWide } />
						</View>
					</HStack>
				</ToolsPanelItem>
			) }
			{ showPaddingControl && (
				<ToolsPanelItem
					hasValue={ hasPaddingValue }
					label={ __( 'Padding' ) }
					onDeselect={ resetPaddingValue }
					isShownByDefault={
						defaultControls.padding ?? DEFAULT_CONTROLS.padding
					}
					className={ classnames( {
						'tools-panel-item-spacing': showSpacingPresetsControl,
					} ) }
					panelId={ panelId }
				>
					{ ! showSpacingPresetsControl && (
						<BoxControl
							values={ paddingValues }
							onChange={ setPaddingValues }
							label={ __( 'Padding' ) }
							sides={ paddingSides }
							units={ units }
							allowReset={ false }
							splitOnAxis={ isAxialPadding }
							onMouseOver={ onMouseOverPadding }
							onMouseOut={ onMouseLeaveControls }
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
							splitOnAxis={ isAxialPadding }
							onMouseOver={ onMouseOverPadding }
							onMouseOut={ onMouseLeaveControls }
						/>
					) }
				</ToolsPanelItem>
			) }
			{ showMarginControl && (
				<ToolsPanelItem
					hasValue={ hasMarginValue }
					label={ __( 'Margin' ) }
					onDeselect={ resetMarginValue }
					isShownByDefault={
						defaultControls.margin ?? DEFAULT_CONTROLS.margin
					}
					className={ classnames( {
						'tools-panel-item-spacing': showSpacingPresetsControl,
					} ) }
					panelId={ panelId }
				>
					{ ! showSpacingPresetsControl && (
						<BoxControl
							values={ marginValues }
							onChange={ setMarginValues }
							label={ __( 'Margin' ) }
							sides={ marginSides }
							units={ units }
							allowReset={ false }
							splitOnAxis={ isAxialMargin }
							onMouseOver={ onMouseOverMargin }
							onMouseOut={ onMouseLeaveControls }
						/>
					) }
					{ showSpacingPresetsControl && (
						<SpacingSizesControl
							values={ marginValues }
							onChange={ setMarginValues }
							label={ __( 'Margin' ) }
							sides={ marginSides }
							units={ units }
							allowReset={ false }
							splitOnAxis={ isAxialMargin }
							onMouseOver={ onMouseOverMargin }
							onMouseOut={ onMouseLeaveControls }
						/>
					) }
				</ToolsPanelItem>
			) }
			{ showGapControl && (
				<ToolsPanelItem
					hasValue={ hasGapValue }
					label={ __( 'Block spacing' ) }
					onDeselect={ resetGapValue }
					isShownByDefault={
						defaultControls.blockGap ?? DEFAULT_CONTROLS.blockGap
					}
					className={ classnames( {
						'tools-panel-item-spacing': showSpacingPresetsControl,
					} ) }
					panelId={ panelId }
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
								label={ __( 'Block spacing' ) }
								__unstableInputWidth="80px"
								min={ 0 }
								onChange={ setGapValue }
								units={ units }
								value={ gapValue }
							/>
						) ) }
					{ showSpacingPresetsControl && (
						<SpacingSizesControl
							label={ __( 'Block spacing' ) }
							min={ 0 }
							onChange={ setGapValues }
							sides={ isAxialGap ? gapSides : [ 'top' ] } // Use 'top' as the shorthand property in non-axial configurations.
							values={ gapValues }
							allowReset={ false }
							splitOnAxis={ isAxialGap }
						/>
					) }
				</ToolsPanelItem>
			) }
			{ showMinHeightControl && (
				<ToolsPanelItem
					hasValue={ hasMinHeightValue }
					label={ __( 'Min. height' ) }
					onDeselect={ resetMinHeightValue }
					isShownByDefault={
						defaultControls.minHeight ?? DEFAULT_CONTROLS.minHeight
					}
					panelId={ panelId }
				>
					<HeightControl
						label={ __( 'Min. height' ) }
						value={ minHeightValue }
						onChange={ setMinHeightValue }
					/>
				</ToolsPanelItem>
			) }
			{ showChildLayoutControl && (
				<VStack
					as={ ToolsPanelItem }
					spacing={ 2 }
					hasValue={ hasChildLayoutValue }
					label={ childLayoutOrientationLabel }
					onDeselect={ resetChildLayoutValue }
					isShownByDefault={
						defaultControls.childLayout ??
						DEFAULT_CONTROLS.childLayout
					}
					panelId={ panelId }
				>
					<ChildLayoutControl
						value={ childLayout }
						onChange={ setChildLayout }
						parentLayout={ settings?.parentLayout }
					/>
				</VStack>
			) }
		</Wrapper>
	);
}
