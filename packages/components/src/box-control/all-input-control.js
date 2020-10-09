/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS, isValuesMixed, isValuesDefined } from './utils';

export default function AllInputControl( {
	onChange = noop,
	onFocus = noop,
	onHoverOn = noop,
	onHoverOff = noop,
	values,
	...props
} ) {
	const allValues = Object.values( values );
	const [ singleValue ] = allValues.slice( 0, 1 );
	const hasValues = isValuesDefined( values );
	const isMixed = hasValues && isValuesMixed( values );
	const disableUnits = isMixed || singleValue?.match( /^(auto|calc)/ );

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
			disableUnits={ disableUnits }
			isOnly
			value={ ! isMixed && singleValue }
			onChange={ handleOnChange }
			onFocus={ handleOnFocus }
			onHoverOn={ handleOnHoverOn }
			onHoverOff={ handleOnHoverOff }
			placeholder={ allPlaceholder }
		/>
	);
}
