/**
 * WordPress dependencies
 */
import { useEffect, useContext, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { inputEventContext } from './';

/* eslint-disable react-hooks/rules-of-hooks */
export function __unstableRichTextInputEvent( { inputType, onInput } ) {
	const callbacks = useContext( inputEventContext );
	const onInputRef = useRef();
	onInputRef.current = onInput;

	useEffect( () => {
		function callback( event ) {
			if ( event.inputType === inputType ) {
				onInputRef.current();
				event.preventDefault();
			}
		}

		callbacks.current.add( callback );
		return () => {
			callbacks.current.delete( callback );
		};
	}, [ inputType ] );

	return null;
}
/* eslint-enable react-hooks/rules-of-hooks */
