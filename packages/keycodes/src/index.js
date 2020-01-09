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
 * External dependencies
 */
import { get, mapValues, includes, capitalize, xor } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isAppleOS } from './platform';

/** @typedef {'alt'|'ctrl'|'meta'|'shift'} WPModifierPart */

/** @typedef {'primary'|'primaryShift'|'primaryAlt'|'secondary'|'access'|'ctrl'|'alt'|'ctrlShift'|'shift'|'shiftAlt'} WPKeycodeModifier */

/**
 * An object of handler functions for each of the possible modifier
 * combinations. A handler will return a value for a given key.
 *
 * @template T
 *
 * @typedef {{[M in WPKeycodeModifier]:T}} WPModifierHandler
 */

/**
 * @template T
 *
 * @typedef {(character:string,isApple?:()=>boolean)=>T} WPKeyHandler
 */

/**
 * @template T
 *
 * @typedef {(event:KeyboardEvent,character:string,isApple?:()=>boolean)=>T} WPEventKeyHandler
 */

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
 *
 * @type {WPModifierPart}
 */
export const ALT = 'alt';

/**
 * Keycode for CTRL key.
 *
 * @type {WPModifierPart}
 */
export const CTRL = 'ctrl';

/**
 * Keycode for COMMAND/META key.
 *
 * @type {WPModifierPart}
 */
export const COMMAND = 'meta';

/**
 * Keycode for SHIFT key.
 *
 * @type {WPModifierPart}
 */
export const SHIFT = 'shift';

/**
 * Keycode for ZERO key.
 */
export const ZERO = 48;

/**
 * Object that contains functions that return the available modifier
 * depending on platform.
 *
 * @type {{[M in WPKeycodeModifier]:(isApple:()=>boolean)=>WPModifierPart[]}}
 */
export const modifiers = {
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
};

/**
 * An object that contains functions to get raw shortcuts.
 *
 * These are intended for user with the KeyboardShortcuts.
 *
 * @example
 * ```
 * // Assuming macOS:
 * rawShortcut.primary( 'm' )
 * // "meta+m""
 * ```
 *
 * @type {WPModifierHandler<WPKeyHandler<string>>} Keyed map of functions to raw
 *                                                 shortcuts.
 */
export const rawShortcut = mapValues( modifiers, ( modifier ) => {
	return /** @type {WPKeyHandler<string>} */ (
		character,
		_isApple = isAppleOS
	) => {
		return [ ...modifier( _isApple ), character.toLowerCase() ].join( '+' );
	};
} );

/**
 * Return an array of the parts of a keyboard shortcut chord for display.
 *
 * @example
 * ```
 * // Assuming macOS:
 * displayShortcutList.primary( 'm' );
 * // [ "⌘", "M" ]
 * ```
 *
 * @type {WPModifierHandler<WPKeyHandler<string[]>>} Keyed map of functions to
 *                                                   shortcut sequences.
 */
export const displayShortcutList = mapValues( modifiers, ( modifier ) => {
	return /** @type {WPKeyHandler<string[]>} */ (
		character,
		_isApple = isAppleOS
	) => {
		const isApple = _isApple();
		const replacementKeyMap = {
			[ ALT ]: isApple ? '⌥' : 'Alt',
			[ CTRL ]: isApple ? '⌃' : 'Ctrl', // Make sure ⌃ is the U+2303 UP ARROWHEAD unicode character and not the caret character.
			[ COMMAND ]: '⌘',
			[ SHIFT ]: isApple ? '⇧' : 'Shift',
		};

		const modifierKeys = modifier( _isApple ).reduce(
			( accumulator, key ) => {
				const replacementKey = get( replacementKeyMap, key, key );
				// If on the Mac, adhere to platform convention and don't show plus between keys.
				if ( isApple ) {
					return [ ...accumulator, replacementKey ];
				}

				return [ ...accumulator, replacementKey, '+' ];
			},
			/** @type {string[]} */ ( [] )
		);

		const capitalizedCharacter = capitalize( character );
		return [ ...modifierKeys, capitalizedCharacter ];
	};
} );

/**
 * An object that contains functions to display shortcuts.
 *
 * @example
 * ```
 * // Assuming macOS:
 * E.g. displayShortcut.primary( 'm' );
 * // "⌘M"
 * ```
 *
 * @type {WPModifierHandler<WPKeyHandler<string>>} Keyed map of functions to
 *                                                 display shortcuts.
 */
export const displayShortcut = mapValues(
	displayShortcutList,
	( shortcutList ) => {
		return /** @type {WPKeyHandler<string>} */ (
			character,
			_isApple = isAppleOS
		) => shortcutList( character, _isApple ).join( '' );
	}
);

/**
 * An object that contains functions to return an aria label for a keyboard
 * shortcut.
 *
 * @example
 * ```
 * // Assuming macOS:
 * shortcutAriaLabel.primary( '.' );
 * // "Command + Period"
 * ```
 *
 * @type {WPModifierHandler<WPKeyHandler<string>>} Keyed map of functions to
 *                                                 shortcut ARIA labels.
 */
export const shortcutAriaLabel = mapValues( modifiers, ( modifier ) => {
	return /** @type {WPKeyHandler<string>} */ (
		character,
		_isApple = isAppleOS
	) => {
		const isApple = _isApple();
		const replacementKeyMap = {
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
		};

		return [ ...modifier( _isApple ), character ]
			.map( ( key ) => capitalize( get( replacementKeyMap, key, key ) ) )
			.join( isApple ? ' ' : ' + ' );
	};
} );

/**
 * From a given KeyboardEvent, returns an array of active modifier constants for
 * the event.
 *
 * @param {KeyboardEvent} event Keyboard event.
 *
 * @return {Array<ALT|CTRL|COMMAND|SHIFT>} Active modifier constants.
 */
function getEventModifiers( event ) {
	return [ ALT, CTRL, COMMAND, SHIFT ].filter(
		( key ) => event[ `${ key }Key` ]
	);
}

/**
 * An object that contains functions to check if a keyboard event matches a
 * predefined shortcut combination.
 *
 * @example
 * ```
 * // Assuming an event for ⌘M key press:
 * isKeyboardEvent.primary( event, 'm' );
 * // true
 * ```
 *
 * @type {WPModifierHandler<WPEventKeyHandler<boolean>>} Keyed map of functions
 *                                                       to match events.
 */
export const isKeyboardEvent = mapValues( modifiers, ( getModifiers ) => {
	return /** @type {WPEventKeyHandler<boolean>} */ (
		event,
		character,
		_isApple = isAppleOS
	) => {
		const mods = getModifiers( _isApple );
		const eventMods = getEventModifiers( event );

		if ( xor( mods, eventMods ).length ) {
			return false;
		}

		if ( ! character ) {
			return includes( mods, event.key.toLowerCase() );
		}

		return event.key === character;
	};
} );
