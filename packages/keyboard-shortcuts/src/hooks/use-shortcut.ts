/**
 * WordPress dependencies
 */
import { useContext, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useShortcutEventMatch from './use-shortcut-event-match';
import { context } from '../context';

interface UseShortcutOptions {
	isDisabled?: boolean;
}

/**
 * Attach a keyboard shortcut handler.
 *
 * @param name               Shortcut name.
 * @param callback           Shortcut callback.
 * @param options            Shortcut options.
 * @param options.isDisabled Whether to disable the shortcut.
 */
export default function useShortcut(
	name: string,
	callback: ( event: KeyboardEvent ) => void,
	{ isDisabled = false }: UseShortcutOptions = {}
) {
	const shortcuts = useContext( context );
	const isMatch = useShortcutEventMatch();
	const callbackRef = useRef< ( event: KeyboardEvent ) => void >();

	useEffect( () => {
		callbackRef.current = callback;
	}, [ callback ] );

	useEffect( () => {
		if ( isDisabled ) {
			return;
		}

		function _callback( event: KeyboardEvent ) {
			if ( isMatch( name, event ) && callbackRef.current ) {
				callbackRef.current( event );
			}
		}

		shortcuts.add( _callback );
		return () => {
			shortcuts.delete( _callback );
		};
	}, [ name, isDisabled, shortcuts, isMatch ] );
}
