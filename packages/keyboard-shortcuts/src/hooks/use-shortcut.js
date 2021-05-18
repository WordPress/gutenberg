/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	useKeyboardShortcut,
	__unstableUseKeyboardShortcutRef as useKeyboardShortcutRef,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as keyboardShortcutsStore } from '../store';

function useShortcuts( name ) {
	return useSelect(
		( select ) => {
			return select(
				keyboardShortcutsStore
			).getAllShortcutRawKeyCombinations( name );
		},
		[ name ]
	);
}

/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string}   name     Shortcut name.
 * @param {Function} callback Shortcut callback.
 */
export function useShortcutRef( name, callback ) {
	return useKeyboardShortcutRef( useShortcuts( name ), callback );
}

/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string}   name     Shortcut name.
 * @param {Function} callback Shortcut callback.
 * @param {Object}   options  Shortcut options.
 */
function useShortcut( name, callback, options ) {
	useKeyboardShortcut( useShortcuts( name ), callback, options );
}

export default useShortcut;
