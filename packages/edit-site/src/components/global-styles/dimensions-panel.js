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
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalView as View,
} from '@wordpress/components';
import {
	__experimentalUseCustomSides as useCustomSides,
	HeightControl,
	__experimentalSpacingSizesControl as SpacingSizesControl,
	experiments as blockEditorExperiments,
} from '@wordpress/block-editor';
import { Icon, positionCenter, stretchWide } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useSupportedStyles } from './hooks';
import { unlock } from '../../experiments';

const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorExperiments );

const AXIAL_SIDES = [ 'horizontal', 'vertical' ];

export function useHasDimensionsPanel( name ) {
	const hasContentSize = useHasContentSize( name );
	const hasWideSize = useHasWideSize( name );
	const hasPadding = useHasPadding( name );
	const hasMargin = useHasMargin( name );
	const hasGap = useHasGap( name );
	const hasMinHeight = useHasMinHeight( name );

	return (
		hasContentSize ||
		hasWideSize ||
		hasPadding ||
		hasMargin ||
		hasGap ||
		hasMinHeight
	);
}

function useHasContentSize( name ) {
	const supports = useSupportedStyles( name );
	const [ settings ] = useGlobalSetting( 'layout.contentSize', name );

	return settings && supports.includes( 'contentSize' );
}

function useHasWideSize( name ) {
	const supports = useSupportedStyles( name );
	const [ settings ] = useGlobalSetting( 'layout.wideSize', name );

	return settings && supports.includes( 'wideSize' );
}

function useHasPadding( name ) {
	const supports = useSupportedStyles( name );
	const [ settings ] = useGlobalSetting( 'spacing.padding', name );

	return settings && supports.includes( 'padding' );
}

function useHasMargin( name ) {
	const supports = useSupportedStyles( name );
	const [ settings ] = useGlobalSetting( 'spacing.margin', name );

	return settings && supports.includes( 'margin' );
}

function useHasGap( name ) {
	const supports = useSupportedStyles( name );
	const [ settings ] = useGlobalSetting( 'spacing.blockGap', name );

	return settings && supports.includes( 'blockGap' );
}

function useHasMinHeight( name ) {
	const supports = useSupportedStyles( name );
	const [ settings ] = useGlobalSetting( 'dimensions.minHeight', name );

	return settings && supports.includes( 'minHeight' );
}

function useHasSpacingPresets() {
	const [ settings ] = useGlobalSetting( 'spacing.spacingSizes' );
	const { custom, theme, default: defaultPresets } = settings || {};
	const presets = custom ?? theme ?? defaultPresets ?? [];

	return settings && presets.length > 0;
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
		filteredValues[ side ] = values[ side ];
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

// Props for managing `layout.contentSize`.
function useContentSizeProps( name ) {
	const [ contentSizeValue, setContentSizeValue ] = useGlobalSetting(
		'layout.contentSize',
		name
	);
	const [ userSetContentSizeValue ] = useGlobalSetting(
		'layout.contentSize',
		name,
		'user'
	);
	const hasUserSetContentSizeValue = () => !! userSetContentSizeValue;
	const resetContentSizeValue = () => setContentSizeValue( '' );
	return {
		contentSizeValue,
		setContentSizeValue,
		hasUserSetContentSizeValue,
		resetContentSizeValue,
	};
}

// Props for managing `layout.wideSize`.
function useWideSizeProps( name ) {
	const [ wideSizeValue, setWideSizeValue ] = useGlobalSetting(
		'layout.wideSize',
		name
	);
	const [ userSetWideSizeValue ] = useGlobalSetting(
		'layout.wideSize',
		name,
		'user'
	);
	const hasUserSetWideSizeValue = () => !! userSetWideSizeValue;
	const resetWideSizeValue = () => setWideSizeValue( '' );
	return {
		wideSizeValue,
		setWideSizeValue,
		hasUserSetWideSizeValue,
		resetWideSizeValue,
	};
}

// Props for managing `spacing.padding`.
function usePaddingProps( name, variation = '' ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const [ rawPadding, setRawPadding ] = useGlobalStyle(
		prefix + 'spacing.padding',
		name
	);
	const paddingValues = splitStyleValue( rawPadding );
	const paddingSides = useCustomSides( name, 'padding' );
	const isAxialPadding =
		paddingSides &&
		paddingSides.some( ( side ) => AXIAL_SIDES.includes( side ) );

	const setPaddingValues = ( newPaddingValues ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		setRawPadding( padding );
	};
	const resetPaddingValue = () => setPaddingValues( {} );
	const [ userSetPaddingValue ] = useGlobalStyle(
		prefix + 'spacing.padding',
		name,
		'user'
	);
	// The `hasPaddingValue` check does not need a parsed value, as `userSetPaddingValue` will be `undefined` if not set.
	const hasPaddingValue = () => !! userSetPaddingValue;

	return {
		paddingValues,
		paddingSides,
		isAxialPadding,
		setPaddingValues,
		resetPaddingValue,
		hasPaddingValue,
	};
}

// Props for managing `spacing.margin`.
function useMarginProps( name, variation = '' ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const [ rawMargin, setRawMargin ] = useGlobalStyle(
		prefix + 'spacing.margin',
		name
	);
	const marginValues = splitStyleValue( rawMargin );
	const marginSides = useCustomSides( name, 'margin' );
	const isAxialMargin =
		marginSides &&
		marginSides.some( ( side ) => AXIAL_SIDES.includes( side ) );

	const setMarginValues = ( newMarginValues ) => {
		const margin = filterValuesBySides( newMarginValues, marginSides );
		setRawMargin( margin );
	};
	const resetMarginValue = () => setMarginValues( {} );
	const hasMarginValue = () =>
		!! marginValues && Object.keys( marginValues ).length;

	return {
		marginValues,
		marginSides,
		isAxialMargin,
		setMarginValues,
		resetMarginValue,
		hasMarginValue,
	};
}

// Props for managing `spacing.blockGap`.
function useBlockGapProps( name, variation = '' ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const [ gapValue, setGapValue ] = useGlobalStyle(
		prefix + 'spacing.blockGap',
		name
	);
	const gapValues = splitGapValue( gapValue );
	const gapSides = useCustomSides( name, 'blockGap' );
	const isAxialGap =
		gapSides && gapSides.some( ( side ) => AXIAL_SIDES.includes( side ) );
	const resetGapValue = () => setGapValue( undefined );
	const [ userSetGapValue ] = useGlobalStyle(
		prefix + 'spacing.blockGap',
		name,
		'user'
	);
	const hasGapValue = () => !! userSetGapValue;
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
	return {
		gapValue,
		gapValues,
		gapSides,
		isAxialGap,
		setGapValue,
		setGapValues,
		resetGapValue,
		hasGapValue,
	};
}

// Props for managing `dimensions.minHeight`.
function useMinHeightProps( name, variation = '' ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const [ minHeightValue, setMinHeightValue ] = useGlobalStyle(
		prefix + 'dimensions.minHeight',
		name
	);
	const resetMinHeightValue = () => setMinHeightValue( undefined );
	const hasMinHeightValue = () => !! minHeightValue;
	return {
		minHeightValue,
		setMinHeightValue,
		resetMinHeightValue,
		hasMinHeightValue,
	};
}

export default function DimensionsPanel( { name, variation = '' } ) {
	const showContentSizeControl = useHasContentSize( name );
	const showWideSizeControl = useHasWideSize( name );
	const showPaddingControl = useHasPadding( name );
	const showMarginControl = useHasMargin( name );
	const showGapControl = useHasGap( name );
	const showMinHeightControl = useHasMinHeight( name );
	const showSpacingPresetsControl = useHasSpacingPresets();
	const units = useCustomUnits( {
		availableUnits: useGlobalSetting( 'spacing.units', name )[ 0 ] || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

	// Props for managing `layout.contentSize`.
	const {
		contentSizeValue,
		setContentSizeValue,
		hasUserSetContentSizeValue,
		resetContentSizeValue,
	} = useContentSizeProps( name );

	// Props for managing `layout.wideSize`.
	const {
		wideSizeValue,
		setWideSizeValue,
		hasUserSetWideSizeValue,
		resetWideSizeValue,
	} = useWideSizeProps( name );

	// Props for managing `spacing.padding`.
	const {
		paddingValues,
		paddingSides,
		isAxialPadding,
		setPaddingValues,
		resetPaddingValue,
		hasPaddingValue,
	} = usePaddingProps( name, variation );

	// Props for managing `spacing.margin`.
	const {
		marginValues,
		marginSides,
		isAxialMargin,
		setMarginValues,
		resetMarginValue,
		hasMarginValue,
	} = useMarginProps( name, variation );

	// Props for managing `spacing.blockGap`.
	const {
		gapValue,
		gapValues,
		gapSides,
		isAxialGap,
		setGapValue,
		setGapValues,
		resetGapValue,
		hasGapValue,
	} = useBlockGapProps( name, variation );

	// Props for managing `dimensions.minHeight`.
	const {
		minHeightValue,
		setMinHeightValue,
		resetMinHeightValue,
		hasMinHeightValue,
	} = useMinHeightProps( name, variation );

	const resetAll = () => {
		resetPaddingValue();
		resetMarginValue();
		resetGapValue();
		resetContentSizeValue();
		resetWideSizeValue();
	};

	return (
		<ToolsPanel
			label={ __( 'Dimensions' ) }
			resetAll={ resetAll }
			headingLevel={ 3 }
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
					isShownByDefault={ true }
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
					isShownByDefault={ true }
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
					isShownByDefault={ true }
					className={ classnames( {
						'tools-panel-item-spacing': showSpacingPresetsControl,
					} ) }
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
						/>
					) }
				</ToolsPanelItem>
			) }
			{ showMarginControl && (
				<ToolsPanelItem
					hasValue={ hasMarginValue }
					label={ __( 'Margin' ) }
					onDeselect={ resetMarginValue }
					isShownByDefault={ true }
					className={ classnames( {
						'tools-panel-item-spacing': showSpacingPresetsControl,
					} ) }
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
						/>
					) }
				</ToolsPanelItem>
			) }
			{ showGapControl && (
				<ToolsPanelItem
					hasValue={ hasGapValue }
					label={ __( 'Block spacing' ) }
					onDeselect={ resetGapValue }
					isShownByDefault={ true }
					className={ classnames( {
						'tools-panel-item-spacing': showSpacingPresetsControl,
					} ) }
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
					isShownByDefault={ true }
				>
					<HeightControl
						label={ __( 'Min. height' ) }
						value={ minHeightValue }
						onChange={ setMinHeightValue }
					/>
				</ToolsPanelItem>
			) }
		</ToolsPanel>
	);
}
