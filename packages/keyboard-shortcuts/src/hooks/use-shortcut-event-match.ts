/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as keyboardShortcutsStore } from '../store';

/**
 * Returns a function to check if a keyboard event matches a shortcut name.
 *
 * @return A function to check if a keyboard event matches a
 *         predefined shortcut combination.
 */
export default function useShortcutEventMatch(): (
	name: string,
	event: KeyboardEvent
) => boolean {
	const { getAllShortcutKeyCombinations } = useSelect(
		keyboardShortcutsStore
	);

	/**
	 * A function to check if a keyboard event matches a predefined shortcut
	 * combination.
	 *
	 * @param name  Shortcut name.
	 * @param event Event to check.
	 *
	 * @return True if the event matches the shortcuts, false if not.
	 */
	return useCallback(
		( name: string, event: KeyboardEvent ) => {
			return getAllShortcutKeyCombinations( name ).some(
				( combination ) => {
					if ( ! combination ) {
						return false;
					}
					return isKeyboardEvent[
						combination.modifier ?? 'undefined'
					]( event, combination.character );
				}
			);
		},
		[ getAllShortcutKeyCombinations ]
	);
}
