/**
 * WordPress dependencies
 */
import { useContext, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useShortcutEventMatch from './use-shortcut-event-match';
import { context } from '../context';

/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string}   name               Shortcut name.
 * @param {Function} callback           Shortcut callback.
 * @param {Object}   options            Shortcut options.
 * @param {boolean}  options.isDisabled Whether to disable to shortut.
 * @param {Object}   options.scope      Optional scope reference.
 */
export default function useShortcut(
	name,
	callback,
	{ isDisabled = false, scope } = {}
) {
	const shortcuts = useContext( context );
	const isMatch = useShortcutEventMatch();
	const callbackRef = useRef();

	useEffect( () => {
		callbackRef.current = callback;
	}, [ callback ] );

	useEffect( () => {
		if ( isDisabled ) {
			return;
		}

		function _callback( event ) {
			if ( isMatch( name, event ) ) {
				callbackRef.current( event );
			}
		}

		const scopeElement = scope?.current;
		shortcuts.add( _callback, scopeElement );
		return () => {
			shortcuts.delete( _callback, scopeElement );
		};
	}, [ name, isDisabled, shortcuts ] );
}
