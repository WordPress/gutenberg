/**
 * External dependencies
 */
import { compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { rawShortcut } from '@wordpress/keycodes';
import { useMemo } from '@wordpress/element';
import { useKeyboardShortcut } from '@wordpress/compose';

/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string} name       Shortcut name.
 * @param {Function} callback Shortcut callback.
 * @param {Object} options    Shortcut options.
 */
function useShortcut( name, callback, options ) {
	const { combination, aliases } = useSelect( ( select ) => {
		return {
			combination: select( 'core/keyboard-shortcuts' ).getShortcutKeyCombination( name ),
			aliases: select( 'core/keyboard-shortcuts' ).getShortcutAliases( name ),
		};
	}, [ name ] );

	const shortcutKeys = useMemo( () => {
		const shortcuts = compact( [ combination, ...aliases ] );
		return shortcuts.map( ( shortcut ) => {
			return shortcut.modifier ?
				rawShortcut[ shortcut.modifier ]( shortcut.character ) :
				shortcut.character;
		} );
	}, [ combination, aliases ] );

	useKeyboardShortcut( shortcutKeys, callback, options );
}

export default useShortcut;
