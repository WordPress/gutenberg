/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as BaseUnitControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';

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
 * @param {Array}  units Collection of available units.
 * @param {string} unitsSetting The setting for custom units.
 *
 * @return {Array} Filtered units based on settings.
 */
export function useCustomUnits( units, unitsSetting ) {
	unitsSetting = unitsSetting || 'spacing.units';
	const availableUnits = useSetting( unitsSetting );
	if ( undefined === availableUnits ) {
		return units;
	}
	const usedUnits = filterUnitsWithSettings(
		! availableUnits ? [] : availableUnits,
		units
	);

	return usedUnits.length === 0 ? false : usedUnits;
}
