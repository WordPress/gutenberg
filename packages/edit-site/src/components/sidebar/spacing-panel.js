/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalBoxControl as BoxControl,
	PanelBody,
} from '@wordpress/components';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useEditorFeature } from '../editor/utils';

export function useHasSpacingPanel( context ) {
	const hasPadding = useHasPadding( context );
	const hasMargin = useHasMargin( context );

	return hasPadding || hasMargin;
}

function useHasPadding( { name, supports } ) {
	return (
		useEditorFeature( 'spacing.customPadding', name ) &&
		supports.includes( 'padding' )
	);
}

function useHasMargin( { name, supports } ) {
	const settings = useEditorFeature( 'spacing.customMargin', name );

	return settings && supports.includes( 'margin' );
}

function filterUnitsWithSettings( settings = [], units = [] ) {
	return units.filter( ( unit ) => {
		return settings.includes( unit.value );
	} );
}

function useCustomUnits( { units, contextName } ) {
	const availableUnits = useEditorFeature( 'spacing.units', contextName );
	const usedUnits = filterUnitsWithSettings(
		! availableUnits ? [] : availableUnits,
		units
	);

	return usedUnits.length === 0 ? false : usedUnits;
}

function useCustomSides( blockName, feature ) {
	const support = getBlockSupport( blockName, 'spacing' );

	// Return empty config when setting is boolean as theme isn't setting
	// arbitrary sides.
	if ( typeof support[ feature ] === 'boolean' ) {
		return {};
	}

	return support[ feature ];
}

function filterValuesBySides( values, sides ) {
	if ( Object.entries( sides ).length === 0 ) {
		// If no custom side configuration all sides are opted into by default.
		return values;
	}

	// Only include sides opted into within filtered values.
	return Object.keys( sides )
		.filter( ( side ) => sides[ side ] )
		.reduce(
			( filtered, side ) => ( { ...filtered, [ side ]: values[ side ] } ),
			{}
		);
}

export default function SpacingPanel( { context, getStyle, setStyle } ) {
	const { name } = context;
	const showPaddingControl = useHasPadding( context );
	const showMarginControl = useHasMargin( context );
	const units = useCustomUnits( { contextName: name } );

	const paddingValues = getStyle( name, 'padding' );
	const paddingSides = useCustomSides( name, 'padding' );

	const setPaddingValues = ( newPaddingValues ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		setStyle( name, 'padding', padding );
	};

	const marginValues = getStyle( name, 'margin' );
	const marginSides = useCustomSides( name, 'margin' );

	const setMarginValues = ( newMarginValues ) => {
		const margin = filterValuesBySides( newMarginValues, marginSides );
		setStyle( name, 'margin', margin );
	};

	return (
		<PanelBody title={ __( 'Spacing' ) }>
			{ showPaddingControl && (
				<BoxControl
					values={ paddingValues }
					onChange={ setPaddingValues }
					label={ __( 'Padding' ) }
					sides={ paddingSides }
					units={ units }
					resetToInitialValues
				/>
			) }
			{ showMarginControl && (
				<BoxControl
					values={ marginValues }
					onChange={ setMarginValues }
					label={ __( 'Margin' ) }
					sides={ marginSides }
					units={ units }
					resetToInitialValues
				/>
			) }
		</PanelBody>
	);
}
