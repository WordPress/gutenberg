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
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../visually-hidden';
import {
	Container,
	Fieldset,
	Input,
	Label as BaseLabel,
	Legend,
	LegendText,
	Root,
	Suffix,
} from './styles/input-control-styles';
import { useValueState, isValueEmpty } from './utils';

function useUniqueId( idProp ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

export function InputControl(
	{
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
		onKeyDown = noop,
		size = 'default',
		suffix,
		transformValueOnChange = ( value ) => value,
		value: valueProp,
		...props
	},
	ref
) {
	const [ isFocused, setIsFocused ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ value, setValue ] = useValueState( valueProp );

	const id = useUniqueId( idProp );
	const classes = classNames( 'components-input-control', className );

	const handleOnBlur = ( event ) => {
		const _forceUpdate = true;

		onBlur( event );
		setIsFocused( false );

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
		setIsFocused( true );
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
	};

	const handleOnKeyDown = ( event ) => {
		const _forceUpdate = true;
		onKeyDown( event );

		if ( isPressEnterToChange && event.keyCode === ENTER ) {
			event.preventDefault();
			handleOnChange( event, _forceUpdate );
		}
	};

	const isFilled = ! isValueEmpty( value );
	const isFloating = isFloatingLabel ? isFilled || isFocused : false;
	const isFloatingLabelSet =
		! hideLabelFromVision && isFloatingLabel && label;

	return (
		<Root className={ classes } isFloatingLabel={ isFloatingLabelSet }>
			{ label && (
				<Label
					as="label"
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
			) }
			<Container
				className="components-input-control__container"
				isFocused={ isFocused }
			>
				<Input
					{ ...props }
					className="components-input-control__input"
					disabled={ disabled }
					id={ id }
					isFilled={ isFilled }
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
				{ suffix && (
					<Suffix className="components-input-control__suffix">
						{ suffix }
					</Suffix>
				) }
				<Fieldset
					aria-hidden="true"
					className="components-input-control__fieldset"
					isFloatingLabel={ isFloatingLabelSet }
					isFocused={ isFocused }
				>
					{ isFloatingLabelSet && (
						<Legend
							aria-hidden="true"
							className="components-input-control__fieldset-label"
							isFloating={ isFloating }
							size={ size }
						>
							<LegendText className="components-input-control__fieldset-text">
								{ label }
							</LegendText>
						</Legend>
					) }
				</Fieldset>
				{ children }
			</Container>
		</Root>
	);
}

function Label( { children, hideLabelFromVision, htmlFor, ...props } ) {
	if ( hideLabelFromVision ) {
		return (
			<VisuallyHidden as="label" htmlFor={ htmlFor }>
				{ children }
			</VisuallyHidden>
		);
	}

	return (
		<BaseLabel htmlFor={ htmlFor } { ...props }>
			{ children }
		</BaseLabel>
	);
}

export default forwardRef( InputControl );
