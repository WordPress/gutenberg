/**
 * WordPress dependencies
 */
import { displayShortcutList, shortcutAriaLabel } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

const {
	// Cmd+<key> on a mac, Ctrl+<key> elsewhere.
	primary,
	// Shift+Cmd+<key> on a mac, Ctrl+Shift+<key> elsewhere.
	primaryShift,
	// Ctrl+Alt+<key> on a mac, Shift+Alt+<key> elsewhere.
	access,
	ctrl,
	alt,
	ctrlShift,
} = displayShortcutList;

export const mainShortcuts = [
	{
		keyCombination: access( 'h' ),
		description: __( 'Display these keyboard shortcuts.' ),
	},
];

export const globalShortcuts = [
	'core/editor/save',
	'core/editor/undo',
	'core/editor/redo',
	'core/edit-post/toggle-sidebar',
	{
		keyCombination: access( 'o' ),
		description: __( 'Open the block navigation menu.' ),
	},
	{
		keyCombination: ctrl( '`' ),
		description: __( 'Navigate to the next part of the editor.' ),
		ariaLabel: shortcutAriaLabel.ctrl( '`' ),
	},
	{
		keyCombination: ctrlShift( '`' ),
		description: __( 'Navigate to the previous part of the editor.' ),
		ariaLabel: shortcutAriaLabel.ctrlShift( '`' ),
	},
	{
		keyCombination: access( 'n' ),
		description: __( 'Navigate to the next part of the editor (alternative).' ),
	},
	{
		keyCombination: access( 'p' ),
		description: __( 'Navigate to the previous part of the editor (alternative).' ),
	},
	{
		keyCombination: alt( 'F10' ),
		description: __( 'Navigate to the nearest toolbar.' ),
	},
	'core/edit-post/toggle-mode',
];

export const textFormattingShortcuts = [
	{
		keyCombination: primary( 'b' ),
		description: __( 'Make the selected text bold.' ),
	},
	{
		keyCombination: primary( 'i' ),
		description: __( 'Make the selected text italic.' ),
	},
	{
		keyCombination: primary( 'k' ),
		description: __( 'Convert the selected text into a link.' ),
	},
	{
		keyCombination: primaryShift( 'k' ),
		description: __( 'Remove a link.' ),
	},
	{
		keyCombination: primary( 'u' ),
		description: __( 'Underline the selected text.' ),
	},
];
