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
import useSetting from '../use-setting';

export default function UnitControl( { units: unitsProp, ...props } ) {
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
		units: unitsProp,
	} );

	return <BaseUnitControl units={ units } { ...props } />;
}
