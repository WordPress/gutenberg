/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as BaseUnitControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useThemeSetting from '../use-theme-setting';

export default function UnitControl( { units: unitsProp, ...props } ) {
	const units = useCustomUnits( unitsProp );

	return <BaseUnitControl units={ units } { ...props } />;
}

/**
 * Filters available units based on values defined by settings.
 *
 * @param {Array} settings Collection of preferred units.
 * @param {Array} units Collection of available units.
 *
 * @return {Array} Filtered units based on settings.
 */
function filterUnitsWithSettings( settings = [], units = [] ) {
	return units.filter( ( unit ) => {
		return settings.includes( unit.value );
	} );
}

/**
 * Custom hook to retrieve and consolidate units setting from add_theme_support().
 *
 * @param {Array} units Collection of available units.
 *
 * @return {Array} Filtered units based on settings.
 */
export function useCustomUnits( units ) {
	const availableUnits = useThemeSetting( 'spacing.units' );
	const usedUnits = filterUnitsWithSettings(
		! availableUnits ? [] : availableUnits,
		units
	);

	return usedUnits.length === 0 ? false : usedUnits;
}
