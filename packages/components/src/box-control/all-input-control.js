/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS, getAllValue, isValuesMixed, isValuesDefined } from './utils';

export default function AllInputControl( {
	onChange = noop,
	onFocus = noop,
	onHoverOn = noop,
	onHoverOff = noop,
	values,
	sides,
	...props
} ) {
	const allValue = getAllValue( values );
	const hasValues = isValuesDefined( values );
	const isMixed = hasValues && isValuesMixed( values );

	const allPlaceholder = isMixed ? LABELS.mixed : null;

	const handleOnFocus = ( event ) => {
		onFocus( event, { side: 'all' } );
	};

	const handleOnChange = ( next ) => {
		const nextValues = { ...values };

		if ( sides?.length ) {
			sides.forEach( ( side ) => {
				if ( side === 'vertical' ) {
					nextValues.top = next;
					nextValues.bottom = next;
				} else if ( side === 'horizontal' ) {
					nextValues.left = next;
					nextValues.right = next;
				} else {
					nextValues[ side ] = next;
				}
			} );
		} else {
			[ 'top', 'right', 'bottom', 'left' ].forEach(
				( side ) => ( nextValues[ side ] = next )
			);
		}

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
			disableUnits={ isMixed }
			isOnly
			value={ allValue }
			onChange={ handleOnChange }
			onFocus={ handleOnFocus }
			onHoverOn={ handleOnHoverOn }
			onHoverOff={ handleOnHoverOff }
			placeholder={ allPlaceholder }
			round={ false }
		/>
	);
}
