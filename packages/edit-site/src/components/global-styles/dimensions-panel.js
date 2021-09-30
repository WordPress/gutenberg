/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalBoxControl as BoxControl,
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __experimentalUseCustomSides as useCustomSides } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useSetting } from '../editor/utils';

const AXIAL_SIDES = [ 'horizontal', 'vertical' ];

export function useHasDimensionsPanel( context ) {
	const hasPadding = useHasPadding( context );
	const hasMargin = useHasMargin( context );
	const hasGap = useHasGap( context );

	return hasPadding || hasMargin || hasGap;
}

function useHasPadding( { name, supports } ) {
	const settings = useSetting( 'spacing.customPadding', name );

	return settings && supports.includes( 'padding' );
}

function useHasMargin( { name, supports } ) {
	const settings = useSetting( 'spacing.customMargin', name );

	return settings && supports.includes( 'margin' );
}

function useHasGap( { name, supports } ) {
	const settings = useSetting( 'spacing.blockGap', name );

	return settings && supports.includes( '--wp--style--block-gap' );
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

export default function DimensionsPanel( { context, getStyle, setStyle } ) {
	const { name } = context;
	const showPaddingControl = useHasPadding( context );
	const showMarginControl = useHasMargin( context );
	const showGapControl = useHasGap( context );
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units', name ) || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

	const paddingValues = splitStyleValue( getStyle( name, 'padding' ) );
	const paddingSides = useCustomSides( name, 'padding' );
	const isAxialPadding =
		paddingSides &&
		paddingSides.some( ( side ) => AXIAL_SIDES.includes( side ) );

	const setPaddingValues = ( newPaddingValues ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		setStyle( name, 'padding', padding );
	};
	const resetPaddingValue = () => setPaddingValues( {} );
	const hasPaddingValue = () =>
		!! paddingValues && Object.keys( paddingValues ).length;

	const marginValues = splitStyleValue( getStyle( name, 'margin' ) );
	const marginSides = useCustomSides( name, 'margin' );
	const isAxialMargin =
		marginSides &&
		marginSides.some( ( side ) => AXIAL_SIDES.includes( side ) );

	const setMarginValues = ( newMarginValues ) => {
		const margin = filterValuesBySides( newMarginValues, marginSides );
		setStyle( name, 'margin', margin );
	};
	const resetMarginValue = () => setMarginValues( {} );
	const hasMarginValue = () =>
		!! marginValues && Object.keys( marginValues ).length;

	const gapValue = getStyle( name, '--wp--style--block-gap' );

	const setGapValue = ( newGapValue ) => {
		setStyle( name, '--wp--style--block-gap', newGapValue );
	};
	const resetGapValue = () => setGapValue( undefined );
	const hasGapValue = () => !! gapValue;

	const resetAll = () => {
		resetPaddingValue();
		resetMarginValue();
		resetGapValue();
	};

	return (
		<ToolsPanel label={ __( 'Dimensions' ) } resetAll={ resetAll }>
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
					className="single-column"
					hasValue={ hasGapValue }
					label={ __( 'Block gap' ) }
					onDeselect={ resetGapValue }
					isShownByDefault={ true }
				>
					<UnitControl
						label={ __( 'Block gap' ) }
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
