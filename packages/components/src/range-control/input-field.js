/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { useControlledState } from '../utils/hooks';
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
	const [ value, setValue ] = useControlledState( valueProp );

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

		// Only propagate the event if the value is valid.
		if ( event.target.checkValidity && ! event.target.checkValidity() ) {
			// Otherwise... reset to initial value
			setValue( valueProp );
			return;
		}
		onChange( event );
	};

	const handleOnBlur = ( event ) => {
		onBlur( event );
		handleOnCommit( event );
	};

	const handleOnChange = ( nextValue, { event } ) => {
		setValue( nextValue );

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

		handleOnCommit( event );
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
			isDragEnabled={ false }
			onBlur={ handleOnBlur }
			onChange={ handleOnChange }
			onKeyDown={ handleOnKeyDown }
			type="number"
			value={ value }
			{ ...props }
		/>
	);
}
