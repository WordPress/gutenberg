/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import { includes, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * @template {Element} T
 * @typedef {import('react').MutableRefObject<T>} ElementRef
 */

/**
 * A block selection object.
 *
 * @template {Element} T
 *
 * @typedef {Object} WPKeyboardShortcutConfig
 *
 * @property {boolean}       [bindGlobal] Handle keyboard events anywhere including inside textarea/input fields.
 * @property {string}        [eventName]  Event name used to trigger the handler, defaults to keydown.
 * @property {boolean}       [isDisabled] Disables the keyboard handler if the value is true.
 * @property {ElementRef<T>} [target]     React reference to the DOM element used to catch the keyboard event.
 */

/**
 * Return true if platform is MacOS.
 *
 * @param {Window} _window window object by default; used for DI testing.
 *
 * @return {boolean} True if MacOS; false otherwise.
 */
function isAppleOS( _window = window ) {
	const { platform } = _window.navigator;

	return (
		platform.indexOf( 'Mac' ) !== -1 ||
		includes( [ 'iPad', 'iPhone' ], platform )
	);
}

/**
 * Attach a keyboard shortcut handler.
 *
 * @template {Element} T
 *
 * @param {string[]|string}                           shortcuts Keyboard Shortcuts.
 * @param {(e: KeyboardEvent, combo: string) => void} callback  Shortcut callback.
 * @param {WPKeyboardShortcutConfig<T>}               options   Shortcut options.
 */
function useKeyboardShortcut(
	shortcuts,
	callback,
	{
		bindGlobal = false,
		eventName = 'keydown',
		isDisabled = false, // This is important for performance considerations.
		target,
	} = {}
) {
	const currentCallback = useRef( callback );
	useEffect( () => {
		currentCallback.current = callback;
	}, [ callback ] );

	useEffect( () => {
		if ( isDisabled ) {
			return;
		}
		const mousetrap = new Mousetrap( target ? target.current : undefined );
		castArray( shortcuts ).forEach( ( shortcut ) => {
			const keys = shortcut.split( '+' );
			// Determines whether a key is a modifier by the length of the string.
			// E.g. if I add a pass a shortcut Shift+Cmd+M, it'll determine that
			// the modifiers are Shift and Cmd because they're not a single character.
			const modifiers = new Set(
				keys.filter( ( value ) => value.length > 1 )
			);
			const hasAlt = modifiers.has( 'alt' );
			const hasShift = modifiers.has( 'shift' );

			// This should be better moved to the shortcut registration instead.
			if (
				isAppleOS() &&
				( ( modifiers.size === 1 && hasAlt ) ||
					( modifiers.size === 2 && hasAlt && hasShift ) )
			) {
				throw new Error(
					`Cannot bind ${ shortcut }. Alt and Shift+Alt modifiers are reserved for character input.`
				);
			}

			const bindFn = bindGlobal
				? Mousetrap.bindGlobal.bind( Mousetrap )
				: mousetrap.bind.bind( mousetrap );
			bindFn(
				shortcut,
				( ...args ) => currentCallback.current( ...args ),
				eventName
			);
		} );

		return () => {
			mousetrap.reset();
		};
	}, [ shortcuts, bindGlobal, eventName, target, isDisabled ] );
}

export default useKeyboardShortcut;
