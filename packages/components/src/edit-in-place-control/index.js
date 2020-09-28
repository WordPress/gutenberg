/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import { ENTER, ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Button from '../button';

function EditInPlaceControl( { label = '', onClick = noop, onUpdate = noop } ) {
	const [ edit, setEdit ] = useState( false );
	const [ value, setValue ] = useState( label );
	const prevValue = useRef();

	const inputRef = useRef();
	const buttonRef = useRef();

	useEffect( () => {
		prevValue.current = value;
		if ( edit ) {
			inputRef.current.focus();
			inputRef.current.select();
		} else {
			buttonRef.current.focus();
		}
	}, [ edit ] );

	return (
		<>
			{ ! edit && (
				<Button
					ref={ buttonRef }
					className="components-edit-in-place-control__label"
					onClick={ () => {
						setEdit( true );
						onClick();
					} }
				>
					{ value }
				</Button>
			) }
			{ edit && (
				<input
					ref={ inputRef }
					className="components-edit-in-place-control__input"
					value={ value }
					onChange={ ( event ) => {
						setValue( event.target.value );
					} }
					onBlur={ () => {
						setEdit( false );
						onUpdate( value );
					} }
					onKeyDown={ ( event ) => {
						if (
							ENTER === event.keyCode ||
							ESCAPE === event.keyCode
						) {
							event.preventDefault();
							event.stopPropagation();
							if ( ESCAPE === event.keyCode ) {
								setValue( prevValue.current );
							} else {
								setEdit( ! edit );
								onUpdate( value );
							}
						}
					} }
				/>
			) }
		</>
	);
}

export default EditInPlaceControl;
