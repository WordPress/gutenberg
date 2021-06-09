/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalBlockSupportPanel as BlockSupportPanel,
	__experimentalBoxControl as BoxControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __experimentalUseCustomSides as useCustomSides } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useSetting } from '../editor/utils';

export function useHasDimensionsPanel( context ) {
	const hasHeight = useHasHeight( context );
	const hasPadding = useHasPadding( context );
	const hasMargin = useHasMargin( context );

	return hasHeight || hasPadding || hasMargin;
}

function useHasHeight( { name, supports } ) {
	const settings = useSetting( 'dimensions.customHeight', name );

	return settings && supports.includes( 'height' );
}

function useHasPadding( { name, supports } ) {
	const settings = useSetting( 'spacing.customPadding', name );

	return settings && supports.includes( 'padding' );
}

function useHasMargin( { name, supports } ) {
	const settings = useSetting( 'spacing.customMargin', name );

	return settings && supports.includes( 'margin' );
}

function filterValuesBySides( values, sides ) {
	if ( ! sides ) {
		// If no custom side configuration all sides are opted into by default.
		return values;
	}

	// Only include sides opted into within filtered values.
	const filteredValues = {};
	sides.forEach( ( side ) => ( filteredValues[ side ] = values[ side ] ) );

	return filteredValues;
}

export default function DimensionsPanel( { context, getStyle, setStyle } ) {
	const { name } = context;
	const showHeightControl = useHasHeight( context );
	const showPaddingControl = useHasPadding( context );
	const showMarginControl = useHasMargin( context );
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units', name ) || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

	// Height.
	const heightValue = getStyle( name, 'height' );
	const setHeightValue = ( next ) => setStyle( name, 'height', next );
	const resetHeightValue = () => setHeightValue( undefined );
	const hasHeightValue = () => !! heightValue;

	// Padding.
	const paddingValues = getStyle( name, 'padding' );
	const paddingSides = useCustomSides( name, 'padding' );

	const setPaddingValues = ( newPaddingValues ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		setStyle( name, 'padding', padding );
	};
	const resetPaddingValue = () => setPaddingValues( {} );
	const hasPaddingValue = () =>
		paddingValues && Object.keys( paddingValues ).length;

	// Margin.
	const marginValues = getStyle( name, 'margin' );
	const marginSides = useCustomSides( name, 'margin' );

	const setMarginValues = ( newMarginValues ) => {
		const margin = filterValuesBySides( newMarginValues, marginSides );
		setStyle( name, 'margin', margin );
	};
	const resetMarginValue = () => setMarginValues( {} );
	const hasMarginValue = () =>
		marginValues && Object.keys( marginValues ).length;

	const resetAll = () => {
		resetPaddingValue();
		resetMarginValue();
	};

	return (
		<BlockSupportPanel
			label={ __( 'Dimensions options' ) }
			title={ __( 'Dimensions' ) }
			resetAll={ resetAll }
		>
			{ showHeightControl && (
				<UnitControl
					label={ __( 'Height' ) }
					value={ heightValue }
					hasValue={ hasHeightValue }
					onChange={ setHeightValue }
					reset={ resetHeightValue }
					isShownByDefault={ true }
					units={ units }
					min={ 0 }
				/>
			) }
			{ showPaddingControl && (
				<BoxControl
					values={ paddingValues }
					onChange={ setPaddingValues }
					label={ __( 'Padding' ) }
					sides={ paddingSides }
					units={ units }
					hasValue={ hasPaddingValue }
					reset={ resetPaddingValue }
					allowReset={ false }
					isShownByDefault={ true }
				/>
			) }
			{ showMarginControl && (
				<BoxControl
					values={ marginValues }
					onChange={ setMarginValues }
					label={ __( 'Margin' ) }
					sides={ marginSides }
					units={ units }
					hasValue={ hasMarginValue }
					reset={ resetMarginValue }
					allowReset={ false }
					isShownByDefault={ true }
				/>
			) }
		</BlockSupportPanel>
	);
}
