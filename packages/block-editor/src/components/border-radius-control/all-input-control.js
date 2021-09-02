/**
 * WordPress dependencies
 */
import {
	__experimentalParseUnit as parseUnit,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getAllValue, hasMixedValues, hasDefinedValues } from './utils';

export default function AllInputControl( {
	onChange,
	values,
	defaults,
	...props
} ) {
	const allValue = getAllValue( values );
	const hasValues = hasDefinedValues( values );
	const isMixedValues = hasValues && hasMixedValues( values );

	const [ allDefault ] = parseUnit( getAllValue( defaults ) );
	const isMixedDefaults =
		hasDefinedValues( defaults ) && hasMixedValues( defaults );

	const isMixed = isMixedValues || ( ! hasValues && isMixedDefaults );
	const allPlaceholder = isMixed ? __( 'Mixed' ) : allDefault;

	return (
		<UnitControl
			{ ...props }
			aria-label={ __( 'Border radius' ) }
			disableUnits={ isMixed }
			isOnly
			value={ allValue }
			onChange={ onChange }
			placeholder={ allPlaceholder }
		/>
	);
}
