/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalBoxControl as BoxControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __experimentalUseCustomSides as useCustomSides } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels, useSetting, useStyle } from './hooks';

const AXIAL_SIDES = [ 'horizontal', 'vertical' ];

export function useHasDimensionsPanel( name ) {
	const hasPadding = useHasPadding( name );
	const hasMargin = useHasMargin( name );

	return hasPadding || hasMargin;
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

export default function DimensionsPanel( { name } ) {
	const showPaddingControl = useHasPadding( name );
	const showMarginControl = useHasMargin( name );
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units', name )[ 0 ] || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

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
	const hasPaddingValue = () =>
		!! paddingValues && Object.keys( paddingValues ).length;

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
	const resetAll = () => {
		resetPaddingValue();
		resetMarginValue();
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
		</ToolsPanel>
	);
}
