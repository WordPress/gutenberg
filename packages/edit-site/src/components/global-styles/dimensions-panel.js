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
import { __experimentalUseCustomSides as useCustomSides } from '@wordpress/block-editor';
import { Icon, positionCenter, stretchWide } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels, useSetting, useStyle } from './hooks';

const AXIAL_SIDES = [ 'horizontal', 'vertical' ];

export function useHasDimensionsPanel( name ) {
	const hasContentSize = useHasContentSize( name );
	const hasWideSize = useHasWideSize( name );
	const hasPadding = useHasPadding( name );
	const hasMargin = useHasMargin( name );
	const hasGap = useHasGap( name );

	return hasContentSize || hasWideSize || hasPadding || hasMargin || hasGap;
}

function useHasContentSize( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ settings ] = useSetting( 'layout.contentSize', name );

	return settings && supports.includes( 'contentSize' );
}

function useHasWideSize( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ settings ] = useSetting( 'layout.wideSize', name );

	return settings && supports.includes( 'wideSize' );
}

function useHasPadding( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ settings ] = useSetting( 'spacing.padding', name );

	return settings && supports.includes( 'padding' );
}

function useHasMargin( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ settings ] = useSetting( 'spacing.margin', name );

	return settings && supports.includes( 'margin' );
}

function useHasGap( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ settings ] = useSetting( 'spacing.blockGap', name );

	return settings && supports.includes( 'blockGap' );
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
	// Check for shorthand value ( a string value ).
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

// Props for managing `layout.contentSize`.
function useContentSizeProps( name ) {
	const [ contentSizeValue, setContentSizeValue ] = useSetting(
		'layout.contentSize',
		name
	);
	const [ userSetContentSizeValue ] = useSetting(
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
	const [ wideSizeValue, setWideSizeValue ] = useSetting(
		'layout.wideSize',
		name
	);
	const [ userSetWideSizeValue ] = useSetting(
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
function usePaddingProps( name ) {
	const [ rawPadding, setRawPadding ] = useStyle( 'spacing.padding', name );
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
	const [ userSetPaddingValue ] = useStyle( 'spacing.padding', name, 'user' );
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
function useMarginProps( name ) {
	const [ rawMargin, setRawMargin ] = useStyle( 'spacing.margin', name );
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
function useBlockGapProps( name ) {
	const [ gapValue, setGapValue ] = useStyle( 'spacing.blockGap', name );
	const resetGapValue = () => setGapValue( undefined );
	const [ userSetGapValue ] = useStyle( 'spacing.blockGap', name, 'user' );
	const hasGapValue = () => !! userSetGapValue;
	return {
		gapValue,
		setGapValue,
		resetGapValue,
		hasGapValue,
	};
}

export default function DimensionsPanel( { name } ) {
	const showContentSizeControl = useHasContentSize( name );
	const showWideSizeControl = useHasWideSize( name );
	const showPaddingControl = useHasPadding( name );
	const showMarginControl = useHasMargin( name );
	const showGapControl = useHasGap( name );
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units', name )[ 0 ] || [
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
	} = usePaddingProps( name );

	// Props for managing `spacing.margin`.
	const {
		marginValues,
		marginSides,
		isAxialMargin,
		setMarginValues,
		resetMarginValue,
		hasMarginValue,
	} = useMarginProps( name );

	// Props for managing `spacing.blockGap`.
	const { gapValue, setGapValue, resetGapValue, hasGapValue } =
		useBlockGapProps( name );

	const resetAll = () => {
		resetPaddingValue();
		resetMarginValue();
		resetGapValue();
		resetContentSizeValue();
		resetWideSizeValue();
	};

	return (
		<ToolsPanel label={ __( 'Dimensions' ) } resetAll={ resetAll }>
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
				>
					<BoxControl
						values={ paddingValues }
						onChange={ setPaddingValues }
						label={ __( 'Padding' ) }
						sides={ paddingSides }
						units={ units }
						allowReset={ false }
						splitOnAxis={ isAxialPadding }
					/>
				</ToolsPanelItem>
			) }
			{ showMarginControl && (
				<ToolsPanelItem
					hasValue={ hasMarginValue }
					label={ __( 'Margin' ) }
					onDeselect={ resetMarginValue }
					isShownByDefault={ true }
				>
					<BoxControl
						values={ marginValues }
						onChange={ setMarginValues }
						label={ __( 'Margin' ) }
						sides={ marginSides }
						units={ units }
						allowReset={ false }
						splitOnAxis={ isAxialMargin }
					/>
				</ToolsPanelItem>
			) }
			{ showGapControl && (
				<ToolsPanelItem
					hasValue={ hasGapValue }
					label={ __( 'Block spacing' ) }
					onDeselect={ resetGapValue }
					isShownByDefault={ true }
				>
					<UnitControl
						label={ __( 'Block spacing' ) }
						__unstableInputWidth="80px"
						min={ 0 }
						onChange={ setGapValue }
						units={ units }
						value={ gapValue }
					/>
				</ToolsPanelItem>
			) }
		</ToolsPanel>
	);
}
