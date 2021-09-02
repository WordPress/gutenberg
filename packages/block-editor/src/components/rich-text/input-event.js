/**
 * WordPress dependencies
 */
import { useEffect, useContext, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { inputEventContext } from './';

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

		callbacks.add( callback );
		return () => {
			callbacks.delete( callback );
		};
	}, [ inputType ] );

	return null;
}
