/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { rawShortcut } from '@wordpress/keycodes';
import { useEffect } from '@wordpress/element';

/**
 * Return true if platform is MacOS.
 *
 * @param {Object} _window   window object by default; used for DI testing.
 *
 * @return {boolean} True if MacOS; false otherwise.
 */
function isAppleOS( _window = window ) {
	const { platform } = _window.navigator;

	return platform.indexOf( 'Mac' ) !== -1 ||
		includes( [ 'iPad', 'iPhone' ], platform );
}

/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string} name       Shortcut name.
 * @param {Function} callback Shortcut callback.
 * @param {Object} options    Shortcut options.
 */
function useShortcut( name, callback, {
	bindGlobal = false,
	eventName = 'keydown',
	target,
} ) {
	const { combination, aliases } = useSelect( ( select ) => {
		return {
			combination: select( 'core/keyboard-shortcuts' ).getShortcutKeyCombination( name ),
			aliases: select( 'core/keyboard-shortcuts' ).getShortcutAliases( name ),
		};
	}, [ name ] );

	useEffect( () => {
		const shortcuts = [ combination, ...aliases ].filter( Boolean );
		const mousetrap = new Mousetrap( target ? target.current : document );
		const shortcutKeys = shortcuts.map( ( shortcut ) => {
			return shortcut.modifier ?
				rawShortcut[ shortcut.modifier ]( shortcut.character ) :
				shortcut.character;
		} );

		shortcutKeys.forEach( ( shortcut ) => {
			const keys = shortcut.split( '+' );
			const modifiers = new Set( keys.filter( ( value ) => value.length > 1 ) );
			const hasAlt = modifiers.has( 'alt' );
			const hasShift = modifiers.has( 'shift' );

			// This should be better moved to the shortcut registration instead.
			if (
				isAppleOS() && (
					( modifiers.size === 1 && hasAlt ) ||
					( modifiers.size === 2 && hasAlt && hasShift )
				)
			) {
				throw new Error( `Cannot bind ${ shortcut }. Alt and Shift+Alt modifiers are reserved for character input.` );
			}

			const bindFn = bindGlobal ? 'bindGlobal' : 'bind';
			mousetrap[ bindFn ]( shortcut, callback, eventName );
		} );

		return () => {
			shortcutKeys.forEach( ( shortcut ) => {
				mousetrap.unbind( shortcut, eventName );
			} );
		};
	}, [ combination, aliases, bindGlobal, eventName, callback, target ] );
}

export default useShortcut;
