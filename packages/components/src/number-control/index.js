/**
 * External dependencies
 */
import { clamp, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { UP, DOWN } from '@wordpress/keycodes';

export default function NumberControl( {
	enableShiftIncrement = true,
	max = Infinity,
	min = -Infinity,
	onChange = noop,
	onKeyDown = noop,
	shiftIncrement = 10,
	step = 1,
	...props
} ) {
	const baseValue = clamp( 0, min, max );

	const handleOnKeyDown = ( event ) => {
		onKeyDown( event );
		const { value } = event.target;

		const isEmpty = value === '';
		const shiftAmount = step * shiftIncrement;

		let nextValue = isEmpty ? baseValue : value;
		// Convert to a number to use math
		nextValue = parseFloat( nextValue );

		switch ( event.keyCode ) {
			case UP:
				event.preventDefault();

				if ( event.shiftKey && enableShiftIncrement ) {
					nextValue = nextValue + shiftAmount;
				} else {
					nextValue = nextValue + step;
				}

				nextValue = clamp( nextValue, min, max );

				onChange( nextValue.toString() );

				break;

			case DOWN:
				event.preventDefault();

				if ( event.shiftKey && enableShiftIncrement ) {
					nextValue = nextValue - shiftAmount;
				} else {
					nextValue = nextValue - step;
				}

				nextValue = clamp( nextValue, min, max );

				onChange( nextValue.toString() );

				break;
		}
	};

	const handleOnChange = ( event ) => {
		onChange( event.target.value );
	};

	return (
		<input
			{ ...props }
			inputMode="numeric"
			type="number"
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
		/>
	);
}
