/**
 * Internal dependencies
 */
import type { UnitControlProps } from '../unit-control/types';
import type { BoxControlInputControlProps } from './types';
import UnitControl from './unit-control';
import {
	LABELS,
	applyValueToSides,
	getAllValue,
	isValuesMixed,
	isValuesDefined,
} from './utils';

const noop = () => {};

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
}: BoxControlInputControlProps ) {
	const allValue = getAllValue( values, selectedUnits, sides );
	const hasValues = isValuesDefined( values );
	const isMixed = hasValues && isValuesMixed( values, selectedUnits, sides );
	const allPlaceholder = isMixed ? LABELS.mixed : undefined;

	const handleOnFocus: React.FocusEventHandler< HTMLInputElement > = (
		event
	) => {
		onFocus( event, { side: 'all' } );
	};

	const handleOnChange: UnitControlProps[ 'onChange' ] = ( next ) => {
		const isNumeric = next !== undefined && ! isNaN( parseFloat( next ) );
		const nextValue = isNumeric ? next : undefined;
		const nextValues = applyValueToSides( values, nextValue, sides );

		onChange( nextValues );
	};

	// Set selected unit so it can be used as fallback by unlinked controls
	// when individual sides do not have a value containing a unit.
	const handleOnUnitChange: UnitControlProps[ 'onUnitChange' ] = ( unit ) => {
		const newUnits = applyValueToSides( selectedUnits, unit, sides );
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
