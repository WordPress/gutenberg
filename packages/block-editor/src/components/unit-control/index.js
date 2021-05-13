/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as BaseUnitControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useCustomUnits } from '../use-custom-units';

export default function UnitControl( { units: unitsProp, ...props } ) {
	const units = useCustomUnits( {
		settingPath: 'spacing.units',
		units: unitsProp,
	} );

	return <BaseUnitControl units={ units } { ...props } />;
}
