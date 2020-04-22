/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as BaseUnitControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useEditorFeature from '../use-editor-feature';

const { __defaultUnits } = BaseUnitControl;

export default function UnitControl( { units: unitsProp, ...props } ) {
	const units = useCustomUnits( unitsProp );

	return <BaseUnitControl units={ units } { ...props } />;
}

// Hoisting statics from the BaseUnitControl
UnitControl.__defaultUnits = __defaultUnits;

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
 * @param {Array} unitsProp Collection of available units.
 *
 * @return {Array} Filtered units based on settings.
 */
export function useCustomUnits( unitsProp ) {
	const settings = useEditorFeature( '__experimentalDisableCustomUnits' );
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

	return units;
}
