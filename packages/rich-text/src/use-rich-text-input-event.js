/**
 * WordPress dependencies
 */
import { useEffect, useContext } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { InputEventContext } from './events';

/**
 * Calls `onInput` when an `input` event of the given `inputType` occurs
 * within the rich text field, and prevents the default behavior of the event.
 *
 * @param {Object}   props
 * @param {string}   props.inputType The `InputEvent.inputType` to match.
 * @param {Function} props.onInput   Called when the input event occurs.
 */
export function useRichTextInputEvent( { inputType, onInput } ) {
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
}
