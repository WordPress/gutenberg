import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import {
	ariaKeyShortcut,
	displayShortcut,
	shortcutAriaLabel,
} from '@wordpress/keycodes';
import type { WPKeycodeModifier } from '@wordpress/keycodes';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * A keyboard shortcut as `Menu` items of `@wordpress/ui` take it.
 */
export interface MenuShortcut {
	displayShortcut: string;
	ariaKeyShortcut: string;
	label: string;
}

/**
 * Builds a menu shortcut from a modifier and a character.
 *
 * @param modifier  The modifier, e.g. `primary`.
 * @param character The character.
 * @return The menu shortcut.
 */
export function getMenuShortcut(
	modifier: WPKeycodeModifier,
	character: string
): MenuShortcut {
	return {
		displayShortcut: displayShortcut[ modifier ]( character ),
		ariaKeyShortcut: ariaKeyShortcut[ modifier ]( character ),
		label: shortcutAriaLabel[ modifier ]( character ),
	};
}

/**
 * Builds a menu shortcut from a shortcut as displayed, for shortcuts that are
 * only known that way, such as those of rich text formats. The displayed
 * text is also the accessible label.
 *
 * @param shortcut The shortcut as displayed.
 * @return The menu shortcut, or nothing without a shortcut.
 */
export function getMenuShortcutFromDisplay(
	shortcut?: unknown
): MenuShortcut | undefined {
	if ( typeof shortcut !== 'string' || ! shortcut ) {
		return undefined;
	}
	return {
		displayShortcut: shortcut,
		// Unknown; the item then sets no `aria-keyshortcuts`.
		ariaKeyShortcut: undefined as unknown as string,
		label: shortcut,
	};
}

/**
 * Returns the menu shortcuts of registered keyboard shortcuts.
 *
 * @param names The names of the registered shortcuts, by key.
 * @return The menu shortcuts, by key. A shortcut that is not registered is
 *         left out.
 */
export function useMenuShortcuts< K extends string >(
	names: Record< K, string >
): Partial< Record< K, MenuShortcut > > {
	// Selects the stored combinations, which keep their identity, so the
	// shallow comparison of `useSelect` holds.
	const combinations = useSelect(
		( select ) => {
			const { getShortcutKeyCombination } = select(
				keyboardShortcutsStore
			);
			return Object.fromEntries(
				Object.entries< string >( names ).map( ( [ key, name ] ) => [
					key,
					getShortcutKeyCombination( name ),
				] )
			);
		},
		[ names ]
	);

	return useMemo( () => {
		const shortcuts: Partial< Record< K, MenuShortcut > > = {};
		for ( const [ key, combination ] of Object.entries( combinations ) ) {
			if ( ! combination?.character ) {
				continue;
			}
			shortcuts[ key as K ] = combination.modifier
				? getMenuShortcut(
						combination.modifier as WPKeycodeModifier,
						combination.character
					)
				: {
						displayShortcut: combination.character,
						ariaKeyShortcut: combination.character,
						label: combination.character,
					};
		}
		return shortcuts;
	}, [ combinations ] );
}

/**
 * Whether a label matches a search.
 *
 * @param label  The label.
 * @param search The search, already trimmed and lower case.
 * @return Whether the label matches.
 */
export function matchesSearch( label: string, search: string ) {
	return label.toLocaleLowerCase().includes( search );
}
