/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind.js';
import type { ExtendedKeyboardEvent } from 'mousetrap';

/**
 * WordPress dependencies
 */
import type { RefObject } from '@wordpress/element';
import { useEffect, useRef } from '@wordpress/element';
import { isAppleOS } from '@wordpress/keycodes';

type KeyboardShortcutConfig = {
	/**
	 * Handle keyboard events anywhere including inside textarea/input fields.
	 */
	bindGlobal: boolean;
	/**
	 * Event name used to trigger the handler, defaults to keydown.
	 */
	eventName: string;
	/**
	 * Disables the keyboard handler if the value is true.
	 */
	isDisabled: boolean;
	/**
	 * React reference to the DOM element used to catch the keyboard event.
	 */
	target: RefObject< HTMLElement >;
};

/**
 * Attach a keyboard shortcut handler.
 *
 * @see https://craig.is/killing/mice#api.bind for information about the `callback` parameter.
 *
 * @param shortcuts          Keyboard Shortcuts.
 * @param callback           Shortcut callback.
 * @param options            Shortcut options.
 * @param options.bindGlobal
 * @param options.eventName
 * @param options.isDisabled
 * @param options.target
 */
function useKeyboardShortcut(
	shortcuts: string[] | string,
	callback: ( e: ExtendedKeyboardEvent, combo: string ) => void,
	{
		bindGlobal = false,
		eventName = 'keydown',
		isDisabled = false,
		target,
	}: Partial< KeyboardShortcutConfig > = {}
) {
	const currentCallbackRef = useRef( callback );

	useEffect( () => {
		currentCallbackRef.current = callback;
	}, [ callback ] );

	useEffect( () => {
		if ( isDisabled ) {
			return;
		}

		const mousetrap = new Mousetrap(
			target && target.current
				? target.current
				: // We were passing `document` here previously, so to successfully cast it to Element we must cast it first to `unknown`.
				  // Not sure if this is a mistake but it was the behavior previous to the addition of types so we're just doing what's
				  // necessary to maintain the existing behavior.
				  ( document as unknown as Element )
		);

		const shortcutsArray = Array.isArray( shortcuts )
			? shortcuts
			: [ shortcuts ];

		shortcutsArray.forEach( ( shortcut: string ) => {
			const keys = shortcut.split( '+' );
			const modifiers = new Set(
				keys.filter( ( value ) => value.length > 1 )
			);
			const hasAlt = modifiers.has( 'alt' );
			const hasShift = modifiers.has( 'shift' );

			if (
				isAppleOS() &&
				( ( modifiers.size === 1 && hasAlt ) ||
					( modifiers.size === 2 && hasAlt && hasShift ) )
			) {
				throw new Error(
					`Cannot bind ${ shortcut }. Alt and Shift+Alt modifiers are reserved for character input.`
				);
			}

			const bindFn = bindGlobal ? 'bindGlobal' : 'bind';
			// `@ts-expect-error` Mousetrap typings don’t include `bindGlobal`
			// It exists at runtime via the plugin
			// `any` is used here to allow dynamic access via `bindFn`
			( mousetrap as any )[ bindFn ](
				shortcut,
				( ...args: [ Mousetrap.ExtendedKeyboardEvent, string ] ) =>
					currentCallbackRef.current( ...args ),
				eventName
			);
		} );

		return () => {
			mousetrap.reset();
		};
	}, [ shortcuts, bindGlobal, eventName, target, isDisabled ] );
}

export default useKeyboardShortcut;
