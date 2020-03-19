/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as BaseUnitControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const { __defaultUnits } = BaseUnitControl;

export default function UnitControl( { units: unitsProp, ...props } ) {
	const settings = useCustomUnitsSettings();
	const isDisabled = !! settings;

	// Adjust units based on add_theme_support( 'experimental-custom-units' );
	let units;

	/**
	 * Handle extra arguments for add_theme_support
	 *
	 * Example: add_theme_support( 'experimental-custom-units', 'rem' );
	 * Or: add_theme_support( 'experimental-custom-units', 'px, 'rem', 'em' );
	 *
	 * Note: If there are unit argument (e.g. 'em'), these units are enabled
	 * within the control.
	 */
	if ( Array.isArray( settings ) ) {
		units = filterUnitsWithSettings( settings, unitsProp );
	} else {
		units = isDisabled ? false : unitsProp;
	}

	return <BaseUnitControl units={ units } { ...props } />;
}

// Hoisting statics from the BaseUnitControl
UnitControl.__defaultUnits = __defaultUnits;

/**
 * Hook that retrieves the 'experimental-custom-units' setting from add_theme_support()
 */
function useCustomUnitsSettings() {
	const settings = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return getSettings().__experimentalDisableCustomUnits;
	}, [] );

	return settings;
}

/**
 * Filters available units based on values defined by settings.
 *
 * @param {Array} settings Collection of preferred units.
 * @param {Array} units Collection of available units.
 *
 * @return {Array}
 */
function filterUnitsWithSettings( settings = [], units = [] ) {
	return units.filter( ( unit ) => {
		return settings.includes( unit.value );
	} );
}
