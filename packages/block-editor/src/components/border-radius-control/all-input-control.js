/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getAllValue,
	getAllUnit,
	hasMixedValues,
	hasDefinedValues,
} from './utils';

export default function AllInputControl( {
	onChange,
	selectedUnits,
	setSelectedUnits,
	values,
	...props
} ) {
	let allValue = getAllValue( values );

	if ( allValue === undefined ) {
		// If we don't have any value set the unit to any current selection
		// or the most common unit from the individual radii values.
		allValue = getAllUnit( selectedUnits );
	}

	const hasValues = hasDefinedValues( values );
	const isMixed = hasValues && hasMixedValues( values );
	const allPlaceholder = isMixed ? __( 'Mixed' ) : null;

	// Filter out CSS-unit-only values to prevent invalid styles.
	const handleOnChange = ( next ) => {
		const isNumeric = ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;
		onChange( nextValue );
	};

	// Store current unit selection for use as fallback for individual
	// radii controls.
	const handleOnUnitChange = ( unit ) => {
		setSelectedUnits( {
			topLeft: unit,
			topRight: unit,
			bottomLeft: unit,
			bottomRight: unit,
		} );
	};

	return (
		<UnitControl
			{ ...props }
			aria-label={ __( 'Border radius' ) }
			disableUnits={ isMixed }
			isOnly
			value={ allValue }
			onChange={ handleOnChange }
			onUnitChange={ handleOnUnitChange }
			placeholder={ allPlaceholder }
			size="__unstable-large"
		/>
	);
}
