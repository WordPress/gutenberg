/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalBoxControl as BoxControl,
	PanelBody,
} from '@wordpress/components';
import { getBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useEditorFeature } from '../editor/utils';
import { store as editSiteStore } from '../../store';

const isWeb = Platform.OS === 'web';
const CSS_UNITS = [
	{
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: '',
	},
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '',
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '',
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '',
	},
	{
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: '',
	},
];

export function useHasSpacingPanel( context ) {
	const hasPadding = useHasPadding( context );

	return hasPadding;
}

export function useHasPadding( { name, supports } ) {
	return (
		useEditorFeature( 'spacing.customPadding', name ) &&
		supports.includes( 'padding' )
	);
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

	// Skip when setting is boolean as theme isn't setting arbitrary sides.
	if ( typeof support[ feature ] === 'boolean' ) {
		return;
	}

	return support[ feature ];
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

function useThemeValues( name, feature ) {
	return useSelect(
		( select ) => {
			const baseStyles = select( editSiteStore ).getSettings()
				.__experimentalGlobalStylesBaseStyles;
			return baseStyles?.styles?.[ name ]?.spacing?.[ feature ];
		},
		[ name, feature ]
	);
}

export default function SpacingPanel( { context, getStyle, setStyle } ) {
	const { name } = context;
	const showPaddingControl = useHasPadding( context );
	const units = useCustomUnits( { contextName: name, units: CSS_UNITS } );

	const paddingValues = getStyle( name, 'padding' );
	const themePaddingValues = useThemeValues( name, 'padding' );
	const paddingSides = useCustomSides( name, 'padding' );

	const setPaddingValues = ( newPaddingValues ) => {
		const padding = filterValuesBySides( newPaddingValues, paddingSides );
		setStyle( name, 'padding', padding );
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
					resetValues={ themePaddingValues }
				/>
			) }
		</PanelBody>
	);
}
