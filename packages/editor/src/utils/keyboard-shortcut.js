import {
	ariaKeyShortcut,
	displayShortcut,
	shortcutAriaLabel,
} from '@wordpress/keycodes';

/**
 * Builds the shortcut representations expected by the `Menu` component.
 *
 * @param {Object}  keyCombination           Shortcut key combination.
 * @param {string}  keyCombination.character Character of the shortcut.
 * @param {?string} keyCombination.modifier  Modifier of the shortcut.
 *
 * @return {?Object} Shortcut representations, or `null` for an empty combination.
 */
export function getKeyboardShortcut( { character, modifier } = {} ) {
	if ( ! character ) {
		return null;
	}

	if ( ! modifier ) {
		return {
			ariaKeyShortcut: character,
			displayShortcut: character,
			label: character,
		};
	}

	return {
		ariaKeyShortcut: ariaKeyShortcut[ modifier ]( character ),
		displayShortcut: displayShortcut[ modifier ]( character ),
		label: shortcutAriaLabel[ modifier ]( character ),
	};
}
