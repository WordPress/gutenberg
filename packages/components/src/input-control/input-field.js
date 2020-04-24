/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, forwardRef } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import { useValueState, isValueEmpty } from './utils';
import { Input } from './styles/input-control-styles';

function InputField(
	{
		disabled,
		id,
		isPressEnterToChange,
		isFloating,
		isFloatingLabelSet,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onKeyDown = noop,
		onUpdateValue,
		size = 'default',
		transformValueOnChange = ( value ) => value,
		value: valueProp,
		...props
	},
	ref
) {
	const [ isDirty, setIsDirty ] = useState( false );
	const [ value, setValue ] = useValueState( valueProp );

	const handleOnBlur = ( event ) => {
		const _forceUpdate = true;

		onBlur( event );

		/**
		 * If isPressEnterToChange is set, this submits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && ! isValueEmpty( value ) && isDirty ) {
			handleOnChange( event, _forceUpdate );
		}
	};

	const handleOnFocus = ( event ) => {
		onFocus( event );
	};

	const handleOnChange = ( event, _forceUpdate ) => {
		const nextValue = event.target.value;

		if ( ! isPressEnterToChange || _forceUpdate ) {
			const transformedValue = transformValueOnChange( nextValue );
			setValue( transformedValue );

			onChange( nextValue, { event } );
			setIsDirty( false );
		} else {
			setValue( nextValue );
			setIsDirty( true );
		}
		onUpdateValue( ! isValueEmpty( nextValue ) );
	};

	const handleOnKeyDown = ( event ) => {
		const _forceUpdate = true;
		onKeyDown( event );

		if ( isPressEnterToChange && event.keyCode === ENTER ) {
			event.preventDefault();
			handleOnChange( event, _forceUpdate );
		}
	};

	return (
		<Input
			{ ...props }
			className="components-input-control__input"
			disabled={ disabled }
			id={ id }
			isFloating={ isFloating }
			isFloatingLabel={ isFloatingLabelSet }
			onBlur={ handleOnBlur }
			onChange={ handleOnChange }
			onFocus={ handleOnFocus }
			onKeyDown={ handleOnKeyDown }
			ref={ ref }
			size={ size }
			value={ value }
		/>
	);
}

const ForwardedComponent = forwardRef( InputField );

export default ForwardedComponent;
