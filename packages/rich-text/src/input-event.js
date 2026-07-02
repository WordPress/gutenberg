/**
 * WordPress dependencies
 */
import { useEffect, useContext, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { inputEventContext } from './contexts';

export function RichTextInputEvent( { inputType, onInput } ) {
	const callbacks = useContext( inputEventContext );

	// Keep the latest `onInput` in a ref so the registered callback can call it
	// without re-running the registration effect on every render.
	const onInputRef = useRef( onInput );
	useEffect( () => {
		onInputRef.current = onInput;
	} );

	useEffect( () => {
		const inputCallbacks = callbacks.current;
		function callback( event ) {
			if ( event.inputType === inputType ) {
				onInputRef.current();
				event.preventDefault();
			}
		}

		inputCallbacks.add( callback );
		return () => {
			inputCallbacks.delete( callback );
		};
	}, [ inputType, callbacks ] );

	return null;
}
