/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import { includes, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { useLayoutEffect } from '@wordpress/element';

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
 * @param {string[]|string} shortcuts  Keyboard Shortcuts.
 * @param {Function} callback          Shortcut callback.
 * @param {Object} options             Shortcut options.
 */
function useKeyboardShortcut( shortcuts, callback, {
	bindGlobal = false,
	eventName = 'keydown',
	target,
} = {} ) {
	useLayoutEffect( () => {
		const mousetrap = new Mousetrap( target ? target.current : document );
		castArray( shortcuts ).forEach( ( shortcut ) => {
			const keys = shortcut.split( '+' );
			// Determines whether a key is a modifier by the length of the string.
			// E.g. if I add a pass a shortcut Shift+Cmd+M, it'll determine that
			// the modifiers are Shift and Cmd because they're not a single character.
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
			mousetrap.reset();
		};
	}, [ shortcuts, bindGlobal, eventName, callback, target ] );
}

export default useKeyboardShortcut;
