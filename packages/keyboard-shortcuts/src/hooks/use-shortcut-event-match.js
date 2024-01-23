/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as keyboardShortcutsStore } from '../store';

/**
 * Returns a function to check if a keyboard event matches a shortcut name.
 *
 * @return {Function} A function to check if a keyboard event matches a
 *                    predefined shortcut combination.
 */
export default function useShortcutEventMatch() {
	const { getAllShortcutKeyCombinations } = useSelect(
		keyboardShortcutsStore
	);

	/**
	 * A function to check if a keyboard event matches a predefined shortcut
	 * combination.
	 *
	 * @param {string}        name  Shortcut name.
	 * @param {KeyboardEvent} event Event to check.
	 *
	 * @return {boolean} True if the event matches any shortcuts, false if not.
	 */
	function isMatch( name, event ) {
		return getAllShortcutKeyCombinations( name ).some(
			( { modifier, character } ) => {
				return isKeyboardEvent[ modifier ]( event, character );
			}
		);
	}

	return isMatch;
}
