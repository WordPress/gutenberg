/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as keyboardShortcutsStore } from '../store';
import type { WPShortcutKeyCombination } from '../store/actions';

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
		( select ) => select( keyboardShortcutsStore ),
		[]
	);

	/**
	 * A function to check if a keyboard event matches a predefined shortcut
	 * combination.
	 *
	 * @param name  Shortcut name.
	 * @param event Event to check.
	 *
	 * @return True if the event matches unknown shortcuts, false if not.
	 */
	function isMatch( name: string, event: KeyboardEvent ) {
		return getAllShortcutKeyCombinations( name ).some(
			( combination: WPShortcutKeyCombination | null ) => {
				if ( ! combination ) {
					return false;
				}
				const { modifier, character } = combination;
				return isKeyboardEvent[ modifier || 'undefined' ](
					event,
					character
				);
			}
		);
	}

	return isMatch;
}
