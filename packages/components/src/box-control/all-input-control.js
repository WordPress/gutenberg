/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS, getAllValue } from './utils';

export default function AllInputControl( {
	onChange = noop,
	onFocus = noop,
	values,
	...props
} ) {
	const allValue = getAllValue( values );
	const isMixed = isNaN( parseFloat( allValue ) );
	const allPlaceholder = isMixed ? LABELS.mixed : null;

	const handleOnFocus = ( event ) => {
		onFocus( event, { side: 'all' } );
	};

	const handleOnChange = ( next ) => {
		const nextValues = { ...values };

		nextValues.top = next;
		nextValues.bottom = next;
		nextValues.left = next;
		nextValues.right = next;

		onChange( nextValues );
	};

	return (
		<UnitControl
			{ ...props }
			disableUnits={ isMixed }
			isOnly
			value={ allValue }
			onChange={ handleOnChange }
			onFocus={ handleOnFocus }
			placeholder={ allPlaceholder }
		/>
	);
}
