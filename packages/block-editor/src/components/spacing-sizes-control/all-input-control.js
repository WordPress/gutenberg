/**
 * Internal dependencies
 */
import SpacingInputControl from './spacing-input-control';
import {
	ALL_SIDES,
	getAllRawValue,
	isValuesMixed,
	isValuesDefined,
} from './utils';

export default function AllInputControl( {
	onChange,
	values,
	sides,
	spacingSizes,
	type,
	showCustomValueControl,
} ) {
	const allValue = getAllRawValue( values );
	const hasValues = isValuesDefined( values );
	const isMixed = hasValues && isValuesMixed( values );

	// TODO: This is a duplicate of https://github.com/WordPress/gutenberg/blob/trunk/packages/components/src/box-control/all-input-control.js#L37
	// so ideally this should be exported from the components package and imported here.
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
		const nextValues = applyValueToSides( values, next );

		onChange( nextValues );
	};

	return (
		<SpacingInputControl
			value={ allValue }
			onChange={ handleOnChange }
			side={ 'all' }
			spacingSizes={ spacingSizes }
			isMixed={ isMixed }
			type={ type }
			showAllSidesCustomValueControl={ showCustomValueControl }
		/>
	);
}
