/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useEffect,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import useShortcutEventMatch from './use-shortcut-event-match';

export const context = createContext();

/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string}   name     Shortcut name.
 * @param {Function} callback Shortcut callback.
 * @param {Object}   options  Shortcut options.
 */
function useShortcut( name, callback, options ) {
	const shortcuts = useContext( context );
	const isMatch = useShortcutEventMatch();
	const callbackRef = useRef();
	callbackRef.current = callback;

	useEffect( () => {
		if ( options?.isDisabled ) {
			return;
		}

		function _callback( event ) {
			if ( isMatch( name, event ) ) {
				callbackRef.current( event );
			}
		}

		shortcuts.current.add( _callback );
		return () => {
			shortcuts.current.delete( _callback );
		};
	}, [ name ] );
}

export default useShortcut;
