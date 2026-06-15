/**
 * WordPress dependencies
 */
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as BaseUnitControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';

export default function UnitControl( { units: unitsProp, ...props } ) {
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ '%', 'px', 'em', 'rem', 'vw' ],
		units: unitsProp,
	} );

	return <BaseUnitControl units={ units } { ...props } />;
}
