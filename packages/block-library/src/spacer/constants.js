/**
 * WordPress dependencies
 */
import { useSetting } from '@wordpress/block-editor';
import { __experimentalUseCustomUnits as useCustomUnits } from '@wordpress/components';

const MIN_SPACER_SIZE = 1;
const DEFAULT_UNITS = [ 'px', 'em', 'rem', 'vw', 'vh' ];
export const DEFAULT_VALUES = { px: 100, em: 10, rem: 10, vw: 10, vh: 25 };

/**
 * @param {string}           value   Current value
 * @param {string|string[]=} exclude Unit(s) to exclude
 */
export const useSpacerSettings = ( value, exclude ) => {
	let availableUnitSettings = useSetting( 'spacing.units' ) || undefined;
	if ( exclude && availableUnitSettings )
		availableUnitSettings = availableUnitSettings.filter(
			Array.isArray( exclude )
				? ( availableUnit ) => ! exclude.includes( availableUnit )
				: ( availableUnit ) => availableUnit !== exclude
		);
	/** @type {import('@wordpress/components/src/unit-control/types').WPUnitControlUnit[]} */
	const units = useCustomUnits( {
		availableUnits: availableUnitSettings || DEFAULT_UNITS,
		defaultValues: DEFAULT_VALUES,
	} );

	// Finds the step for the current value’s unit for use as the min value.
	const min =
		units.find( ( { value: unit } ) => value.endsWith( unit ) )?.step ??
		MIN_SPACER_SIZE;

	return { units, min };
};
