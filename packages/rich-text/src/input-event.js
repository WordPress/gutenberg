import { useEffect, useContext } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import { InputEventContext } from './contexts';

export function RichTextInputEvent( { inputType, onInput } ) {
	const callbacks = useContext( InputEventContext );

	/*
	 * Keep a stable reference to the latest `onInput` so the registered
	 * callback can call it without re-running the registration effect on
	 * every render.
	 */
	const stableOnInput = useEvent( onInput );

	useEffect( () => {
		function callback( event ) {
			if ( event.inputType === inputType ) {
				stableOnInput();
				event.preventDefault();
			}
		}

		callbacks.add( callback );
		return () => {
			callbacks.delete( callback );
		};
	}, [ inputType, callbacks, stableOnInput ] );

	return null;
}
