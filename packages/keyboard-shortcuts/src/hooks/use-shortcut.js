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
 * @param {boolean}  options.isDisabled Whether to disable to shortcut.
 * @param {Function} options.onKeyUp    An event handler triggered when the shortcut key is released.
 */
export default function useShortcut(
	name,
	callback,
	{ isDisabled, onKeyUp } = {}
) {
	const shortcuts = useContext( context );
	const isMatch = useShortcutEventMatch();
	const shortcutWasDown = useRef();
	const onKeyDownRef = useRef();
	const onKeyUpRef = useRef();
	onKeyDownRef.current = callback;
	onKeyDownRef.current = onKeyUp;

	useEffect( () => {
		if ( isDisabled ) {
			return;
		}

		const shortcut = {
			onKeyDown( event ) {
				if ( isMatch( name, event ) ) {
					shortcutWasDown.current = name;
					onKeyDownRef.current( event );
				}
			},
			onKeyUp( event ) {
				if ( onKeyUpRef.current && shortcutWasDown.current === name ) {
					onKeyUpRef.current( event );
				}
				shortcutWasDown.current = undefined;
			},
		};

		shortcuts.current.add( shortcut );
		return () => {
			shortcuts.current.delete( shortcut );
		};
	}, [ name, isDisabled ] );
}
