import { useEffect, useContext } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import { InputEventContext } from './contexts';
import type { RichTextInputEventProps } from './types';

export function RichTextInputEvent( {
	inputType,
	onInput,
}: RichTextInputEventProps ) {
	const callbacks = useContext( InputEventContext );

	/*
	 * Keep a stable reference to the latest `onInput` so the registered
	 * callback can call it without re-running the registration effect on
	 * every render.
	 */
	const stableOnInput = useEvent( onInput );

	useEffect( () => {
		function callback( event: InputEvent ) {
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
