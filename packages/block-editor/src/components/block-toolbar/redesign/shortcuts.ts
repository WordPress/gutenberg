import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import {
	ariaKeyShortcut,
	displayShortcut,
	shortcutAriaLabel,
} from '@wordpress/keycodes';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * The shortcut shape `Menu` items take.
 */
export type MenuShortcut = {
	displayShortcut: string;
	ariaKeyShortcut: string;
	label: string;
};

/**
 * Turns a key combination into the shortcut shape `Menu` items take.
 *
 * @param combination A `{ modifier, character }` key combination.
 * @return The menu shortcut.
 */
export function toMenuShortcut(
	combination?: { modifier?: string; character?: string } | null
): MenuShortcut | undefined {
	if ( ! combination?.character ) {
		return undefined;
	}
	const { modifier, character } = combination;
	type Modifier = keyof typeof displayShortcut;
	if ( ! modifier ) {
		return {
			displayShortcut: character.toUpperCase(),
			ariaKeyShortcut: character,
			label: character,
		};
	}
	return {
		displayShortcut: displayShortcut[ modifier as Modifier ]( character ),
		ariaKeyShortcut: ariaKeyShortcut[ modifier as Modifier ]( character ),
		label: shortcutAriaLabel[ modifier as Modifier ]( character ),
	};
}

/**
 * Turns a shortcut that is only known as display text (the rich text toolbar
 * buttons pass it that way) into the shape `Menu` items take.
 *
 * @param text The displayed shortcut.
 * @return The menu shortcut.
 */
export function textToMenuShortcut( text?: unknown ): MenuShortcut | undefined {
	if ( ! text || typeof text !== 'string' ) {
		return undefined;
	}
	return { displayShortcut: text, ariaKeyShortcut: '', label: text };
}

const SHORTCUT_NAMES = {
	copy: 'core/block-editor/copy',
	cut: 'core/block-editor/cut',
	duplicate: 'core/block-editor/duplicate',
	remove: 'core/block-editor/remove',
	insertBefore: 'core/block-editor/insert-before',
	insertAfter: 'core/block-editor/insert-after',
	group: 'core/block-editor/group',
	pasteStyles: 'core/block-editor/paste-styles',
	rename: 'core/block-editor/rename',
	hide: 'core/block-editor/toggle-block-visibility',
};

/**
 * Returns the menu shortcuts for the block actions in the options menu.
 *
 * @return Menu shortcuts, keyed by action.
 */
export function useBlockActionShortcuts(): Record<
	keyof typeof SHORTCUT_NAMES,
	MenuShortcut | undefined
> {
	// The store hands back the same combination objects until they change,
	// so the shallow comparison `useSelect` does keeps this stable.
	const combinations = useSelect( ( select ) => {
		const { getShortcutKeyCombination } = select( keyboardShortcutsStore );
		return Object.fromEntries(
			Object.entries( SHORTCUT_NAMES ).map( ( [ key, name ] ) => [
				key,
				getShortcutKeyCombination( name ),
			] )
		);
	}, [] );
	return useMemo(
		() =>
			Object.fromEntries(
				Object.entries( combinations ).map(
					( [ key, combination ] ) => [
						key,
						toMenuShortcut( combination as any ),
					]
				)
			) as Record<
				keyof typeof SHORTCUT_NAMES,
				MenuShortcut | undefined
			>,
		[ combinations ]
	);
}
