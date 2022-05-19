/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import {
	ALL_SIDES,
	LABELS,
	getAllValue,
	isValuesMixed,
	isValuesDefined,
} from './utils';

export default function AllInputControl( {
	onChange = noop,
	onFocus = noop,
	onHoverOn = noop,
	onHoverOff = noop,
	values,
	sides,
	selectedUnits,
	setSelectedUnits,
	...props
} ) {
	const allValue = getAllValue( values, selectedUnits, sides );
	const hasValues = isValuesDefined( values );
	const isMixed = hasValues && isValuesMixed( values, selectedUnits, sides );
	const allPlaceholder = isMixed ? LABELS.mixed : null;

	const handleOnFocus = ( event ) => {
		onFocus( event, { side: 'all' } );
	};

	// Applies a value to an object representing top, right, bottom and left
	// sides while taking into account any custom side configuration.
	const applyValueToSides = ( currentValues, newValue ) => {
		const newValues = { ...currentValues };

		if ( sides?.length ) {
			sides.forEach( ( side ) => {
				if ( side === 'vertical' ) {
					newValues.top = newValue;
					newValues.bottom = newValue;
				} else if ( side === 'horizontal' ) {
					newValues.left = newValue;
					newValues.right = newValue;
				} else {
					newValues[ side ] = newValue;
				}
			} );
		} else {
			ALL_SIDES.forEach( ( side ) => ( newValues[ side ] = newValue ) );
		}

		return newValues;
	};

	const handleOnChange = ( next ) => {
		const isNumeric = ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;
		const nextValues = applyValueToSides( values, nextValue );

		onChange( nextValues );
	};

	// Set selected unit so it can be used as fallback by unlinked controls
	// when individual sides do not have a value containing a unit.
	const handleOnUnitChange = ( unit ) => {
		const newUnits = applyValueToSides( selectedUnits, unit );
		setSelectedUnits( newUnits );
	};

	const handleOnHoverOn = () => {
		onHoverOn( {
			top: true,
			bottom: true,
			left: true,
			right: true,
		} );
	};

	const handleOnHoverOff = () => {
		onHoverOff( {
			top: false,
			bottom: false,
			left: false,
			right: false,
		} );
	};

	return (
		<UnitControl
			{ ...props }
			disableUnits={ isMixed }
			isOnly
			value={ allValue }
			onChange={ handleOnChange }
			onUnitChange={ handleOnUnitChange }
			onFocus={ handleOnFocus }
			onHoverOn={ handleOnHoverOn }
			onHoverOff={ handleOnHoverOff }
			placeholder={ allPlaceholder }
		/>
	);
}
