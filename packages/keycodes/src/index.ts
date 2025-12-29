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
 * Map of key names to their `aria-keyshortcuts` compliant equivalents.
 *
 * This includes:
 * - Shorthand key names (e.g., 'del' → 'Delete')
 * - Special characters that need named representations per the spec
 *   (e.g., ' ' → 'Space', '+' → 'Plus')
 * - Named keys from the UI Events KeyboardEvent key Values specification
 *
 * The space key is a special case: per the WAI-ARIA spec, the spacebar
 * should be represented as "Space" (not ' ') since the space character
 * would be treated as whitespace.
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts
 * @see https://www.w3.org/TR/uievents-key/
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts
 */
const ARIA_KEY_SHORTCUT_KEY_MAP: Record< string, string > = {
	/*
	 * Shorthand mappings (lowercase keys for case-insensitive lookup).
	 * These are common abbreviations used in the codebase that need to be
	 * converted to their full KeyboardEvent.key equivalents.
	 */
	del: 'Delete',
	esc: 'Escape',

	/*
	 * Special characters that need named representations.
	 * Per the spec, certain characters must be written out as words.
	 */
	' ': 'Space',
	'+': 'Plus',

	/*
	 * Whitespace keys.
	 * @see https://www.w3.org/TR/uievents-key/#keys-whitespace
	 */
	enter: 'Enter',
	tab: 'Tab',

	/*
	 * Navigation keys.
	 * @see https://www.w3.org/TR/uievents-key/#keys-navigation
	 */
	arrowdown: 'ArrowDown',
	arrowleft: 'ArrowLeft',
	arrowright: 'ArrowRight',
	arrowup: 'ArrowUp',
	end: 'End',
	home: 'Home',
	pagedown: 'PageDown',
	pageup: 'PageUp',

	/*
	 * Editing keys.
	 * @see https://www.w3.org/TR/uievents-key/#keys-editing
	 */
	backspace: 'Backspace',
	clear: 'Clear',
	copy: 'Copy',
	cut: 'Cut',
	delete: 'Delete',
	insert: 'Insert',
	paste: 'Paste',
	redo: 'Redo',
	undo: 'Undo',

	/*
	 * UI keys.
	 * @see https://www.w3.org/TR/uievents-key/#keys-ui
	 */
	escape: 'Escape',
	help: 'Help',
	contextmenu: 'ContextMenu',
	pause: 'Pause',
	printscreen: 'PrintScreen',
	scrolllock: 'ScrollLock',

	/*
	 * Function keys.
	 * @see https://www.w3.org/TR/uievents-key/#keys-function
	 */
	f1: 'F1',
	f2: 'F2',
	f3: 'F3',
	f4: 'F4',
	f5: 'F5',
	f6: 'F6',
	f7: 'F7',
	f8: 'F8',
	f9: 'F9',
	f10: 'F10',
	f11: 'F11',
	f12: 'F12',

	/*
	 * Numpad keys (when NumLock is off, these produce navigation actions).
	 * @see https://www.w3.org/TR/uievents-key/#keys-numpad-section
	 */
	numlock: 'NumLock',
};

/**
 * Map of characters that need HTML entity escaping for use in HTML attributes.
 *
 * Per the WAI-ARIA spec, character values in aria-keyshortcuts should be
 * HTML escaped to prevent issues with special characters in HTML attributes.
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts
 */
const HTML_ENTITY_MAP: Record< string, string > = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
};

/**
 * Escape special HTML characters in a string for use in HTML attributes.
 *
 * @param str The string to escape.
 * @return The escaped string.
 */
function escapeHtmlForAriaShortcut( str: string ): string {
	return str.replace( /[&<>"']/g, ( char ) => HTML_ENTITY_MAP[ char ] );
}

/**
 * Normalize a key for use in the `aria-keyshortcuts` attribute.
 *
 * This function:
 * 1. Converts shorthand key names (like 'del') to their standard
 *    `KeyboardEvent.key` equivalents (like 'Delete')
 * 2. Converts special characters to their named equivalents
 *    (like ' ' to 'Space', '+' to 'Plus')
 * 3. Ensures proper capitalization for character keys
 * 4. HTML-escapes special characters that could cause issues in HTML attributes
 *
 * @param key The key to normalize.
 * @return The normalized and escaped key name.
 */
function normalizeKeyForAriaShortcut( key: string ): string {
	// Check for exact character mappings first (like ' ' for space)
	if ( ARIA_KEY_SHORTCUT_KEY_MAP[ key ] ) {
		return ARIA_KEY_SHORTCUT_KEY_MAP[ key ];
	}

	// Check for case-insensitive shorthand mappings (like 'del', 'esc')
	const lowerKey = key.toLowerCase();
	if ( ARIA_KEY_SHORTCUT_KEY_MAP[ lowerKey ] ) {
		return ARIA_KEY_SHORTCUT_KEY_MAP[ lowerKey ];
	}

	// For single characters, uppercase and escape if needed
	if ( key.length === 1 ) {
		return escapeHtmlForAriaShortcut( key.toUpperCase() );
	}

	// Multi-character keys get capitalized (e.g., 'enter' -> 'Enter')
	return capitaliseFirstCharacter( key );
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
 * Get the aria-keyshortcuts compliant name for a modifier key.
 *
 * Per the WAI-ARIA spec, modifier keys are written as:
 * - "Alt" (on Windows/Linux)
 * - "AltGraph" (Option key on Mac)
 * - "Control"
 * - "Shift"
 * - "Meta" (Command key on Mac)
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts
 *
 * @param key     The internal modifier key constant.
 * @param isApple Whether the current platform is Apple (macOS/iOS).
 * @return The WAI-ARIA compliant modifier key name.
 */
function getAriaShortcutModifierName(
	key: WPModifierPart,
	isApple: boolean
): string {
	switch ( key ) {
		case ALT:
			// On macOS, the Option key is represented as "AltGraph"
			// per the aria-keyshortcuts specification.
			return isApple ? 'AltGraph' : 'Alt';
		case CTRL:
			return 'Control';
		case COMMAND:
			return 'Meta';
		case SHIFT:
			return 'Shift';
		default:
			return key;
	}
}

/**
 * An object that contains functions to get shortcuts in a format compatible
 * with the [`aria-keyshortcuts` HTML attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts).
 *
 * The output follows the WAI-ARIA 1.2 specification:
 * - Modifier keys use standard names: "Alt", "AltGraph" (Option on Mac),
 *   "Control", "Shift", "Meta" (Command on Mac)
 * - Keys are joined with "+"
 * - Non-modifier keys are normalized to their `KeyboardEvent.key` equivalents
 * - Special characters are HTML-escaped for safe use in HTML attributes
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts
 *
 * @example
 * ```js
 * // Assuming macOS:
 * ariaKeyShortcut.primary( 'm' )
 * // "Meta+M"
 *
 * ariaKeyShortcut.primaryAlt( 'm' )
 * // "AltGraph+Meta+M"
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
			const isApple = _isApple();
			const modifierKeys = modifier( _isApple ).map( ( key ) =>
				getAriaShortcutModifierName( key, isApple )
			);
			const normalizedCharacter =
				normalizeKeyForAriaShortcut( character );

			return [ ...modifierKeys, normalizedCharacter ].join( '+' );
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
 * An object containing all the various formats for a given shortcut.
 *
 * @param modifier  The modifier key combination to use, as a string.
 * @param character The character key to combine with the modifier.
 * @return Object containing the shortcut in different formats (as an ARIA label, as a string to be displayed to the end user, and as a value for the aria-keyshortcuts attribute).
 */
export const shortcutFormats = (
	modifier: WPKeycodeModifier,
	character: string
) => ( {
	shortcutAriaLabel: shortcutAriaLabel[ modifier ]( character ),
	displayShortcut: displayShortcut[ modifier ]( character ),
	ariaKeyShortcut: ariaKeyShortcut[ modifier ]( character ),
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
