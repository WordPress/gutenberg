/**
 * WordPress dependencies
 */
import { rawShortcut } from '@wordpress/keycodes';
import { __unstableUseKeyboardShortcutRef as useKeyboardShortcutRef } from '@wordpress/compose';

/**
 * Set of keyboard shortcuts handled internally by RichText.
 *
 * @type {Array}
 */
const HANDLED_SHORTCUTS = [
	rawShortcut.primary( 'z' ),
	rawShortcut.primaryShift( 'z' ),
	rawShortcut.primary( 'y' ),
];

const preventDefault = ( event ) => event.preventDefault();

/**
 * Hook to prevent default behaviors for key combinations otherwise handled
 * internally by RichText.
 *
 * @return {import('react').RefObject} The component to be rendered.
 */
export function useRemoveBrowserShortcuts() {
	return useKeyboardShortcutRef( HANDLED_SHORTCUTS, preventDefault );
}
