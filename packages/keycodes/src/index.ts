/**
 * Note: The order of the modifier keys in many of the [foo]Shortcut()
 * functions in this file are intentional and should not be changed. They're
 * designed to fit with the standard menu keyboard shortcuts shown in the
 * user's platform.
 *
 * For example, on MacOS menu shortcuts will place Shift before Command, but
 * on Windows Control will usually come first. So don't provide your own
 * shortcut combos directly to keyboardShortcut().
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isAppleOS } from './platform';

/**
 * External dependencies
 */
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export type WPModifierPart =
	| typeof ALT
	| typeof CTRL
	| typeof COMMAND
	| typeof SHIFT;

export type WPKeycodeModifier =
	| 'primary'
	| 'primaryShift'
	| 'primaryAlt'
	| 'secondary'
	| 'access'
	| 'ctrl'
	| 'alt'
	| 'ctrlShift'
	| 'shift'
	| 'shiftAlt'
	| 'undefined';

/**
 * An object of handler functions for each of the possible modifier
 * combinations. A handler will return a value for a given key.
 */
export type WPModifierHandler< T > = Record< WPKeycodeModifier, T >;

export type WPKeyHandler< T > = (
	character: string,
	isApple?: () => boolean
) => T;

export type WPEventKeyHandler = (
	event: ReactKeyboardEvent< HTMLElement > | KeyboardEvent,
	character: string,
	isApple?: () => boolean
) => boolean;

export type WPModifier = ( isApple: () => boolean ) => WPModifierPart[];

/**
 * Keycode for BACKSPACE key.
 */
export const BACKSPACE = 8;

/**
 * Keycode for TAB key.
 */
export const TAB = 9;

/**
 * Keycode for ENTER key.
 */
export const ENTER = 13;

/**
 * Keycode for ESCAPE key.
 */
export const ESCAPE = 27;

/**
 * Keycode for SPACE key.
 */
export const SPACE = 32;

/**
 * Keycode for PAGEUP key.
 */
export const PAGEUP = 33;

/**
 * Keycode for PAGEDOWN key.
 */
export const PAGEDOWN = 34;

/**
 * Keycode for END key.
 */
export const END = 35;

/**
 * Keycode for HOME key.
 */
export const HOME = 36;

/**
 * Keycode for LEFT key.
 */
export const LEFT = 37;

/**
 * Keycode for UP key.
 */
export const UP = 38;

/**
 * Keycode for RIGHT key.
 */
export const RIGHT = 39;

/**
 * Keycode for DOWN key.
 */
export const DOWN = 40;

/**
 * Keycode for DELETE key.
 */
export const DELETE = 46;

/**
 * Keycode for F10 key.
 */
export const F10 = 121;

/**
 * Keycode for ALT key.
 */
export const ALT = 'alt';

/**
 * Keycode for CTRL key.
 */
export const CTRL = 'ctrl';

/**
 * Keycode for COMMAND/META key.
 */
export const COMMAND = 'meta';

/**
 * Keycode for SHIFT key.
 */
export const SHIFT = 'shift';

/**
 * Keycode for ZERO key.
 */
export const ZERO = 48;

export { isAppleOS };

/**
 * Capitalise the first character of a string.
 * @param string String to capitalise.
 * @return Capitalised string.
 */
function capitaliseFirstCharacter( string: string ): string {
	return string.length < 2
		? string.toUpperCase()
		: string.charAt( 0 ).toUpperCase() + string.slice( 1 );
}

/**
 * Map the values of an object with a specified callback and return the result object.
 *
 * @template T The object type
 * @template R The return type of the mapping function
 *
 * @param    object Object to map values of.
 * @param    mapFn  Mapping function to apply to each value.
 * @return Object with the same keys and transformed values.
 */
function mapValues< T extends Record< string, any >, R >(
	object: T,
	mapFn: ( value: T[ keyof T ] ) => R
): Record< keyof T, R > {
	return Object.fromEntries(
		Object.entries( object ).map( ( [ key, value ] ) => [
			key,
			mapFn( value ),
		] )
	) as Record< keyof T, R >;
}

/**
 * Object that contains functions that return the available modifier
 * depending on platform.
 */
export const modifiers: WPModifierHandler< WPModifier > = {
	primary: ( _isApple ) => ( _isApple() ? [ COMMAND ] : [ CTRL ] ),
	primaryShift: ( _isApple ) =>
		_isApple() ? [ SHIFT, COMMAND ] : [ CTRL, SHIFT ],
	primaryAlt: ( _isApple ) =>
		_isApple() ? [ ALT, COMMAND ] : [ CTRL, ALT ],
	secondary: ( _isApple ) =>
		_isApple() ? [ SHIFT, ALT, COMMAND ] : [ CTRL, SHIFT, ALT ],
	access: ( _isApple ) => ( _isApple() ? [ CTRL, ALT ] : [ SHIFT, ALT ] ),
	ctrl: () => [ CTRL ],
	alt: () => [ ALT ],
	ctrlShift: () => [ CTRL, SHIFT ],
	shift: () => [ SHIFT ],
	shiftAlt: () => [ SHIFT, ALT ],
	undefined: () => [],
};

/**
 * An object that contains functions to get raw shortcuts.
 *
 * These are intended for user with the KeyboardShortcuts.
 *
 * @example
 * ```js
 * // Assuming macOS:
 * rawShortcut.primary( 'm' )
 * // "meta+m"
 * ```
 */
export const rawShortcut: WPModifierHandler< WPKeyHandler< string > > =
	/* @__PURE__ */
	mapValues( modifiers, ( modifier: WPModifier ) => {
		return ( character: string, _isApple = isAppleOS ) => {
			return [ ...modifier( _isApple ), character.toLowerCase() ].join(
				'+'
			);
		};
	} );

/**
 * An object that contains functions to get shortcuts in a format compatible
 * with the [`aria-keyshortcuts` HTML attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts).
 *
 * **Note**: The provided shortcut character strings (ie. not the modifiers) should follow
 * the values specified in the [UI Events KeyboardEvent key Values spec](https://www.w3.org/TR/uievents-key/) — for example, "Enter", "Tab", "ArrowRight", "PageDown",
 * "Escape", "Plus", or "F1". The spacebar key should be represented with the
 * "Space" string (an exception to the UI Events KeyboardEvent key Values spec).
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts
 * @see https://www.w3.org/TR/uievents-key/
 *
 * @example
 * ```js
 * // Assuming macOS:
 * ariaKeyShortcut.primary( 'm' )
 * // "Meta+M"
 *
 * ariaKeyShortcut.primaryAlt( 'm' )
 * // "Meta+Alt+M"
 *
 * // Assuming Windows:
 * ariaKeyShortcut.primary( 'm' )
 * // "Control+M"
 *
 * ariaKeyShortcut.primaryAlt( 'm' )
 * // "Control+Alt+M"
 *
 * ariaKeyShortcut.primaryShift( 'del' )
 * // "Control+Shift+Delete"
 * ```
 */
export const ariaKeyShortcut: WPModifierHandler< WPKeyHandler< string > > =
	/* @__PURE__ */
	mapValues( modifiers, ( modifier: WPModifier ) => {
		return ( character: string, _isApple = isAppleOS ) => {
			return [
				...modifier( _isApple )
					// Swap 'ctrl' for 'control' (spec-compliant)
					.map( ( key ) => ( key === CTRL ? 'Control' : key ) )
					.map( ( key ) => capitaliseFirstCharacter( key ) ),
				capitaliseFirstCharacter( character ),
			].join( '+' );
		};
	} );

/**
 * Return an array of the parts of a keyboard shortcut chord for display.
 *
 * @example
 * ```js
 * // Assuming macOS:
 * displayShortcutList.primary( 'm' );
 * // [ "⌘", "M" ]
 * ```
 *
 * Keyed map of functions to shortcut sequences.
 */
export const displayShortcutList: WPModifierHandler<
	WPKeyHandler< string[] >
> =
	/* @__PURE__ */
	mapValues(
		modifiers,
		( modifier: WPModifier ): WPKeyHandler< string[] > => {
			return ( character: string, _isApple = isAppleOS ) => {
				const isApple = _isApple();
				const replacementKeyMap = {
					[ ALT ]: isApple ? '⌥' : 'Alt',
					[ CTRL ]: isApple ? '⌃' : 'Ctrl', // Make sure ⌃ is the U+2303 UP ARROWHEAD unicode character and not the caret character.
					[ COMMAND ]: '⌘',
					[ SHIFT ]: isApple ? '⇧' : 'Shift',
				};

				const modifierKeys = modifier( _isApple ).reduce< string[] >(
					( accumulator, key ) => {
						const replacementKey = replacementKeyMap[ key ] ?? key;
						// If on the Mac, adhere to platform convention and don't show plus between keys.
						if ( isApple ) {
							return [ ...accumulator, replacementKey ];
						}

						return [ ...accumulator, replacementKey, '+' ];
					},
					[]
				);

				return [
					...modifierKeys,
					capitaliseFirstCharacter( character ),
				];
			};
		}
	);

/**
 * An object that contains functions to display shortcuts.
 *
 * @example
 * ```js
 * // Assuming macOS:
 * displayShortcut.primary( 'm' );
 * // "⌘M"
 * ```
 *
 * Keyed map of functions to display shortcuts.
 */
export const displayShortcut: WPModifierHandler< WPKeyHandler< string > > =
	/* @__PURE__ */
	mapValues(
		displayShortcutList,
		( shortcutList: WPKeyHandler< string[] > ): WPKeyHandler< string > => {
			return ( character: string, _isApple = isAppleOS ) =>
				shortcutList( character, _isApple ).join( '' );
		}
	);

/**
 * An object that contains functions to return an aria label for a keyboard
 * shortcut.
 *
 * @example
 * ```js
 * // Assuming macOS:
 * shortcutAriaLabel.primary( '.' );
 * // "Command + Period"
 * ```
 *
 * Keyed map of functions to shortcut ARIA labels.
 */
export const shortcutAriaLabel: WPModifierHandler< WPKeyHandler< string > > =
	/* @__PURE__ */
	mapValues( modifiers, ( modifier: WPModifier ): WPKeyHandler< string > => {
		return ( character: string, _isApple = isAppleOS ) => {
			const isApple = _isApple();
			const replacementKeyMap: Record< string, string > = {
				[ SHIFT ]: 'Shift',
				[ COMMAND ]: isApple ? 'Command' : 'Control',
				[ CTRL ]: 'Control',
				[ ALT ]: isApple ? 'Option' : 'Alt',
				/* translators: comma as in the character ',' */
				',': __( 'Comma' ),
				/* translators: period as in the character '.' */
				'.': __( 'Period' ),
				/* translators: backtick as in the character '`' */
				'`': __( 'Backtick' ),
				/* translators: tilde as in the character '~' */
				'~': __( 'Tilde' ),
			};

			return [ ...modifier( _isApple ), character ]
				.map( ( key ) =>
					capitaliseFirstCharacter( replacementKeyMap[ key ] ?? key )
				)
				.join( isApple ? ' ' : ' + ' );
		};
	} );

/**
 * From a given KeyboardEvent, returns an array of active modifier constants for
 * the event.
 *
 * @param event Keyboard event.
 *
 * @return Active modifier constants.
 */
function getEventModifiers(
	event: ReactKeyboardEvent< HTMLElement > | KeyboardEvent
): WPModifierPart[] {
	return ( [ ALT, CTRL, COMMAND, SHIFT ] as const ).filter(
		( key ) =>
			( event as KeyboardEvent )[
				`${ key }Key` as 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'
			]
	);
}

/**
 * An object that contains functions to check if a keyboard event matches a
 * predefined shortcut combination.
 *
 * @example
 * ```js
 * // Assuming an event for ⌘M key press:
 * isKeyboardEvent.primary( event, 'm' );
 * // true
 * ```
 *
 * Keyed map of functions to match events.
 */
export const isKeyboardEvent: WPModifierHandler< WPEventKeyHandler > =
	/* @__PURE__ */
	mapValues( modifiers, ( getModifiers: WPModifier ): WPEventKeyHandler => {
		return ( event, character, _isApple = isAppleOS ) => {
			const mods = getModifiers( _isApple );
			const eventMods = getEventModifiers( event );

			const replacementWithShiftKeyMap: Record< string, string > = {
				Comma: ',',
				Backslash: '\\',
				// Windows returns `\` for both IntlRo and IntlYen.
				IntlRo: '\\',
				IntlYen: '\\',
			};

			const modsDiff = mods.filter(
				( mod ) => ! eventMods.includes( mod )
			);
			const eventModsDiff = eventMods.filter(
				( mod ) => ! mods.includes( mod )
			);

			if ( modsDiff.length > 0 || eventModsDiff.length > 0 ) {
				return false;
			}

			let key = event.key.toLowerCase();

			if ( ! character ) {
				return mods.includes( key as WPModifierPart );
			}

			if ( event.altKey && character.length === 1 ) {
				key = String.fromCharCode( event.keyCode ).toLowerCase();
			}

			// `event.key` returns the value of the key pressed, taking into the state of
			// modifier keys such as `Shift`. If the shift key is pressed, a different
			// value may be returned depending on the keyboard layout. It is necessary to
			// convert to the physical key value that don't take into account keyboard
			// layout or modifier key state.
			if (
				event.shiftKey &&
				character.length === 1 &&
				replacementWithShiftKeyMap[ event.code ]
			) {
				key = replacementWithShiftKeyMap[ event.code ];
			}

			// For backwards compatibility.
			if ( character === 'del' ) {
				character = 'delete';
			}

			return key === character.toLowerCase();
		};
	} );
