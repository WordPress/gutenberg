/**
 * External dependencies
 */
import { noop } from 'lodash';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useState, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InputBase from './input-base';
import InputField from './input-field';

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

export function InputControl(
	{
		__unstableStateReducer: stateReducer = ( state ) => state,
		className,
		disabled = false,
		hideLabelFromVision = false,
		id: idProp,
		isPressEnterToChange = false,
		label,
		labelPosition = 'top',
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onValidate = noop,
		onKeyDown = noop,
		prefix,
		size = 'default',
		suffix,
		value,
		...props
	},
	ref
) {
	const [ isFocused, setIsFocused ] = useState( false );

	const id = useUniqueId( idProp );
	const classes = classNames( 'components-input-control', className );

	const handleOnBlur = ( event ) => {
		onBlur( event );
		setIsFocused( false );
	};

	const handleOnFocus = ( event ) => {
		onFocus( event );
		setIsFocused( true );
	};

	return (
		<InputBase
			className={ classes }
			disabled={ disabled }
			gap={ 3 }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			isFocused={ isFocused }
			justify="left"
			label={ label }
			labelPosition={ labelPosition }
			prefix={ prefix }
			size={ size }
			suffix={ suffix }
		>
			<InputField
				{ ...props }
				className="components-input-control__input"
				disabled={ disabled }
				id={ id }
				isPressEnterToChange={ isPressEnterToChange }
				onBlur={ handleOnBlur }
				onChange={ onChange }
				onFocus={ handleOnFocus }
				onKeyDown={ onKeyDown }
				onValidate={ onValidate }
				ref={ ref }
				setIsFocused={ setIsFocused }
				size={ size }
				stateReducer={ stateReducer }
				value={ value }
			/>
		</InputBase>
	);
}

const ForwardedComponent = forwardRef( InputControl );

export default ForwardedComponent;
