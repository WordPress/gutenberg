/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getAllValue, hasMixedValues, hasDefinedValues } from './utils';

export default function AllInputControl( { onChange, values, ...props } ) {
	const allValue = getAllValue( values );
	const hasValues = hasDefinedValues( values );
	const isMixed = hasValues && hasMixedValues( values );
	const allPlaceholder = isMixed ? __( 'Mixed' ) : null;

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
