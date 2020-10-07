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

		setValue( nextValue );
		onChange( nextValue );
	};

	const handleOnBlur = ( event ) => {
		onBlur( event );
		handleOnCommit( event );
	};

	const handleOnChange = ( next ) => {
		handleOnCommit( { target: { value: next } } );
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
