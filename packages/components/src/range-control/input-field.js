/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { ENTER } from '@wordpress/keycodes';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputNumber } from './styles/range-control-styles';

export default function InputField( {
	label,
	onBlur = noop,
	onChange = noop,
	onReset = noop,
	onKeyDown = noop,
	value: valueProp,
	...props
} ) {
	/**
	 * This component stores an internal (input) value state, derived from
	 * the incoming value prop.
	 *
	 * This allows for the <input /> to be updated independently before the
	 * value is applied and propagated. This independent updating action is
	 * necessary to accommodate individual keystroke values that may not
	 * be considered "valid" (e.g. within the min - max range).
	 */
	const [ value, setValue ] = useState( valueProp );

	/**
	 * Syncs incoming value (prop) within internal state.
	 */
	useEffect( () => {
		if ( ! isNaN( valueProp ) ) {
			setValue( ( prev ) => {
				return valueProp !== prev ? valueProp : prev;
			} );
		}
	}, [ valueProp ] );

	const handleOnReset = ( event ) => {
		onReset( event );
		setValue( '' );
	};

	const handleOnCommit = ( event ) => {
		const nextValue = parseFloat( event.target.value );

		if ( isNaN( nextValue ) ) {
			handleOnReset();
			return;
		}

		setValue( nextValue );
		onChange( nextValue );
	};

	const handleOnBlur = ( event ) => {
		onBlur( event );
		handleOnCommit( event );
	};

	const handleOnChange = ( next, { event } ) => {
		/**
		 * Update internal state. This allows for `InputNumber` to store
		 * values before a valid "commit". Example for these cases my include
		 * users typing in larger numbers, such as "123" (which would be parsed
		 * one character at a time).
		 */
		setValue( next );

		const nextValue = parseFloat( next );

		/**
		 * Only commit values if the value is a number.
		 * This prevents committing values such as "" (empty string), which
		 * occurs when the input is cleared.
		 */
		if ( isNaN( nextValue ) ) return;

		/**
		 * Prevent submitting if changes are invalid.
		 * This only applies to values being entered via KEY_DOWN.
		 *
		 * Pressing the up/down arrows of the HTML input also triggers a
		 * change event. However, those values will be (pre)validated by the
		 * HTML input.
		 */
		if ( event.target.checkValidity && ! event.target.checkValidity() ) {
			return;
		}

		/**
		 * We're passing in the next value in the shape of an event, as
		 * that is what the handleOnCommit callback expects.
		 *
		 * We have to use the "next" value (provided by `InputNumber`) as
		 * it my vary from the value from the input in the DOM. This occurs
		 * if the value is adjusted by enhanced mechanics such as "step" jumping
		 * or dragging to update.
		 */
		handleOnCommit( { target: { value: nextValue } } );
	};

	const handleOnKeyDown = ( event ) => {
		const { keyCode } = event;
		onKeyDown( event );

		if ( keyCode === ENTER ) {
			event.preventDefault();
			handleOnCommit( event );
		}
	};

	return (
		<InputNumber
			aria-label={ label }
			className="components-range-control__number"
			inputMode="decimal"
			onBlur={ handleOnBlur }
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
			type="number"
			value={ value }
			{ ...props }
		/>
	);
}
