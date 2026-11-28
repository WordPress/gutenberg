import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as BaseUnitControl,
} from '@wordpress/components';
import { useSettings } from '../use-settings';
import type { UnitControlProps } from './types';

export default function UnitControl( {
	units: unitsProp,
	...props
}: UnitControlProps ) {
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		// The setting lists unit names.
		availableUnits: ( availableUnits as string[] | undefined ) || [
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
