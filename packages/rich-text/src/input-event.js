/**
 * WordPress dependencies
 */
import { useEffect, useContext } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
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
		const inputCallbacks = callbacks.current;
		function callback( event ) {
			if ( event.inputType === inputType ) {
				stableOnInput();
				event.preventDefault();
			}
		}

		inputCallbacks.add( callback );
		return () => {
			inputCallbacks.delete( callback );
		};
	}, [ inputType, callbacks, stableOnInput ] );

	return null;
}
