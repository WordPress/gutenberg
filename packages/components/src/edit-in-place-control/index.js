/**
 * External dependencies
 */
import { noop, negate, isUndefined } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import Button from '../button';

const baseInputCssClass = 'components-edit-in-place-control__input';
const beforeTransitionInputCssClass = 'small';
const afterTransitionInputCssClass = 'large';
const withoutTransitionCssClass = `${ baseInputCssClass } ${ beforeTransitionInputCssClass }`;
const withTransitionCssClass = `${ baseInputCssClass } ${ afterTransitionInputCssClass }`;
const cancelEvent = ( event ) => (
	event.preventDefault(), event.stopPropagation()
);

function EditInPlaceControl( {
	initialValue = '',
	onClick = noop,
	onUpdate = noop,
	switchToEditModeButtonLabel,
	inputValidator = negate( isUndefined ),
	editNameInputLabel = initialValue,
	onChange = noop,
	onKeyDown = noop,
} ) {
	const [ isEdit, setIsEdit ] = useState( false );
	const [ value, setValue ] = useState( initialValue );
	const [ inputCssClasses, setInputCssClasses ] = useState(
		withoutTransitionCssClass
	);

	const inputRef = useRef();
	const buttonRef = useRef();

	useEffect( () => {
		if ( isEdit ) {
			inputRef.current.focus();
			inputRef.current.select();
		} else {
			buttonRef.current.focus();
		}
	}, [ isEdit ] );

	return (
		<>
			{ isEdit ? (
				<input
					aria-label={ editNameInputLabel }
					ref={ inputRef }
					className={ inputCssClasses }
					value={ value }
					onChange={ ( event ) => {
						const _value = event.target.value;
						setValue( event.target.value );
						onChange( _value, event );
					} }
					onFocus={ () =>
						setInputCssClasses( withTransitionCssClass )
					}
					onBlur={ () => {
						setIsEdit( false );
						onUpdate( value );
						setInputCssClasses( withoutTransitionCssClass );
					} }
					onKeyDown={ ( event ) => {
						if ( 'Enter' === event.key ) {
							cancelEvent( event );
							if ( inputValidator( value ) ) {
								setIsEdit( false );
								onUpdate( value );
							}
						}
						if ( 'Escape' === event.key ) {
							cancelEvent( event );
							setValue( initialValue );
							setIsEdit( false );
							event.target.blur();
						}
						onKeyDown( event );
					} }
				/>
			) : (
				<Button
					aria-label={ switchToEditModeButtonLabel }
					ref={ buttonRef }
					className="components-edit-in-place-control__label"
					onClick={ ( event ) => {
						setIsEdit( true );
						onClick( event );
					} }
				>
					{ value }
				</Button>
			) }
		</>
	);
}

export default EditInPlaceControl;
