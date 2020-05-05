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
import Backdrop from './backdrop';
import InputField from './input-field';
import Label from './label';
import { Container, Root, Suffix } from './styles/input-control-styles';
import { isValueEmpty } from './utils';

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

export function InputControl(
	{
		__unstableStateReducer: stateReducer = ( state ) => state,
		children,
		className,
		disabled = false,
		hideLabelFromVision = false,
		id: idProp,
		isPressEnterToChange = false,
		isFloatingLabel = false,
		label,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onValidate = noop,
		onKeyDown = noop,
		size = 'default',
		suffix,
		value,
		...props
	},
	ref
) {
	const [ isFocused, setIsFocused ] = useState( false );
	const [ isFilled, setIsFilled ] = useState( ! isValueEmpty( value ) );

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

	const isInputFilled = isFilled || ! isValueEmpty( value );

	const isFloating = isFloatingLabel ? isInputFilled || isFocused : false;
	const isFloatingLabelSet =
		! hideLabelFromVision && isFloatingLabel && label;

	return (
		<Root
			className={ classes }
			isFloatingLabel={ isFloatingLabelSet }
			isFocused={ isFocused }
		>
			<Label
				className="components-input-control__label"
				hideLabelFromVision={ hideLabelFromVision }
				htmlFor={ id }
				isFilled={ isFilled }
				isFloating={ isFloating }
				isFloatingLabel={ isFloatingLabel }
				size={ size }
			>
				{ label }
			</Label>
			<Container
				className="components-input-control__container"
				disabled={ disabled }
				isFocused={ isFocused }
			>
				<InputField
					{ ...props }
					className="components-input-control__input"
					disabled={ disabled }
					id={ id }
					isFloating={ isFloating }
					isFloatingLabelSet={ isFloatingLabelSet }
					isPressEnterToChange={ isPressEnterToChange }
					onBlur={ handleOnBlur }
					onChange={ onChange }
					onFocus={ handleOnFocus }
					onKeyDown={ onKeyDown }
					onUpdateValue={ setIsFilled }
					onValidate={ onValidate }
					ref={ ref }
					setIsFocused={ setIsFocused }
					size={ size }
					stateReducer={ stateReducer }
					value={ value }
				/>
				{ suffix && (
					<Suffix className="components-input-control__suffix">
						{ suffix }
					</Suffix>
				) }
				<Backdrop
					aria-hidden="true"
					className="components-input-control__fieldset"
					disabled={ disabled }
					isFloating={ isFloating }
					isFloatingLabel={ isFloatingLabelSet }
					isFocused={ isFocused }
					label={ label }
					size={ size }
				/>
				{ children }
			</Container>
		</Root>
	);
}

export default forwardRef( InputControl );
