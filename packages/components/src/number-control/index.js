/**
 * External dependencies
 */
import { clamp, noop } from 'lodash';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { UP, DOWN } from '@wordpress/keycodes';

export default function NumberControl( {
	className,
	isShiftStepEnabled = true,
	max = Infinity,
	min = -Infinity,
	onChange = noop,
	onKeyDown = noop,
	shiftStep = 10,
	step = 1,
	...props
} ) {
	const baseValue = clamp( 0, min, max );

	const handleOnKeyDown = ( event ) => {
		onKeyDown( event );
		const { value } = event.target;

		const isEmpty = value === '';
		const enableShift = event.shiftKey && isShiftStepEnabled;

		const incrementalValue = enableShift
			? parseFloat( shiftStep )
			: parseFloat( step );
		let nextValue = isEmpty ? baseValue : value;

		// Convert to a number to use math
		nextValue = parseFloat( nextValue );

		switch ( event.keyCode ) {
			case UP:
				event.preventDefault();

				nextValue = nextValue + incrementalValue;
				nextValue = clamp( nextValue, min, max );

				onChange( nextValue.toString(), { event } );

				break;

			case DOWN:
				event.preventDefault();

				nextValue = nextValue - incrementalValue;
				nextValue = clamp( nextValue, min, max );

				onChange( nextValue.toString(), { event } );

				break;
		}
	};

	const handleOnChange = ( event ) => {
		onChange( event.target.value, { event } );
	};

	const classes = classNames( 'component-number-control', className );

	return (
		<input
			inputMode="numeric"
			{ ...props }
			className={ classes }
			type="number"
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
		/>
	);
}
